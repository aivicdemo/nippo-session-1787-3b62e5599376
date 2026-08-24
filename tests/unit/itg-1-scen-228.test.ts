import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { generateAndSendSummaryEmail } from "../../src/logic/notification-delivery";
import type {
  GenerateAndSendSummaryEmailInput,
  GenerateAndSendSummaryEmailOutput,
} from "../../src/logic/notification-delivery";

describe("日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能", () => {
  // SCEN-228: TextAnalysisServiceAdapter が課題キーワード抽出に失敗したとき代替処理に切り替わる
  test("TextAnalysisServiceAdapter の extractKeywords 失敗時に代替処理へ切り替わり、メール送信を継続する", async () => {
    // Arrange: TextAnalysisServiceAdapter をスタブ化し、extractKeywords がエラーを返すように設定
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest
        .fn()
        .mockRejectedValueOnce(new Error("API connection failed"))
        .mockRejectedValueOnce(new Error("API connection failed"))
        .mockRejectedValueOnce(new Error("API connection failed"))
        .mockResolvedValueOnce({
          keywords: [],
          frequencies: [],
        }),
      assessImpactScore: jest.fn().mockResolvedValue({
        score: 0,
        severity: "low",
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue("low"),
    };

    // ダッシュボード更新をスタブ化
    const dashboardUpdateStub = jest.fn().mockResolvedValue({
      success: true,
    });

    // メール送信をスタブ化
    const emailServiceStub = jest.fn().mockResolvedValue({
      emailId: "email-001",
      sentAt: "2024-01-15T09:00:00Z",
      recipientEmail: "manager@company.com",
      includedIssueCount: 0,
      submissionSummary: {
        submittedCount: 5,
        unsubmittedCount: 5,
        submissionRate: 50,
      },
    });

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: "team-001",
      reportDate: "2024-01-15",
      managerUserId: "manager-001",
      submittedReports: [
        {
          reporterId: "engineer-001",
          reporterName: "Engineer A",
          submittedAt: "2024-01-15T08:30:00Z",
          challenges: [
            "サーバーレスポンス遅延",
            "昨日は機能Aの開発、今日はテストB対応、課題：サーバーレスポンス遅延",
          ],
        },
        {
          reporterId: "engineer-002",
          reporterName: "Engineer B",
          submittedAt: "2024-01-15T08:45:00Z",
          challenges: ["データベース接続エラー"],
        },
      ],
      unsubmittedMemberIds: ["engineer-003", "engineer-004", "engineer-005"],
      reportDeadlineTime: "09:00",
    };

    // Act: 関数を実行、外部サービスの失敗を検知
    const output = await generateAndSendSummaryEmail(input, {
      textAnalysisServiceAdapter: textAnalysisServiceAdapterStub,
      dashboardService: { updateWithFallbackMessage: dashboardUpdateStub },
      emailService: { sendEmail: emailServiceStub },
    });

    // Assert: 代替処理への切り替わりを確認
    expect(textAnalysisServiceAdapterStub.extractKeywords).toHaveBeenCalledTimes(
      4
    );

    // ダッシュボード失敗メッセージ表示を確認
    expect(dashboardUpdateStub).toHaveBeenCalledWith({
      message: "課題分析が一時的に利用できません。手動入力をご利用ください",
      teamId: "team-001",
      timestamp: expect.any(String),
    });

    // メール送信が中断せず完了したことを確認
    expect(emailServiceStub).toHaveBeenCalled();
    expect(output).toEqual<GenerateAndSendSummaryEmailOutput>({
      emailId: "email-001",
      sentAt: "2024-01-15T09:00:00Z",
      recipientEmail: "manager@company.com",
      includedIssueCount: 0,
      submissionSummary: {
        submittedCount: 5,
        unsubmittedCount: 5,
        submissionRate: 50,
      },
    });

    // メール本文が代替処理（空の課題キーワード）で生成されたことを確認
    const emailCall = emailServiceStub.mock.calls[0][0];
    expect(emailCall.teamId).toBe("team-001");
    expect(emailCall.reportDate).toBe("2024-01-15");
    expect(emailCall.managerUserId).toBe("manager-001");
  });
});