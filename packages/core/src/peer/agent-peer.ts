import { createEnvelope } from "../protocol/envelope.js";
import { A2AError } from "../protocol/errors.js";
import { createId, nowIso } from "../protocol/ids.js";
import {
  PROTOCOL_VERSION,
  type A2AEnvelope,
  type AgentCapability,
  type AgentId,
  type CapabilitiesAnnouncePayload,
  type CapabilitiesQueryPayload,
  type ErrorPayload,
  type EventPayload,
  type HelloAckPayload,
  type HelloPayload,
  type TaskAcceptPayload,
  type TaskCancelPayload,
  type TaskFailedPayload,
  type TaskOfferPayload,
  type TaskProgressPayload,
  type TaskRejectPayload,
  type TaskResultPayload,
  type TaskStartPayload,
} from "../protocol/types.js";
import {
  filterCapabilities,
  hasAllCapabilities,
  missingCapabilities,
} from "../discovery/capabilities.js";
import type { Transport, Unsubscribe } from "../transport/types.js";
import { withRetry } from "../util/retry.js";
import type { AuditEvent, AuditHook, PolicyHook } from "./hooks.js";
import type {
  AgentPeerOptions,
  OfferTaskOptions,
  RemotePeer,
  TaskContext,
  TaskHandler,
  TaskOutcome,
} from "./types.js";

interface PendingOffer {
  resolve: (outcome: TaskOutcome) => void;
  reject: (err: Error) => void;
  progress: TaskProgressPayload[];
  events: EventPayload[];
  timer?: ReturnType<typeof setTimeout>;
}

interface LocalTask {
  cancelled: boolean;
  from: AgentId;
}

/**
 * AgentPeer — SDK-agnostic interop endpoint for mixed-runtime fleets.
 * Wire any agent brain (LLM SDK, rules engine, human) behind TaskHandler callbacks.
 * Local interop profile maps conceptually to LF A2A; does not replace that standard.
 */
export class AgentPeer {
  readonly profile;
  private readonly transport: Transport;
  private readonly handlers: Record<string, TaskHandler>;
  private readonly defaultHandler?: TaskHandler;
  private readonly defaultTaskTimeoutMs?: number;
  private readonly onMessage?: (message: A2AEnvelope) => void;
  private readonly policy?: PolicyHook;
  private readonly audit?: AuditHook;

  private unsubscribe: Unsubscribe | null = null;
  private started = false;

  private readonly remotes = new Map<AgentId, RemotePeer>();
  private readonly pendingOffers = new Map<string, PendingOffer>();
  private readonly localTasks = new Map<string, LocalTask>();

  constructor(options: AgentPeerOptions) {
    this.profile = options.profile;
    this.transport = options.transport;
    this.handlers = options.handlers ?? {};
    if (options.defaultHandler) this.defaultHandler = options.defaultHandler;
    if (options.defaultTaskTimeoutMs !== undefined) {
      this.defaultTaskTimeoutMs = options.defaultTaskTimeoutMs;
    }
    if (options.onMessage) this.onMessage = options.onMessage;
    if (options.policy) this.policy = options.policy;
    if (options.audit) this.audit = options.audit;
  }

  get id(): AgentId {
    return this.profile.id;
  }

  get capabilities(): AgentCapability[] {
    return this.profile.capabilities;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.unsubscribe = this.transport.subscribe((message) => {
      void this.handleInbound(message);
    });
  }

  async stop(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.started = false;
    for (const pending of this.pendingOffers.values()) {
      if (pending.timer) clearTimeout(pending.timer);
      pending.resolve({ status: "cancelled", reason: "peer stopped" });
    }
    this.pendingOffers.clear();
    await this.transport.close();
  }

  listRemotes(): RemotePeer[] {
    return [...this.remotes.values()];
  }

  getRemote(agentId: AgentId): RemotePeer | undefined {
    return this.remotes.get(agentId);
  }

  /** Initiate handshake with a peer (or broadcast hello). */
  async hello(to: AgentId | "*" = "*"): Promise<void> {
    this.ensureStarted();
    const payload: HelloPayload = { profile: this.profile };
    await this.send(
      createEnvelope({
        type: "hello",
        from: this.id,
        to,
        payload,
      }),
    );
  }

