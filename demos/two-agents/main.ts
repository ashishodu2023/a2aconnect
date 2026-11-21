/**
 * A2AConnect E2E demo — cross-runtime handoff:
 * Orchestrator (custom) → Researcher (graph-style adapter) → Writer (crew-style adapter)
 * over an in-memory transport with policy allowlist + audit trail.
 *
 * Run from repo root: npm run demo
 */
import {
  createCrewStyleAdapter,
  createGraphStyleAdapter,
} from "@a2aconnect/adapters";
import {
  AgentPeer,
  MemoryAuditLog,
  createBus,
  withOutboundBuffer,
  type AgentProfile,
} from "@a2aconnect/core";

function log(agent: string, message: string): void {
  console.log(`[${agent}] ${message}`);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

const researcherProfile: AgentProfile = {
  id: "researcher",
  name: "Researcher",
  version: "0.1.0",
  description: "Graph-style runtime adapter (LangGraph-shaped, no LangGraph import)",
  capabilities: [{ name: "research.web", version: "1", description: "Research notes" }],
};

const writerProfile: AgentProfile = {
  id: "writer",
  name: "Writer",
  version: "0.1.0",
  description: "Crew-style runtime adapter (CrewAI-shaped, no CrewAI import)",
  capabilities: [{ name: "write.brief", version: "1", description: "Write brief" }],
};

const orchestratorProfile: AgentProfile = {
  id: "orchestrator",
  name: "Orchestrator",
  version: "0.1.0",
  description: "Custom Node orchestrator",
  capabilities: [],
};

async function main(): Promise<void> {
  const bus = createBus();
  const audit = new MemoryAuditLog();

  const researchAdapter = createGraphStyleAdapter({
    nodeName: "research",
    run: async (input, ctx) => {
      const topic = String((input as { topic?: string })?.topic ?? ctx.offer.goal);
      log("researcher", `graph-style invoke for "${topic}"`);
      await ctx.reportProgress({ percent: 25, message: "Gathering sources" });
      await ctx.emitEvent({ name: "source.found", data: { title: `${topic} overview` } });
      await sleep(40);
      await ctx.reportProgress({ percent: 100, message: "Done" });
      return {
        topic,
        bullets: [
          `${topic}: enterprises need mixed-runtime handoff`,
          "LF A2A owns the peer wire standard; A2AConnect ships adapters + DX",
          "Policy and audit hooks close the production gap",
        ],
        runtime: "graph-style",
      };
    },
  });

  const writeAdapter = createCrewStyleAdapter({
    role: "brief-writer",
    run: async (input, ctx) => {
      const notes = input as { topic: string; bullets: string[]; runtime?: string };
      log("writer", `crew-style role drafting "${notes.topic}" (from ${notes.runtime ?? "peer"})`);
      await ctx.reportProgress({ percent: 50, message: "Drafting" });
      await sleep(40);
      const brief = [
        `# Brief: ${notes.topic}`,
        "",
        ...notes.bullets.map((b) => `- ${b}`),
        "",
        "_Generated via A2AConnect cross-runtime handoff (graph-style → crew-style)._",
      ].join("\n");
      await ctx.reportProgress({ percent: 100, message: "Brief ready" });
      return { brief, runtime: "crew-style" };
    },
  });

  const researcher = new AgentPeer({
    profile: researcherProfile,
    transport: withOutboundBuffer(bus.createTransport("researcher")),
    handlers: { "research.web": researchAdapter.toHandler() },
    onMessage: (m) => {
      if (m.type.startsWith("task.") || m.type === "event" || m.type.startsWith("hello")) {
        log("researcher", `← ${m.type} from ${m.from}`);
      }
    },
  });

  const writer = new AgentPeer({
    profile: writerProfile,
    transport: withOutboundBuffer(bus.createTransport("writer")),
    handlers: { "write.brief": writeAdapter.toHandler() },
    onMessage: (m) => {
      if (m.type.startsWith("task.") || m.type.startsWith("hello")) {
        log("writer", `← ${m.type} from ${m.from}`);
      }
    },
  });

  const orchestrator = new AgentPeer({
    profile: orchestratorProfile,
    transport: bus.createTransport("orchestrator"),
    audit,
    policy: {
      beforeOffer: ({ to }) =>
        to === "researcher" || to === "writer"
          ? { allow: true }
          : { allow: false, reason: `Peer ${to} is not allowlisted` },
    },
    onMessage: (m) => {
      if (
        m.type === "hello.ack" ||
        m.type === "task.accept" ||
        m.type === "task.progress" ||
        m.type === "task.result" ||
        m.type === "event"
      ) {
        log("orchestrator", `← ${m.type} from ${m.from}`);
      }
    },
  });

  researcher.start();
  writer.start();
  orchestrator.start();

  console.log("\n=== A2AConnect — cross-runtime E2E demo ===\n");
  console.log("Runtimes: custom orchestrator → graph-style researcher → crew-style writer\n");

  await orchestrator.hello("researcher");
  await orchestrator.hello("writer");
  await sleep(20);

  log("orchestrator", `Sessions: ${orchestrator.listRemotes().map((r) => r.agentId).join(", ")}`);

  const research = await orchestrator.offerTask({
    to: "researcher",
    goal: "Research agent interop",
    input: { topic: "agent interop runtimes" },
    requiredCapabilities: ["research.web"],
    timeoutMs: 10_000,
    retries: 1,
  });

  if (research.status !== "completed") {
    console.error("Research failed:", research);
    process.exitCode = 1;
    return;
  }

  log("orchestrator", "Research complete");
  console.log(JSON.stringify(research.result.output, null, 2));

  const write = await orchestrator.offerTask({
    to: "writer",
    goal: "Write a short brief from research notes",
    input: research.result.output,
    requiredCapabilities: ["write.brief"],
    timeoutMs: 10_000,
  });

  if (write.status !== "completed") {
    console.error("Write failed:", write);
    process.exitCode = 1;
    return;
  }

  log("orchestrator", "Brief complete\n");
  console.log((write.result.output as { brief: string }).brief);

  console.log("\n--- Audit trail ---");
  for (const event of audit.events) {
    const task = event.taskId ? ` task=${event.taskId.slice(0, 12)}…` : "";
    console.log(`  ${event.type.padEnd(22)} peer=${event.peerId ?? "-"}${task}`);
  }

  console.log("\n=== demo ok ===\n");

  await Promise.all([orchestrator.stop(), researcher.stop(), writer.stop()]);
  await bus.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
