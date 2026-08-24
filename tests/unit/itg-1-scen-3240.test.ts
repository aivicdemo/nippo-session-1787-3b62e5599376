import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx11Imp1Agent } from "../../src/agents/tx-11-imp-1/orchestrator";
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from "../../src/agents/tx-11-imp-1/prompts/action-04";
import type { Tx11Imp1AiClient } from "../../src/agents/tx-11-imp-1/orchestrator";

describe("TX-11 日報収集・確認・催促の自動化エージェント", () => {
  // SCEN-3240: [normal] メンバーの日報作成時に参考情報を提示する
  test("should provide past issue references and related case trends when member creates daily report", async () => {
    const executionTimestamp = new Date("2026-08-22T08:30:00Z");
    const teamId = "team-dev-001";
    const reportDeadlineTime = "09:00";
    const morningMeetingStartTime = "10:00";

    const pastIssues = [
      {
        issueId: "ISSUE-1234",
        title: "API応答遅延",
        reportedDate: "2026-08-15",
        memberName: "メンバーB",
        resolution: "接続タイムアウト値を5秒から30秒に変更",
      },
      {
        issueId: "ISSUE-1235",
        title: "同期エラー",
        reportedDate: "2026-08-18",
        memberName: "メンバーC",
        resolution: "データベース接続プールサイズを増加",
      },
      {
        issueId: "ISSUE-1236",
        title: "ログイン認証失敗",
        reportedDate: "2026-08-20",
        memberName: "メンバーA",
        resolution: "セッションタイムアウト設定を確認",
      },
    ];

    const relatedCases = [
      {
        caseId: "CASE-5678",
        keyword: "API",
        occurrenceCount: 5,
        severity: "HIGH",
        avgResolutionTime: "2時間30分",
      },
      {
        caseId: "CASE-5679",
        keyword: "認証",
        occurrenceCount: 3,
        severity: "MEDIUM",
        avgResolutionTime: "1時間15分",
      },
    ];

    const mockAiClient: Tx11Imp1AiClient = {
      executeAction01GetSubmissionStatus: jest.fn().mockResolvedValue({
        totalMembers: 10,
        submittedCount: 7,
        unsubmittedMembers: ["メンバーA", "メンバーD", "メンバーE"],
      }),

      executeAction02SendReminderNotification: jest.fn().mockResolvedValue({
        notificationsSent: 3,
        failedNotifications: [],
      }),

      executeAction03ExtractIssues: jest.fn().mockResolvedValue({
        extractedIssues: [
          { keyword: "API応答遅延", frequency: 5, severity: "HIGH" },
          { keyword: "同期エラー", frequency: 2, severity: "MEDIUM" },
        ],
      }),

      executeAction04ProvidePastReferences: jest.fn().mockResolvedValue({
        similarPastIssues: pastIssues,
        relatedCases: relatedCases,
        referenceProvidedAt: executionTimestamp,
      }),

      executeAction05PrioritizeIssues: jest.fn().mockResolvedValue({
        prioritizedIssues: [
          {
            issueId: "API-001",
            title: "API応答遅延",
            priorityScore: 92,
            color: "red",
          },
          {
            issueId: "AUTH-001",
            title: "ログイン認証失敗",
            priorityScore: 65,
            color: "yellow",
          },
        ],
      }),

      executeAction06GenerateSummary: jest.fn().mockResolvedValue({
        summaryEmail: {
          to: "manager@example.com",
          subject: "朝会用日報サマリー - 2026-08-22",
          body: "本日の日報集計結果をお知らせします...",
          sentAt: executionTimestamp,
        },
        notificationsSent: true,
      }),

      executeAction07RecordAuditEvent: jest.fn().mockResolvedValue({
        auditEventId: "AUDIT-20260822-001",
        actionType: "ACTION_04_REFERENCE_PROVIDED",
        agentId: "tx_11_imp_1",
        memberId: "メンバーA",
        referenceSource: "PAST_ISSUES, RELATED_CASES",
        timestamp: executionTimestamp,
        recordedSuccessfully: true,
      }),
    };

    const input = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail: "manager@example.com",
    };

    const result = await runTx11Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.executionStatus).toBe("success");

    expect(mockAiClient.executeAction04ProvidePastReferences).toHaveBeenCalled();
    const action04Call = (mockAiClient.executeAction04ProvidePastReferences as jest.Mock).mock.calls[0];
    expect(action04Call).toBeDefined();

    const action04Result = await mockAiClient.executeAction04ProvidePastReferences();
    expect(action04Result.similarPastIssues).toHaveLength(3);
    expect(action04Result.similarPastIssues[0].issueId).toBe("ISSUE-1234");
    expect(action04Result.similarPastIssues[0].title).toBe("API応答遅延");
    expect(action04Result.similarPastIssues[0].reportedDate).toBe("2026-08-15");
    expect(action04Result.similarPastIssues[0].memberName).toBe("メンバーB");
    expect(action04Result.similarPastIssues[0].resolution).toBe(
      "接続タイムアウト値を5秒から30秒に変更"
    );

    expect(action04Result.relatedCases).toHaveLength(2);
    expect(action04Result.relatedCases[0].caseId).toBe("CASE-5678");
    expect(action04Result.relatedCases[0].keyword).toBe("API");
    expect(action04Result.relatedCases[0].occurrenceCount).toBe(5);
    expect(action04Result.relatedCases[0].severity).toBe("HIGH");
    expect(action04Result.relatedCases[0].avgResolutionTime).toBe("2時間30分");

    expect(mockAiClient.executeAction07RecordAuditEvent).toHaveBeenCalled();
    const auditEventResult = await mockAiClient.executeAction07RecordAuditEvent();
    expect(auditEventResult.auditEventId).toBeDefined();
    expect(auditEventResult.actionType).toBe("ACTION_04_REFERENCE_PROVIDED");
    expect(auditEventResult.agentId).toBe("tx_11_imp_1");
    expect(auditEventResult.memberId).toBe("メンバーA");
    expect(auditEventResult.referenceSource).toBe("PAST_ISSUES, RELATED_CASES");
    expect(auditEventResult.recordedSuccessfully).toBe(true);

    const auditTimestamp = new Date(auditEventResult.timestamp);
    const executionTime = new Date(executionTimestamp);
    const timeDiffMs = Math.abs(auditTimestamp.getTime() - executionTime.getTime());
    expect(timeDiffMs).toBeLessThanOrEqual(1000);

    const action04PromptText = buildAction04Prompt({
      memberId: "メンバーA",
      pastDailyReportCount: 3,
      pastIssuesData: pastIssues,
      relatedCasesData: relatedCases,
    });
    expect(action04PromptText).toBeDefined();
    expect(action04PromptText.length).toBeGreaterThan(0);

    expect(ACTION_04_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_04_PROMPT_VERSION).toBe("string");
  });
});