  async queryCapabilities(to: AgentId, filter?: string[]): Promise<AgentCapability[]> {
    this.ensureStarted();
    const remote = this.remotes.get(to);
    if (remote && !filter) {
      return remote.capabilities;
    }

    return new Promise<AgentCapability[]>((resolve, reject) => {
      const queryPayload: CapabilitiesQueryPayload = {};
      if (filter !== undefined) queryPayload.filter = filter;
      const request = createEnvelope({
        type: "capabilities.query",
        from: this.id,
        to,
        payload: queryPayload,
        sessionId: remote?.sessionId,
      });

      const timeout = setTimeout(() => {
        cleanup();
        reject(new A2AError("TIMEOUT", `capabilities.query timed out for ${to}`, { retryable: true }));
      }, 5_000);

      const unsub = this.transport.subscribe((message) => {
        if (
          message.type === "capabilities.announce" &&
          message.from === to &&
          message.correlationId === request.id
        ) {
          cleanup();
          const payload = message.payload as CapabilitiesAnnouncePayload;
          resolve(payload.capabilities);
        }
      });

      const cleanup = () => {
        clearTimeout(timeout);
        unsub();
      };

      void this.send(request).catch((err) => {
        cleanup();
        reject(err);
      });
    });
  }

  /**
   * Offer a task to a peer and wait for terminal outcome (result / failed / rejected / cancelled).
   * Set `retries` to re-attempt on failed/timeout (not on reject / policy deny).
   */
  async offerTask(options: OfferTaskOptions): Promise<TaskOutcome> {
    this.ensureStarted();
    const retries = options.retries ?? 0;
    if (retries <= 0) {
      return this.offerTaskOnce(options);
    }

    return withRetry(
      async () => {
        const outcome = await this.offerTaskOnce({
          ...options,
          taskId: createId("task"),
          retries: 0,
        });
        if (outcome.status === "failed") {
          throw new A2AError(outcome.error.code, outcome.error.message, {
            retryable: outcome.error.code === "TIMEOUT" || outcome.error.code === "INTERNAL",
            taskId: outcome.error.taskId,
          });
        }
        return outcome;
      },
      {
        attempts: retries + 1,
        shouldRetry: (err) => err instanceof A2AError && err.retryable,
      },
    ).catch(async (err) => {
      if (err instanceof A2AError) {
        return {
          status: "failed" as const,
          error: {
            taskId: err.taskId ?? "unknown",
            code: err.code,
            message: err.message,
          },
        };
      }
      throw err;
    });
  }

  private async offerTaskOnce(options: OfferTaskOptions): Promise<TaskOutcome> {
    const remote = this.remotes.get(options.to);
    const taskId = options.taskId ?? createId("task");

    const offer: TaskOfferPayload = {
      taskId,
      goal: options.goal,
    };
    if (options.input !== undefined) offer.input = options.input;
    if (options.requiredCapabilities) offer.requiredCapabilities = options.requiredCapabilities;
    if (options.timeoutMs !== undefined) offer.timeoutMs = options.timeoutMs;
    if (options.meta) offer.meta = options.meta;

    if (this.policy?.beforeOffer) {
      const decision = await this.policy.beforeOffer({
        from: this.id,
        to: options.to,
        offer,
      });
      if (!decision.allow) {
        await this.auditRecord({
          type: "policy.deny",
          ts: nowIso(),
          agentId: this.id,
          peerId: options.to,
          taskId,
          detail: { side: "offer", reason: decision.reason },
        });
        return { status: "rejected", reason: decision.reason };
      }
    }

    return new Promise<TaskOutcome>((resolve, reject) => {
      const pending: PendingOffer = {
        resolve,
        reject,
        progress: [],
        events: [],
      };

      const timeoutMs = options.timeoutMs ?? this.defaultTaskTimeoutMs;
      if (timeoutMs !== undefined) {
        pending.timer = setTimeout(() => {
          this.pendingOffers.delete(taskId);
          resolve({
            status: "failed",
            error: {
              taskId,
              code: "TIMEOUT",
              message: `Task ${taskId} timed out after ${timeoutMs}ms`,
            },
          });
        }, timeoutMs);
      }

      this.pendingOffers.set(taskId, pending);

      void this.send(
        createEnvelope({
          type: "task.offer",
          from: this.id,
          to: options.to,
          payload: offer,
          sessionId: remote?.sessionId,
        }),
      ).catch((err) => {
        if (pending.timer) clearTimeout(pending.timer);
        this.pendingOffers.delete(taskId);
        reject(err);
      });
    });
  }

