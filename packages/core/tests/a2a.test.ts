import { describe, expect, it } from "vitest";
import {
  AgentPeer,
  HttpJsonTransport,
  MemoryAuditLog,
  createBus,
  hasAllCapabilities,
  missingCapabilities,
  resetHttpJsonStubs,
  withOutboundBuffer,
  withRetry,
  PROTOCOL_VERSION,
  type AgentProfile,
} from "../src/index.js";

function profile(
  id: string,
  capabilities: { name: string }[],
): AgentProfile {
  return {
    id,
    name: id,
    capabilities: capabilities.map((c) => ({ name: c.name })),
  };
}

async function settle(ms = 15): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

describe("capability matching", () => {
  it("detects missing capabilities", () => {
    const available = [{ name: "research.web" }];
    expect(hasAllCapabilities(available, ["research.web"])).toBe(true);
    expect(hasAllCapabilities(available, ["write.brief"])).toBe(false);
    expect(missingCapabilities(available, ["write.brief", "research.web"])).toEqual([
      "write.brief",
    ]);
  });
});

describe("withRetry", () => {
  it("retries until success", async () => {
    let n = 0;
    const value = await withRetry(
      async () => {
        n += 1;
        if (n < 3) throw new Error("transient");
        return "ok";
      },
      { attempts: 5, initialDelayMs: 1 },
    );
    expect(value).toBe("ok");
    expect(n).toBe(3);
  });
});

describe("AgentPeer handshake and task handoff", () => {
  it("completes hello and a successful task", async () => {
    const bus = createBus();
    const worker = new AgentPeer({
      profile: profile("worker", [{ name: "echo" }]),
      transport: withOutboundBuffer(bus.createTransport("worker")),
      handlers: {
        echo: async (ctx) => {
          await ctx.reportProgress({ percent: 50, message: "working" });
          await ctx.emitEvent({ name: "tick", data: 1 });
          return { echo: ctx.offer.input };
        },
      },
    });
    const client = new AgentPeer({
      profile: profile("client", []),
      transport: bus.createTransport("client"),
    });

    worker.start();
    client.start();

    await client.hello("worker");
    await settle();

    expect(client.getRemote("worker")?.profile.id).toBe("worker");
    expect(worker.getRemote("client")?.sessionId).toBeTruthy();

    const caps = await client.queryCapabilities("worker");
    expect(caps.map((c) => c.name)).toEqual(["echo"]);

    const outcome = await client.offerTask({
      to: "worker",
      goal: "Echo please",
      input: { hello: "world" },
      requiredCapabilities: ["echo"],
      timeoutMs: 5_000,
    });

    expect(outcome.status).toBe("completed");
    if (outcome.status === "completed") {
      expect(outcome.result.output).toEqual({ echo: { hello: "world" } });
    }

    await client.stop();
    await worker.stop();
    await bus.close();
  });

  it("rejects offers when capabilities do not match", async () => {
    const bus = createBus();
    const worker = new AgentPeer({
      profile: profile("worker", [{ name: "echo" }]),
      transport: bus.createTransport("worker"),
      handlers: {
        echo: async () => ({ ok: true }),
      },
    });
    const client = new AgentPeer({
      profile: profile("client", []),
      transport: bus.createTransport("client"),
    });

    worker.start();
    client.start();
    await client.hello("worker");
    await settle();

    const outcome = await client.offerTask({
      to: "worker",
      goal: "Do something else",
      requiredCapabilities: ["write.brief"],
      timeoutMs: 5_000,
    });

    expect(outcome.status).toBe("rejected");
    if (outcome.status === "rejected") {
      expect(outcome.reason).toMatch(/write\.brief/);
    }

    await client.stop();
    await worker.stop();
    await bus.close();
  });

  it("uses protocol version 1.0 on envelopes via hello", async () => {
    const bus = createBus();
    const seen: string[] = [];
    const a = new AgentPeer({
      profile: profile("a", []),
      transport: bus.createTransport("a"),
      onMessage: (m) => seen.push(m.v),
    });
    const b = new AgentPeer({
      profile: profile("b", []),
      transport: bus.createTransport("b"),
    });
    a.start();
    b.start();
    await a.hello("b");
    await settle();
    expect(seen.every((v) => v === PROTOCOL_VERSION)).toBe(true);
    await a.stop();
    await b.stop();
    await bus.close();
  });

  it("records audit events and honors policy deny on offer", async () => {
    const bus = createBus();
    const audit = new MemoryAuditLog();
    const worker = new AgentPeer({
      profile: profile("worker", [{ name: "echo" }]),
      transport: bus.createTransport("worker"),
      handlers: { echo: async () => ({ ok: true }) },
    });
    const client = new AgentPeer({
      profile: profile("client", []),
      transport: bus.createTransport("client"),
      audit,
      policy: {
        beforeOffer: ({ to }) =>
          to === "worker"
            ? { allow: false, reason: "maintenance window" }
            : { allow: true },
      },
    });

    worker.start();
    client.start();
    await client.hello("worker");
    await settle();

    const denied = await client.offerTask({
      to: "worker",
      goal: "should be denied",
      requiredCapabilities: ["echo"],
      timeoutMs: 2_000,
    });
    expect(denied.status).toBe("rejected");
    if (denied.status === "rejected") {
      expect(denied.reason).toMatch(/maintenance/);
    }
    expect(audit.events.some((e) => e.type === "policy.deny")).toBe(true);
    expect(audit.events.some((e) => e.type === "hello")).toBe(true);

    await client.stop();
    await worker.stop();
    await bus.close();
  });
});

describe("HttpJsonTransport stub", () => {
  it("hands off a task over stub HTTP endpoints", async () => {
    resetHttpJsonStubs();
    const worker = new AgentPeer({
      profile: profile("http-worker", [{ name: "echo" }]),
      transport: new HttpJsonTransport({
        endpoint: "http://stub/http-worker",
        stub: true,
        agentId: "http-worker",
      }),
      handlers: {
        echo: async (ctx) => ({ via: "http-stub", input: ctx.offer.input }),
      },
    });
    const client = new AgentPeer({
      profile: profile("http-client", []),
      transport: new HttpJsonTransport({
        endpoint: "http://stub/http-client",
        stub: true,
        agentId: "http-client",
      }),
    });

    worker.start();
    client.start();
    await client.hello("http-worker");
    await settle(30);

    const outcome = await client.offerTask({
      to: "http-worker",
      goal: "echo",
      input: { n: 1 },
      requiredCapabilities: ["echo"],
      timeoutMs: 5_000,
    });

    expect(outcome.status).toBe("completed");
    if (outcome.status === "completed") {
      expect(outcome.result.output).toEqual({ via: "http-stub", input: { n: 1 } });
    }

    await client.stop();
    await worker.stop();
    resetHttpJsonStubs();
  });
});
