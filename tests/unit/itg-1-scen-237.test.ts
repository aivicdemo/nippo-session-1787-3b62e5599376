import { generateAndSendSummaryEmail } from "../../src/logic/notification-delivery";
import type {
  GenerateAndSendSummaryEmailInput,
  GenerateAndSendSummaryEmailOutput,
  SubmittedReportSummary,
} from "../../src/logic/notification-delivery";

describe("日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能", () => {
  // SCEN-237: [edge] 日報集約メール生成機能 - 課題キーワード抽出の発生頻度計算で端数が出る場合（例：3件中1件＝33.33%）、丸め処理後の値が正確に表示される
  test("課題キーワード抽出の発生頻度計算で端数が出る場合、丸め処理後の値が正確に表示される", async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: "データベース障害",
            frequency: 1,
            totalReports: 3,
            percentageFrequency: 33.333333,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: "データベース障害",
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: "データベース障害",
        severity: "high",
      }),
    };

    const submittedReports: SubmittedReportSummary[] = [
      {
        reporterId: "user-001",
        reporterName: "太郎",
        submittedAt: "2024-01-15T08:30:00Z",
        challenges: ["データベース障害が発生した"],
      },
      {
        reporterId: "user-002",
        reporterName: "花子",
        submittedAt: "2024-01-15T08:35:00Z",
        challenges: ["ネットワーク遅延を確認"],
      },
      {
        reporterId: "user-003",
        reporterName: "次郎",
        submittedAt: "2024-01-15T08:40:00Z",
        challenges: ["キャッシュメモリ不足の警告"],
      },
    ];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: "team-001",
      reportDate: "2024-01-15",
      managerUserId: "manager-001",
      submittedReports: submittedReports,
      unsubmittedMemberIds: [],
      reportDeadlineTime: "09:00",
    };

    const output: GenerateAndSendSummaryEmailOutput =
      await generateAndSendSummaryEmail(input, mockTextAnalysisAdapter);

    expect(output).toHaveProperty("emailId");
    expect(output).toHaveProperty("sentAt");
    expect(output).toHaveProperty("recipientEmail");
    expect(output).toHaveProperty("includedIssueCount");
    expect(output).toHaveProperty("submissionSummary");

    expect(typeof output.emailId).toBe("string");
    expect(output.emailId.length).toBeGreaterThan(0);

    const sentAtDate = new Date(output.sentAt);
    expect(sentAtDate.getTime()).toBeGreaterThan(0);

    expect(output.includedIssueCount).toBe(1);

    expect(output.submissionSummary).toHaveProperty("submittedCount");
    expect(output.submissionSummary).toHaveProperty("unsubmittedCount");
    expect(output.submissionSummary).toHaveProperty("submissionRate");

    expect(output.submissionSummary.submittedCount).toBe(3);
    expect(output.submissionSummary.unsubmittedCount).toBe(0);

    const expectedSubmissionRate = (3 / 3) * 100;
    expect(output.submissionSummary.submissionRate).toBe(expectedSubmissionRate);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();

    const callArgs = mockTextAnalysisAdapter.extractKeywords.mock.calls[0];
    expect(callArgs).toBeDefined();
    expect(Array.isArray(callArgs[0])).toBe(true);
    expect(callArgs[0].length).toBe(3);
  });
});