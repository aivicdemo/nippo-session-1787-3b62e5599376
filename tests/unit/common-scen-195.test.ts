import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx11Imp1Agent } from "../../src/agents/tx-11-imp-1/orchestrator";
import type { Tx11Imp1AiClient } from "../../src/agents/tx-11-imp-1/orchestrator";
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from "../../src/agents/tx-11-imp-1/prompts/action-01";

describe("Tx11Imp1Agent - 日報収集・確認・催促の自動化エージェント", () => {
  let auditLog: Array<{ timestamp: string; message: string; metadata?: Record<string, unknown> }>;
  let mockAiClientCallHistory: Array<{ actionNumber: number; promptVersion: string; callTimestamp: string }>;

  beforeEach(() => {
    auditLog = [];
    mockAiClientCallHistory = [];
  });

  afterEach(() => {
    auditLog = [];
    mockAiClientCallHistory = [];
  });

  // SCEN-195: [normal] 日報収集・確認・催促の自動化エージェント - Action 1 実行確認
  test("should execute Action 1 to verify daily submission status and record audit log with correct counts", async () => {
    const executionTimestamp = new Date("2024-01-15T06:00:00Z");
    const teamId = "team-001";
    const reportDeadlineTime = "09:00";
    const managerEmail = "manager@example.com";

    const mockTeamMembers = [
      { memberId: "member-001", name: "Alice" },
      { memberId: "member-002", name: "Bob" },
      { memberId: "member-003", name: "Charlie" },
      { memberId: "member-004", name: "David" },
      { memberId: "member-005", name: "Eve" },
      { memberId: "member-006", name: "Frank" },
      { memberId: "member-007", name: "Grace" },
      { memberId: "member-008", name: "Henry" },
      { memberId: "member-009", name: "Iris" },
      { memberId: "member-010", name: "Jack" },
    ];

    const submittedMemberIds = ["member-001", "member-002", "member-003", "member-004", "member-005", "member-006", "member-007", "member-008"];
    const unsubmittedMemberIds = ["member-009", "member-010"];

    const mockAiClient: Tx11Imp1AiClient = {
      callAction01_VerifySubmissionStatus: async (input) => {
        mockAiClientCallHistory.push({
          actionNumber: 1,
          promptVersion: ACTION_01_PROMPT_VERSION,
          callTimestamp: new Date().toISOString(),
        });

        auditLog.push({
          timestamp: new Date().toISOString(),
          message: "Action 1 called: VerifySubmissionStatus",
          metadata: {
            teamId: input.teamId,
            targetMemberCount: mockTeamMembers.length,
            deadlineTime: input.reportDeadlineTime,
          },
        });

        return {
          submittedMemberIds,
          unsubmittedMemberIds,
          totalMembersVerified: mockTeamMembers.length,
          verificationTimestamp: executionTimestamp,
        };
      },

      callAction02_SendReminder: async () => {
        return { notificationsSent: [] };
      },

      callAction03_ExtractIssues: async () => {
        return { extractedIssues: [] };
      },

      callAction04_RankIssues: async () => {
        return { prioritizedIssues: [] };
      },

      callAction05_GenerateSummary: async () => {
        return {
          summaryEmailContent: "",
          recipientEmail: managerEmail,
        };
      },

      callAction06_ProvidePastContext: async () => {
        return { contextItems: [] };
      },

      callAction07_SendNotification: async () => {
        return { sent: true };
      },
    };

    const agentInput = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail,
    };

    const result = await runTx11Imp1Agent(agentInput, mockAiClient);

    expect(mockAiClientCallHistory).toHaveLength(1);
    expect(mockAiClientCallHistory[0].actionNumber).toBe(1);
    expect(mockAiClientCallHistory[0].promptVersion).toBe(ACTION_01_PROMPT_VERSION);

    expect(result.submissionStatus.totalMembers).toBe(10);
    expect(result.submissionStatus.submittedCount).toBe(8);
    expect(result.submissionStatus.unsubmittedMembers).toEqual(["member-009", "member-010"]);

    expect(auditLog.length).toBeGreaterThanOrEqual(1);
    const action1AuditEntry = auditLog.find((entry) => entry.message.includes("Action 1 called"));
    expect(action1AuditEntry).toBeDefined();
    if (action1AuditEntry) {
      expect(action1AuditEntry.metadata?.teamId).toBe(teamId);
      expect(action1AuditEntry.metadata?.targetMemberCount).toBe(10);
      expect(action1AuditEntry.metadata?.deadlineTime).toBe(reportDeadlineTime);
    }
  });
});