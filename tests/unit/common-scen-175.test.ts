import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { detectAndNotifyUnsubmitted } from "../../src/logic/submission-status-management";

describe("submission-status-management", () => {
  // SCEN-175: [normal] 日報集約から分析報告までの自動実行エージェント AIエージェント
  // - エージェント実行の全ライフサイクルにおいて、各イベントが監査ログに時系列順で記録される
  test("should record all agent lifecycle events in audit log with correct timestamps and context", async () => {
    // Setup: Mock audit log storage
    const auditLogs: Array<{
      timestamp: string;
      userId: string;
      sessionId: string;
      actionId: string;
      status: string;
      detailMessage: string;
    }> = [];

    const mockAuditLogger = {
      log: (entry: {
        timestamp: string;
        userId: string;
        sessionId: string;
        actionId: string;
        status: string;
        detailMessage: string;
      }) => {
        auditLogs.push(entry);
      },
    };

    const userId = "user-001";
    const sessionId = "session-abc123";

    // Execute: Call detectAndNotifyUnsubmitted with injected audit logger
    const result = await detectAndNotifyUnsubmitted({
      userId,
      sessionId,
      auditLogger: mockAuditLogger,
      submissionDeadline: new Date("2024-01-15T09:00:00Z"),
      unsubmittedMembers: [
        { memberId: "member-001", memberName: "Alice" },
        { memberId: "member-002", memberName: "Bob" },
      ],
      reportDataStore: {
        aggregatedReportIds: ["report-001", "report-002"],
        aggregationTimestamp: new Date("2024-01-15T08:30:00Z"),
      },
    });

    // Verify: Agent lifecycle events recorded
    expect(auditLogs.length).toBe(22);

    // Verify agent_started event (index 0)
    expect(auditLogs[0]).toMatchObject({
      actionId: "agent_started",
      status: "started",
      userId: "user-001",
      sessionId: "session-abc123",
    });
    expect(auditLogs[0].timestamp).toBeDefined();
    expect(auditLogs[0].detailMessage).toContain("Tx9Imp1Agent");

    // Verify action_01_started event (index 1)
    expect(auditLogs[1]).toMatchObject({
      actionId: "action_01",
      status: "started",
    });
    expect(auditLogs[1].timestamp).toBeDefined();
    expect(auditLogs[1].detailMessage).toContain("aggregation");

    // Verify action_01_completed event (index 2)
    expect(auditLogs[2]).toMatchObject({
      actionId: "action_01",
      status: "completed",
    });
    expect(auditLogs[2].timestamp).toBeDefined();

    // Verify action_handover event (index 3)
    expect(auditLogs[3]).toMatchObject({
      actionId: "action_handover",
      status: "started",
    });
    expect(auditLogs[3].detailMessage).toContain("action_01");
    expect(auditLogs[3].detailMessage).toContain("action_02");

    // Verify action_02_started event (index 4)
    expect(auditLogs[4]).toMatchObject({
      actionId: "action_02",
      status: "started",
    });
    expect(auditLogs[4].detailMessage).toContain("unsubmitted");

    // Verify action_02_completed event (index 5)
    expect(auditLogs[5]).toMatchObject({
      actionId: "action_02",
      status: "completed",
    });

    // Verify action_handover event (index 6)
    expect(auditLogs[6]).toMatchObject({
      actionId: "action_handover",
      status: "started",
    });
    expect(auditLogs[6].detailMessage).toContain("action_02");
    expect(auditLogs[6].detailMessage).toContain("action_03");

    // Verify action_03_started event (index 7)
    expect(auditLogs[7]).toMatchObject({
      actionId: "action_03",
      status: "started",
    });
    expect(auditLogs[7].detailMessage).toContain("productivity");

    // Verify action_03_completed event (index 8)
    expect(auditLogs[8]).toMatchObject({
      actionId: "action_03",
      status: "completed",
    });

    // Verify action_handover event (index 9)
    expect(auditLogs[9]).toMatchObject({
      actionId: "action_handover",
      status: "started",
    });

    // Verify action_04_started event (index 10)
    expect(auditLogs[10]).toMatchObject({
      actionId: "action_04",
      status: "started",
    });
    expect(auditLogs[10].detailMessage).toContain("classification");

    // Verify action_04_completed event (index 11)
    expect(auditLogs[11]).toMatchObject({
      actionId: "action_04",
      status: "completed",
    });

    // Verify action_handover event (index 12)
    expect(auditLogs[12]).toMatchObject({
      actionId: "action_handover",
      status: "started",
    });

    // Verify action_05_started event (index 13)
    expect(auditLogs[13]).toMatchObject({
      actionId: "action_05",
      status: "started",
    });
    expect(auditLogs[13].detailMessage).toContain("recurrence");

    // Verify action_05_completed event (index 14)
    expect(auditLogs[14]).toMatchObject({
      actionId: "action_05",
      status: "completed",
    });

    // Verify action_handover event (index 15)
    expect(auditLogs[15]).toMatchObject({
      actionId: "action_handover",
      status: "started",
    });

    // Verify action_06_started event (index 16)
    expect(auditLogs[16]).toMatchObject({
      actionId: "action_06",
      status: "started",
    });
    expect(auditLogs[16].detailMessage).toContain("improvement");

    // Verify action_06_completed event (index 17)
    expect(auditLogs[17]).toMatchObject({
      actionId: "action_06",
      status: "completed",
    });

    // Verify action_handover event (index 18)
    expect(auditLogs[18]).toMatchObject({
      actionId: "action_handover",
      status: "started",
    });

    // Verify action_07_started event (index 19)
    expect(auditLogs[19]).toMatchObject({
      actionId: "action_07",
      status: "started",
    });
    expect(auditLogs[19].detailMessage).toContain("report");

    // Verify action_07_completed event (index 20)
    expect(auditLogs[20]).toMatchObject({
      actionId: "action_07",
      status: "completed",
    });

    // Verify agent_completed event (index 21)
    expect(auditLogs[21]).toMatchObject({
      actionId: "agent_completed",
      status: "completed",
      userId: "user-001",
      sessionId: "session-abc123",
    });
    expect(auditLogs[21].timestamp).toBeDefined();
    expect(auditLogs[21].detailMessage).toContain("Tx9Imp1Agent");

    // Verify all logs have consistent context
    auditLogs.forEach((log) => {
      expect(log.userId).toBe("user-001");
      expect(log.sessionId).toBe("session-abc123");
      expect(log.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(log.actionId).toBeDefined();
      expect(log.status).toMatch(/^(started|completed)$/);
      expect(log.detailMessage).toBeDefined();
      expect(typeof log.detailMessage).toBe("string");
    });

    // Verify timestamps are monotonically increasing (time order)
    for (let i = 1; i < auditLogs.length; i++) {
      const prevTime = new Date(auditLogs[i - 1].timestamp).getTime();
      const currTime = new Date(auditLogs[i].timestamp).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }

    // Verify result structure
    expect(result).toMatchObject({
      success: true,
      agentId: expect.any(String),
      completedAt: expect.any(String),
      auditLogCount: 22,
    });
  });
});