  async cancelTask(to: AgentId, taskId: string, reason?: string): Promise<void> {
    const remote = this.remotes.get(to);
    const payload: TaskCancelPayload = { taskId };
    if (reason !== undefined) payload.reason = reason;
    await this.send(
      createEnvelope({
        type: "task.cancel",
        from: this.id,
        to,
        payload,
        sessionId: remote?.sessionId,
      }),
    );
  }

  private ensureStarted(): void {
    if (!this.started) {
      throw new A2AError("INTERNAL", "AgentPeer.start() must be called before use");
    }
  }

  private async send(message: A2AEnvelope): Promise<void> {
    await this.transport.send(message);
    const peerId = message.to === "*" ? "*" : message.to;
    await this.auditEnvelope(message, peerId);
  }

  private async auditRecord(event: AuditEvent): Promise<void> {
    await this.audit?.record(event);
  }

  private async auditEnvelope(message: A2AEnvelope, peerId: AgentId): Promise<void> {
    const auditTypes = new Set([
      "hello",
      "hello.ack",
      "capabilities.query",
      "capabilities.announce",
      "task.offer",
      "task.accept",
      "task.reject",
      "task.start",
      "task.progress",
      "task.result",
      "task.failed",
      "task.cancel",
      "event",
      "error",
    ]);
    if (!auditTypes.has(message.type)) return;
    const payload = message.payload as { taskId?: string } | undefined;
    await this.auditRecord({
      type: message.type as AuditEvent["type"],
      ts: nowIso(),
      agentId: this.id,
      peerId,
      taskId: payload?.taskId,
      envelope: message,
    });
  }

  private async handleInbound(message: A2AEnvelope): Promise<void> {
    this.onMessage?.(message);
    await this.auditEnvelope(message, message.from);

    if (message.v !== PROTOCOL_VERSION) {
      await this.sendError(message.from, {
        code: "PROTOCOL_VERSION",
        message: `Unsupported protocol version: ${String(message.v)}`,
        retryable: false,
      }, message.id);
      return;
    }

    if (message.to !== "*" && message.to !== this.id) {
      return;
    }

    try {
      switch (message.type) {
        case "hello":
          await this.onHello(message);
          break;
        case "hello.ack":
          this.onHelloAck(message);
          break;
        case "capabilities.query":
          await this.onCapabilitiesQuery(message);
          break;
        case "capabilities.announce":
          this.onCapabilitiesAnnounce(message);
          break;
        case "task.offer":
          await this.onTaskOffer(message);
          break;
        case "task.accept":
        case "task.reject":
        case "task.start":
        case "task.progress":
        case "task.result":
        case "task.failed":
        case "event":
          this.onTaskLifecycle(message);
          break;
        case "task.cancel":
          this.onTaskCancel(message);
          break;
        case "ping":
          await this.onPing(message);
          break;
        case "pong":
        case "error":
          break;
        default:
          await this.sendError(
            message.from,
            {
              code: "UNKNOWN_TYPE",
              message: `Unknown message type: ${String((message as A2AEnvelope).type)}`,
              retryable: false,
            },
            message.id,
          );
      }
    } catch (err) {
      const error =
        err instanceof A2AError
          ? err.toPayload()
          : {
              code: "INTERNAL" as const,
              message: err instanceof Error ? err.message : "Unknown error",
              retryable: false,
            };
      await this.sendError(message.from, error, message.id);
    }
  }

  private async onHello(message: A2AEnvelope): Promise<void> {
    const payload = message.payload as HelloPayload;
    const sessionId = createId("sess");
    this.remotes.set(payload.profile.id, {
      agentId: payload.profile.id,
      profile: payload.profile,
      sessionId,
      capabilities: payload.profile.capabilities,
    });

    const ack: HelloAckPayload = {
      profile: this.profile,
      sessionId,
    };
    await this.send(
      createEnvelope({
        type: "hello.ack",
        from: this.id,
        to: message.from,
        payload: ack,
        correlationId: message.id,
        sessionId,
      }),
    );
  }

