import { generateAndSendSummaryEmail } from "../../src/logic/notification-delivery";
import type {
  GenerateAndSendSummaryEmailInput,
  GenerateAndSendSummaryEmailOutput,
  SubmittedReportSummary,
} from "../../src/logic/notification-delivery";

describe("部長向けダッシュボード - 本日の報告提出状況リアルタイム表示", () => {
  // SCEN-223: [error] 日報集約メール送信機能 - 未提出者リストが null のとき処理が進まない
  test("未提出者リストが null の場合、エラーログを記録してメール送信を中止する", async () => {
    const mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    const mockEmailService = {
      send: jest.fn(),
    };

    const mockAlertService = {
      notify: jest.fn(),
    };

    const submittedReportSummaryArray: SubmittedReportSummary[] = [
      {
        reporterId: "reporter-001",
        reporterName: "山田太郎",
        submittedAt: "2024-01-15T08:45:00Z",
        challenges: ["API レスポンス遅延", "テスト環境の不安定性"],
      },
      {
        reporterId: "reporter-002",
        reporterName: "佐藤花子",
        submittedAt: "2024-01-15T08:50:00Z",
        challenges: ["デプロイパイプラインの失敗"],
      },
      {
        reporterId: "reporter-003",
        reporterName: "鈴木次郎",
        submittedAt: "2024-01-15T08:55:00Z",
        challenges: ["ドキュメント更新漏れ"],
      },
      {
        reporterId: "reporter-004",
        reporterName: "田中美咲",
        submittedAt: "2024-01-15T08:52:00Z",
        challenges: ["メモリリーク検出"],
      },
      {
        reporterId: "reporter-005",
        reporterName: "伊藤健一",
        submittedAt: "2024-01-15T08:58:00Z",
        challenges: ["型定義の不一致"],
      },
      {
        reporterId: "reporter-006",
        reporterName: "中村由美",
        submittedAt: "2024-01-15T09:00:00Z",
        challenges: ["本番環境での予期しないエラー"],
      },
      {
        reporterId: "reporter-007",
        reporterName: "小林洋介",
        submittedAt: "2024-01-15T08:47:00Z",
        challenges: ["CI パイプラインの実行時間超過"],
      },
    ];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: "team-dev-001",
      reportDate: "2024-01-15",
      managerUserId: "manager-001",
      submittedReports: submittedReportSummaryArray,
      unsubmittedMemberIds: null as any,
      reportDeadlineTime: "09:00",
    };

    const result = await generateAndSendSummaryEmail(input, {
      logger: mockLogger,
      emailService: mockEmailService,
      alertService: mockAlertService,
    });

    expect(result).toEqual({
      status: "error",
      errorMessage: "未提出者リスト",
      emailId: null,
      sentAt: null,
      recipientEmail: null,
      includedIssueCount: null,
      submissionSummary: null,
    });

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("未提出者リスト")
    );

    expect(mockEmailService.send).not.toHaveBeenCalled();

    expect(mockAlertService.notify).not.toHaveBeenCalled();
  });
});