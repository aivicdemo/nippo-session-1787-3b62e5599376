import { runTx11Imp1Agent } from "../../src/agents/tx-11-imp-1/orchestrator";
import { type Tx11AgentExecutionContext, type Tx11Imp1AiClient } from "../../src/agents/tx-11-imp-1/orchestrator";

describe("TX-11 朝会報告収集・確認・催促の自動化エージェント", () => {
  // SCEN-035: 未提出メンバーへのリマインド通知送信時に通知サービスが利用不可の場合、ReminderNotificationSendingErrorがスローされ、適切なエラーメッセージが返される
  test("未提出メンバーへのリマインド通知送信時に通知サービスが利用不可の場合、適切なエラーが投げられる", async () => {
    const executionTimestamp = new Date("2024-01-15T08:00:00Z");
    const reportDeadlineTime = "09:00";
    const targetTeamIds = ["team-001", "team-002"];
    const managerUserId = "manager-001";

    const mockExecutionContext: Tx11AgentExecutionContext = {
      executionTimestamp,
      reportDeadlineTime,
      targetTeamIds,
      managerUserId,
    };

    const mockUnsubmittedMembers = [
      { memberId: "member-001", memberName: "Employee A", remainingTimeMinutes: 60 },
      { memberId: "member-002", memberName: "Employee B", remainingTimeMinutes: 60 },
      { memberId: "member-003", memberName: "Employee C", remainingTimeMinutes: 60 },
    ];

    const mockAiClient: Tx11Imp1AiClient = {
      detectUnsubmittedMembers: jest.fn().mockResolvedValue(mockUnsubmittedMembers),
      sendUnsubmittedMemberReminders: jest.fn().mockRejectedValue(
        new Error("リマインド通知の送信に失敗しました。再試行を予定しています。")
      ),
      extractIssueKeywordsFromSubmittedReports: jest.fn().mockResolvedValue([]),
      calculateIssuePriorityScores: jest.fn().mockResolvedValue([]),
      generateManagerSummaryReport: jest.fn().mockResolvedValue({}),
      suggestReferencePastIssuesForMembers: jest.fn().mockResolvedValue([]),
    };

    await expect(runTx11Imp1Agent(mockExecutionContext, mockAiClient)).rejects.toThrow(
      /リマインド通知の送信に失敗しました。再試行を予定しています。/
    );
  });
});