  private onHelloAck(message: A2AEnvelope): void {
    const payload = message.payload as HelloAckPayload;
    this.remotes.set(payload.profile.id, {
      agentId: payload.profile.id,
      profile: payload.profile,
      sessionId: payload.sessionId,
      capabilities: payload.profile.capabilities,
    });
  }

  private async onCapabilitiesQuery(message: A2AEnvelope): Promise<void> {
    const payload = (message.payload ?? {}) as CapabilitiesQueryPayload;
    const capabilities = filterCapabilities(this.profile.capabilities, payload.filter);
    const remote = this.remotes.get(message.from);
    await this.send(
      createEnvelope({
        type: "capabilities.announce",
        from: this.id,
        to: message.from,
        payload: { capabilities } satisfies CapabilitiesAnnouncePayload,
        correlationId: message.id,
        sessionId: remote?.sessionId,
      }),
    );
  }

  private onCapabilitiesAnnounce(message: A2AEnvelope): void {
    const payload = message.payload as CapabilitiesAnnouncePayload;
    const existing = this.remotes.get(message.from);
    if (existing) {
      existing.capabilities = payload.capabilities;
      existing.profile = { ...existing.profile, capabilities: payload.capabilities };
    }
  }

  private async onTaskOffer(message: A2AEnvelope): Promise<void> {
    const offer = message.payload as TaskOfferPayload;
    const remote = this.remotes.get(message.from);
    const missing = missingCapabilities(this.profile.capabilities, offer.requiredCapabilities);

    if (missing.length > 0 || !hasAllCapabilities(this.profile.capabilities, offer.requiredCapabilities)) {
      const reject: TaskRejectPayload = {
        taskId: offer.taskId,
        reason: `Missing capabilities: ${missing.join(", ") || "required"}`,
        code: "CAPABILITY_MISMATCH",
      };
      await this.send(
        createEnvelope({
          type: "task.reject",
          from: this.id,
          to: message.from,
          payload: reject,
          correlationId: message.id,
          sessionId: remote?.sessionId,
        }),
      );
      return;
    }

    if (this.policy?.beforeAccept) {
      const decision = await this.policy.beforeAccept({
        from: message.from,
        to: this.id,
        offer,
        localProfile: this.profile,
      });
      if (!decision.allow) {
        await this.auditRecord({
          type: "policy.deny",
          ts: nowIso(),
          agentId: this.id,
          peerId: message.from,
          taskId: offer.taskId,
          detail: { side: "accept", reason: decision.reason },
        });
        const reject: TaskRejectPayload = {
          taskId: offer.taskId,
          reason: decision.reason,
          code: "REJECTED",
        };
        await this.send(
          createEnvelope({
            type: "task.reject",
            from: this.id,
            to: message.from,
            payload: reject,
            correlationId: message.id,
            sessionId: remote?.sessionId,
          }),
        );
        return;
      }
    }

    const handler = this.resolveHandler(offer.requiredCapabilities);
    if (!handler) {
      const reject: TaskRejectPayload = {
        taskId: offer.taskId,
        reason: "No handler registered for offered task",
        code: "REJECTED",
      };
      await this.send(
        createEnvelope({
          type: "task.reject",
          from: this.id,
          to: message.from,
          payload: reject,
          correlationId: message.id,
          sessionId: remote?.sessionId,
        }),
      );
      return;
    }

    const accept: TaskAcceptPayload = {
      taskId: offer.taskId,
      message: "accepted",
    };
    await this.send(
      createEnvelope({
        type: "task.accept",
        from: this.id,
        to: message.from,
        payload: accept,
        correlationId: message.id,
        sessionId: remote?.sessionId,
      }),
    );

    this.localTasks.set(offer.taskId, { cancelled: false, from: message.from });

    const start: TaskStartPayload = { taskId: offer.taskId };
    await this.send(
      createEnvelope({
        type: "task.start",
        from: this.id,
        to: message.from,
        payload: start,
        sessionId: remote?.sessionId,
      }),
    );

    const ctx: TaskContext = {
      taskId: offer.taskId,
      offer,
      from: message.from,
      reportProgress: async (update) => {
        const progress: TaskProgressPayload = { taskId: offer.taskId, ...update };
        await this.send(
          createEnvelope({
            type: "task.progress",
            from: this.id,
            to: message.from,
            payload: progress,
            sessionId: remote?.sessionId,
          }),
        );
      },
      emitEvent: async (event) => {
        const payload: EventPayload = { taskId: offer.taskId, ...event };
        await this.send(
          createEnvelope({
            type: "event",
            from: this.id,
            to: message.from,
            payload,
            sessionId: remote?.sessionId,
          }),
        );
      },
      isCancelled: () => this.localTasks.get(offer.taskId)?.cancelled === true,
    };

    try {
      const output = await handler(ctx);
      if (ctx.isCancelled()) {
        return;
      }
      const result: TaskResultPayload = { taskId: offer.taskId, output };
      await this.send(
        createEnvelope({
          type: "task.result",
          from: this.id,
          to: message.from,
          payload: result,
          sessionId: remote?.sessionId,
        }),
      );
    } catch (err) {
      const failed: TaskFailedPayload = {
        taskId: offer.taskId,
        code: err instanceof A2AError ? err.code : "INTERNAL",
        message: err instanceof Error ? err.message : "Task failed",
        details: err instanceof A2AError ? err.details : undefined,
      };
      await this.send(
        createEnvelope({
          type: "task.failed",
          from: this.id,
          to: message.from,
          payload: failed,
          sessionId: remote?.sessionId,
        }),
      );
    } finally {
      this.localTasks.delete(offer.taskId);
    }
  }

