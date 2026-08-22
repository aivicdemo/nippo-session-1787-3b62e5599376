import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-157: sendUnsubmittedReminder records audit events for complete agent lifecycle", async () => {
    // ===== Setup: Mock data and audit log capture =====
    const auditEvents: Array<{
      timestamp: string;
      executionUser: string;
      actionName: string;
      businessValue?: string;
      traceId: string;
      sessionId: string;
      agentExecutionId: string;
      status?: string;
      processingTimeMs?: number;
    }> = [];

    const mockAuditLogger = {
      recordEvent: (event: {
        timestamp: string;
        executionUser: string;
        actionName: string;
        businessValue?: string;
        traceId: string;
        sessionId: string;
        agentExecutionId: string;
        status?: string;
        processingTimeMs?: number;
      }) => {
        auditEvents.push(event);
      },
    };

    const traceId = "trace-tx8-imp1-001";
    const sessionId = "session-20240115-morning";
    const agentExecutionId = "agent-exec-001";
    const executionUser = "system-agent";
    const executionTimestamp = "2024-01-15T08:00:00Z";

    // ===== Mock submission data =====
    const unsubmittedMembers = [
      { memberId: "M001", memberName: "Alice", teamId: "T001" },
      { memberId: "M002", memberName: "Bob", teamId: "T001" },
      { memberId: "M003", memberName: "Charlie", teamId: "T002" },
    ];

    // ===== Mock input parameters =====
    const reminderConfig = {
      unsubmittedMembers,
      reminderLevel: 1, // First reminder
      submissionDeadline: "2024-01-15T09:00:00Z",
      notificationChannels: ["email", "slack"],
      auditLogger: mockAuditLogger,
      traceId,
      sessionId,
      agentExecutionId,
      executionUser,
      executionTimestamp,
    };

    // ===== Execution =====
    const result = await sendUnsubmittedReminder(reminderConfig);

    // ===== Verification: Lifecycle events recorded =====

    // 1. Verify initialization event
    const initEvent = auditEvents.find((e) =>
      e.actionName.includes("INIT") || e.actionName.includes("START")
    );
    expect(initEvent).toBeDefined();
    expect(initEvent?.traceId).toBe(traceId);
    expect(initEvent?.sessionId).toBe(sessionId);
    expect(initEvent?.agentExecutionId).toBe(agentExecutionId);
    expect(initEvent?.executionUser).toBe(executionUser);

    // 2. Verify action-level events exist
    const actionStartEvents = auditEvents.filter((e) =>
      e.actionName.match(/ACTION.*START/)
    );
    const actionCompleteEvents = auditEvents.filter((e) =>
      e.actionName.match(/ACTION.*COMPLETE/)
    );

    expect(actionStartEvents.length).toBeGreaterThan(0);
    expect(actionCompleteEvents.length).toBeGreaterThan(0);

    // 3. Verify business values recorded for reminders sent
    const reminderSentEvent = auditEvents.find(
      (e) =>
        e.actionName.includes("REMINDER") &&
        e.actionName.includes("SENT")
    );
    expect(reminderSentEvent).toBeDefined();
    if (reminderSentEvent?.businessValue) {
      const sentCount = parseInt(reminderSentEvent.businessValue, 10);
      expect(sentCount).toBe(unsubmittedMembers.length);
    }

    // 4. Verify handoff/transition event
    const handoffEvent = auditEvents.find((e) =>
      e.actionName.includes("HANDOFF") ||
      e.actionName.includes("TRANSITION")
    );
    expect(handoffEvent).toBeDefined();
    if (handoffEvent) {
      expect(handoffEvent.traceId).toBe(traceId);
      expect(handoffEvent.agentExecutionId).toBe(agentExecutionId);
    }

    // 5. Verify completion event with status and duration
    const completionEvent = auditEvents.find((e) =>
      e.actionName.includes("COMPLETE") &&
      (e.actionName.includes("AGENT") || e.actionName.includes("LIFECYCLE"))
    );
    expect(completionEvent).toBeDefined();
    expect(completionEvent?.status).toBe("SUCCESS");
    expect(completionEvent?.processingTimeMs).toBeGreaterThan(0);
    expect(completionEvent?.traceId).toBe(traceId);
    expect(completionEvent?.sessionId).toBe(sessionId);
    expect(completionEvent?.agentExecutionId).toBe(agentExecutionId);

    // 6. Verify audit log sequence integrity
    let previousTimestamp = auditEvents[0]?.timestamp ?? executionTimestamp;
    for (let i = 1; i < auditEvents.length; i++) {
      const currentTs = new Date(auditEvents[i].timestamp).getTime();
      const prevTs = new Date(previousTimestamp).getTime();
      expect(currentTs).toBeGreaterThanOrEqual(prevTs);
      previousTimestamp = auditEvents[i].timestamp;
    }

    // 7. Verify all events have required tracing fields
    for (const event of auditEvents) {
      expect(event.traceId).toBe(traceId);
      expect(event.sessionId).toBe(sessionId);
      expect(event.agentExecutionId).toBe(agentExecutionId);
      expect(event.timestamp).toBeDefined();
      expect(event.executionUser).toBe(executionUser);
      expect(event.actionName).toBeDefined();
    }

    // 8. Verify result contains expected structure
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.remindersSent).toBe(unsubmittedMembers.length);
    expect(result.traceId).toBe(traceId);
    expect(result.agentExecutionId).toBe(agentExecutionId);

    // 9. Verify minimal event count (at least: INIT + REMINDER_ACTION_START + REMINDER_ACTION_COMPLETE + HANDOFF + LIFECYCLE_COMPLETE)
    expect(auditEvents.length).toBeGreaterThanOrEqual(5);
  });
});