import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";
import type {
  Tx1Imp1AgentInput,
  Tx1Imp1AgentOutput,
} from "../../src/agents/tx-1-imp-1/orchestrator";

interface AuditEvent {
  eventType: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

interface MockAiClientResponse {
  actionId: string;
  result: unknown;
}

const createMockAiClient = () => {
  const auditLog: AuditEvent[] = [];

  return {
    auditLog,
    async executeAction01GetReportStatus(): Promise<{
      totalMembers: number;
      submittedCount: number;
      unsubmittedCount: number;
      unsubmittedMemberIds: string[];
    }> {
      auditLog.push({
        eventType: "ACTION_1_CALLED",
        timestamp: new Date("2024-01-15T09:00:00Z"),
        data: { actionId: "action-01" },
      });
      return {
        totalMembers: 10,
        submittedCount: 7,
        unsubmittedCount: 3,
        unsubmittedMemberIds: ["user1", "user2", "user3"],
      };
    },
    async executeAction02SendReminders(
      unsubmittedMemberIds: string[]
    ): Promise<{ notificationsSent: number; targetUserIds: string[] }> {
      auditLog.push({
        eventType: "ACTION_2_CALLED",
        timestamp: new Date("2024-01-15T09:05:00Z"),
        data: { actionId: "action-02", count: unsubmittedMemberIds.length },
      });
      return {
        notificationsSent: unsubmittedMemberIds.length,
        targetUserIds: unsubmittedMemberIds,
      };
    },
    async executeAction03ExtractIssues(): Promise<{
      extractedIssueCount: number;
      issues: Array<{
        id: string;
        description: string;
        category: string;
      }>;
    }> {
      auditLog.push({
        eventType: "ACTION_3_CALLED",
        timestamp: new Date("2024-01-15T09:10:00Z"),
        data: { actionId: "action-03" },
      });
      return {
        extractedIssueCount: 5,
        issues: [
          {
            id: "issue-001",
            description: "システム障害",
            category: "インシデント",
          },
          {
            id: "issue-002",
            description: "工程遅延",
            category: "スケジュール",
          },
          {
            id: "issue-003",
            description: "リソース不足",
            category: "リソース",
          },
          {
            id: "issue-004",
            description: "品質問題",
            category: "品質",
          },
          {
            id: "issue-005",
            description: "顧客要望対応",
            category: "要件",
          },
        ],
      };
    },
    async executeAction04PrioritizeIssues(issues: Array<{
      id: string;
      description: string;
      category: string;
    }>): Promise<{
      prioritizedIssueCount: number;
      prioritizedIssues: Array<{
        id: string;
        priority: number;
        description: string;
      }>;
    }> {
      auditLog.push({
        eventType: "ACTION_4_CALLED",
        timestamp: new Date("2024-01-15T09:15:00Z"),
        data: { actionId: "action-04", issueCount: issues.length },
      });
      return {
        prioritizedIssueCount: issues.length,
        prioritizedIssues: issues.map((issue, index) => ({
          id: issue.id,
          priority: index + 1,
          description: issue.description,
        })),
      };
    },
    async executeAction05GenerateMorningMeetingMaterial(prioritizedIssues: Array<{
      id: string;
      priority: number;
      description: string;
    }>): Promise<{
      materialGenerated: boolean;
      materialContent: string;
      materialSizeBytes: number;
      priorityOrder: string[];
    }> {
      const content = `# 朝会報告資料\n## 優先課題\n${prioritizedIssues
        .map((issue) => `- [P${issue.priority}] ${issue.description}`)
        .join("\n")}`;
      const sizeBytes = Buffer.byteLength(content, "utf8");
      const priorityOrder = prioritizedIssues.map((issue) => issue.id);

      auditLog.push({
        eventType: "ACTION_5_CALLED",
        timestamp: new Date("2024-01-15T09:20:00Z"),
        data: { actionId: "action-05", sizeBytes },
      });
      return {
        materialGenerated: true,
        materialContent: content,
        materialSizeBytes: sizeBytes,
        priorityOrder,
      };
    },
    async executeAction06NotifyManager(
      managerEmail: string,
      materialUrl: string
    ): Promise<{
      notificationSent: boolean;
      targetEmail: string;
      materialUrl: string;
    }> {
      auditLog.push({
        eventType: "ACTION_6_CALLED",
        timestamp: new Date("2024-01-15T09:25:00Z"),
        data: { actionId: "action-06", targetEmail: managerEmail },
      });
      return {
        notificationSent: true,
        targetEmail: managerEmail,
        materialUrl,
      };
    },
  };
};

describe("Tx1Imp1Agent - 日報集約から課題優先順位付けと未提出通知までの自律実行", () => {
  // SCEN-038
  test("should execute complete orchestration flow with audit logging and complete lifecycle management", async () => {
    const mockAiClient = createMockAiClient();

    const input: Tx1Imp1AgentInput = {
      executionTimestamp: new Date("2024-01-15T09:00:00Z"),
      reportDeadlineTime: "09:00",
      morningMeetingStartTime: "09:30",
      teamMemberIds: [
        "user1",
        "user2",
        "user3",
        "user4",
        "user5",
        "user6",
        "user7",
        "user8",
        "user9",
        "user10",
      ],
      managerEmail: "manager@example.com",
    };

    const output = await runTx1Imp1Agent(input, mockAiClient);

    // Verify output structure and key metrics
    expect(output.executionStatus).toBe("success");
    expect(output.aggregatedReportCount).toBe(7);
    expect(output.unsubmittedMemberCount).toBe(3);
    expect(output.extractedIssueCount).toBe(5);
    expect(output.prioritizedIssueList).toBeDefined();
    expect(output.prioritizedIssueList.length).toBeGreaterThan(0);
    expect(output.summaryEmailSent).toBe(true);
    expect(output.completionTimestamp).toBeDefined();

    // Verify audit log exists and contains expected events
    const auditLog = mockAiClient.auditLog;
    expect(auditLog.length).toBeGreaterThan(0);

    // Verify audit log event sequence
    const eventTypes = auditLog.map((event) => event.eventType);
    expect(eventTypes).toContain("ACTION_1_CALLED");
    expect(eventTypes).toContain("ACTION_2_CALLED");
    expect(eventTypes).toContain("ACTION_3_CALLED");
    expect(eventTypes).toContain("ACTION_4_CALLED");
    expect(eventTypes).toContain("ACTION_5_CALLED");
    expect(eventTypes).toContain("ACTION_6_CALLED");

    // Verify chronological ordering of audit events
    for (let i = 1; i < auditLog.length; i++) {
      expect(auditLog[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        auditLog[i - 1].timestamp.getTime()
      );
    }

    // Verify Action 1 specifics (report status retrieval)
    const action1Event = auditLog.find(
      (event) => event.eventType === "ACTION_1_CALLED"
    );
    expect(action1Event).toBeDefined();
    expect(action1Event?.data.actionId).toBe("action-01");

    // Verify Action 2 specifics (unsubmitted member notifications)
    const action2Event = auditLog.find(
      (event) => event.eventType === "ACTION_2_CALLED"
    );
    expect(action2Event).toBeDefined();
    expect(action2Event?.data.actionId).toBe("action-02");
    expect(action2Event?.data.count).toBe(3);

    // Verify Action 3 specifics (issue extraction)
    const action3Event = auditLog.find(
      (event) => event.eventType === "ACTION_3_CALLED"
    );
    expect(action3Event).toBeDefined();
    expect(action3Event?.data.actionId).toBe("action-03");

    // Verify Action 4 specifics (issue prioritization)
    const action4Event = auditLog.find(
      (event) => event.eventType === "ACTION_4_CALLED"
    );
    expect(action4Event).toBeDefined();
    expect(action4Event?.data.actionId).toBe("action-04");
    expect(action4Event?.data.issueCount).toBe(5);

    // Verify Action 5 specifics (material generation)
    const action5Event = auditLog.find(
      (event) => event.eventType === "ACTION_5_CALLED"
    );
    expect(action5Event).toBeDefined();
    expect(action5Event?.data.actionId).toBe("action-05");
    expect(typeof action5Event?.data.sizeBytes).toBe("number");
    expect(action5Event?.data.sizeBytes).toBeGreaterThan(0);

    // Verify Action 6 specifics (manager notification)
    const action6Event = auditLog.find(
      (event) => event.eventType === "ACTION_6_CALLED"
    );
    expect(action6Event).toBeDefined();
    expect(action6Event?.data.actionId).toBe("action-06");
    expect(action6Event?.data.targetEmail).toBe("manager@example.com");

    // Verify audit log data consistency
    expect(output.aggregatedReportCount).toBe(7);
    expect(output.unsubmittedMemberCount).toBe(3);
    expect(output.extractedIssueCount).toBe(5);

    // Verify completion timestamp is after execution timestamp
    expect(output.completionTimestamp.getTime()).toBeGreaterThanOrEqual(
      input.executionTimestamp.getTime()
    );

    // Verify prioritized issue list contains expected structure
    expect(
      output.prioritizedIssueList.every(
        (issue) =>
          issue.id &&
          typeof issue.priority === "number" &&
          issue.description
      )
    ).toBe(true);

    // Verify priority scores are in valid range (1-5)
    expect(
      output.prioritizedIssueList.every(
        (issue) => issue.priority >= 1 && issue.priority <= 5
      )
    ).toBe(true);
  });
});