  private resolveHandler(required: string[] | undefined): TaskHandler | undefined {
    if (required) {
      for (const name of required) {
        const handler = this.handlers[name];
        if (handler) return handler;
      }
    }
    const first = Object.values(this.handlers)[0];
    return first ?? this.defaultHandler;
  }

  private onTaskLifecycle(message: A2AEnvelope): void {
    const payload = message.payload as { taskId?: string };
    const taskId = payload.taskId;
    if (!taskId) return;
    const pending = this.pendingOffers.get(taskId);
    if (!pending) return;

    switch (message.type) {
      case "task.reject": {
        const reject = message.payload as TaskRejectPayload;
        if (pending.timer) clearTimeout(pending.timer);
        this.pendingOffers.delete(taskId);
        pending.resolve({ status: "rejected", reason: reject.reason });
        break;
      }
      case "task.progress":
        pending.progress.push(message.payload as TaskProgressPayload);
        break;
      case "event":
        pending.events.push(message.payload as EventPayload);
        break;
      case "task.result": {
        if (pending.timer) clearTimeout(pending.timer);
        this.pendingOffers.delete(taskId);
        pending.resolve({
          status: "completed",
          result: message.payload as TaskResultPayload,
        });
        break;
      }
      case "task.failed": {
        if (pending.timer) clearTimeout(pending.timer);
        this.pendingOffers.delete(taskId);
        pending.resolve({
          status: "failed",
          error: message.payload as TaskFailedPayload,
        });
        break;
      }
      case "task.accept":
      case "task.start":
        break;
      default:
        break;
    }
  }

  private onTaskCancel(message: A2AEnvelope): void {
    const payload = message.payload as TaskCancelPayload;
    const local = this.localTasks.get(payload.taskId);
    if (local) {
      local.cancelled = true;
    }
  }

  private async onPing(message: A2AEnvelope): Promise<void> {
    const remote = this.remotes.get(message.from);
    await this.send(
      createEnvelope({
        type: "pong",
        from: this.id,
        to: message.from,
        payload: message.payload,
        correlationId: message.id,
        sessionId: remote?.sessionId,
      }),
    );
  }

  private async sendError(
    to: AgentId,
    payload: ErrorPayload,
    correlationId?: string,
  ): Promise<void> {
    const remote = this.remotes.get(to);
    await this.send(
      createEnvelope({
        type: "error",
        from: this.id,
        to,
        payload,
        correlationId,
        sessionId: remote?.sessionId,
      }),
    );
  }
}
