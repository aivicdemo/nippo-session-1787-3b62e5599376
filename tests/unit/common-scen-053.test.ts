import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
import type {
  Tx2Imp1AgentInput,
  Tx2Imp1AgentOutput,
  Tx2Imp1AiClient,
} from "../../src/agents/tx-2-imp-1/orchestrator";

describe("Tx2Imp1Agent Authorization Denial", () => {
  // SCEN-053
  test("should deny unauthorized data access and tool operations, halt execution, and record audit events", async () => {
    const executionTimestamp = new Date("2024-01-15T08:55:00Z");
    const reportingDeadline = new Date("2024-01-15T09:00:00Z");
    const teamId = "team-001";
    const managerEmail = "manager@example.com";

    const agentInput: Tx2Imp1AgentInput = {
      executionTimestamp,
      teamId,
      reportingDeadline,
      managerEmail,
    };

    // Mock AI client with authorization denial behavior
    const mockAiClient: Tx2Imp1AiClient = {
      buildAction01Prompt: jest.fn().mockResolvedValue({
        prompt: "Collect daily reports from all members",
        version: "1.0",
      }),
      buildAction02Prompt: jest.fn().mockResolvedValue({
        prompt: "Convert reports to unified format",
        version: "1.0",
      }),
      buildAction03Prompt: jest.fn().mockResolvedValue({
        prompt: "Extract issues from reports",
        version: "1.0",
      }),
      buildAction04Prompt: jest.fn().mockResolvedValue({
        prompt: "Apply priority scoring",
        version: "1.0",
      }),
      buildAction05Prompt: jest.fn().mockResolvedValue({
        prompt: "Generate confirmation email",
        version: "1.0",
      }),
      buildAction06Prompt: jest.fn().mockResolvedValue({
        prompt: "Send email to manager",
        version: "1.0",
      }),
      // Simulate authorization denial on data access
      executeAction: jest.fn().mockImplementation(async (actionNumber) => {
        if (actionNumber === 1) {
          const error = new Error(
            "Authorization Denied: Unauthorized data access attempt by agent at Action 1"
          );
          (error as any).code = "AUTHORIZATION_DENIED";
          (error as any).severity = "critical";
          throw error;
        }
        if (actionNumber === 2) {
          const error = new Error(
            "Authorization Denied: Unauthorized tool operation attempt by agent at Action 2"
          );
          (error as any).code = "AUTHORIZATION_DENIED";
          (error as any).severity = "critical";
          throw error;
        }
        return { success: true, data: {} };
      }),
    };

    // Audit log collector
    const auditLog: Array<{
      timestamp: Date;
      event: string;
      severity: string;
      escalation_condition?: string;
    }> = [];

    // Mock audit event recording
    const recordAuditEvent = (
      event: string,
      severity: string,
      escalationCondition?: string
    ) => {
      auditLog.push({
        timestamp: new Date(),
        event,
        severity,
        escalation_condition: escalationCondition,
      });
    };

    let agentOutput: Tx2Imp1AgentOutput | null = null;
    let caughtError: Error | null = null;

    try {
      // Run the agent with authorization denial setup
      agentOutput = await runTx2Imp1Agent(agentInput, mockAiClient);
    } catch (error) {
      caughtError = error as Error;

      // Record authorization denial in audit log
      if ((error as any).code === "AUTHORIZATION_DENIED") {
        recordAuditEvent(
          (error as Error).message,
          "critical",
          "authorization_denial"
        );
      }
    }

    // Assertions: Agent should fail on authorization denial
    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/Authorization Denied/);

    // Verify audit log recorded authorization denial events
    expect(auditLog.length).toBeGreaterThan(0);
    const authDenialEvents = auditLog.filter(
      (log) => log.escalation_condition === "authorization_denial"
    );
    expect(authDenialEvents.length).toBeGreaterThan(0);

    // Verify at least one audit event contains Action 1 authorization denial
    const action1DenialEvent = auditLog.find((log) =>
      log.event.includes("Action 1")
    );
    expect(action1DenialEvent).toBeDefined();
    expect(action1DenialEvent?.severity).toBe("critical");

    // Verify at least one audit event contains Action 2 authorization denial
    const action2DenialEvent = auditLog.find((log) =>
      log.event.includes("Action 2")
    );
    expect(action2DenialEvent).toBeDefined();
    expect(action2DenialEvent?.severity).toBe("critical");

    // Verify agent output did not reach confirmation email stage
    expect(agentOutput).toBeNull();

    // Verify manager confirmation email was NOT sent
    expect(mockAiClient.buildAction06Prompt).not.toHaveBeenCalled();

    // Verify Action 1 was attempted before denial
    expect(mockAiClient.buildAction01Prompt).toHaveBeenCalled();

    // Verify agent halted processing after authorization denial
    const executeActionCalls = (mockAiClient.executeAction as jest.Mock).mock
      .calls.length;
    expect(executeActionCalls).toBeGreaterThan(0);
    expect(executeActionCalls).toBeLessThan(6);
  });
});