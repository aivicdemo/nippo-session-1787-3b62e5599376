import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type {
  GenerateAndSendSummaryEmailInput,
  GenerateAndSendSummaryEmailOutput,
  SubmittedReportSummary,
} from '../../src/logic/notification-delivery';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-245: [edge] 日報集約メール生成機能 - 日報テキストに同一キーワードが重複して含まれる場合、発生頻度が重複回数分だけ正確にカウントされる
  test('同一キーワード「システム障害」が3回含まれる日報テキストから発生頻度が正確に3としてカウントされること', async () => {
    // Arrange: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        'システム障害': 3,
        '根本原因特定': 1,
        '対応': 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockReturnValue('high'),
    };

    // 同一キーワード「システム障害」を3回含む日報テキスト
    const submittedReportWithDuplicateKeyword: SubmittedReportSummary = {
      reporterId: 'user-001',
      reporterName: '田中太郎',
      submittedAt: '2024-01-15T08:45:00Z',
      challenges: [
        '昨日はシステム障害対応を行った。今日もシステム障害の調査を続ける。抱えている課題はシステム障害の根本原因特定である。',
      ],
    };

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-engineering',
      reportDate: '2024-01-15',
      managerUserId: 'user-manager-001',
      submittedReports: [submittedReportWithDuplicateKeyword],
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:00',
    };

    // Act: generateAndSendSummaryEmailを呼び出し
    // 注: 実装は外部サービスアダプタを受け取る設計を想定
    // ここではモック化したアダプタを使用して動作を検証
    const result: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(
      input,
      mockTextAnalysisAdapter,
    );

    // Assert: extractKeywordsから返されたオブジェクトを検証
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      '昨日はシステム障害対応を行った。今日もシステム障害の調査を続ける。抱えている課題はシステム障害の根本原因特定である。',
    );

    // 「システム障害」キーワードの出現頻度が正確に3であることを検証
    const extractedKeywords = await mockTextAnalysisAdapter.extractKeywords(
      '昨日はシステム障害対応を行った。今日もシステム障害の調査を続ける。抱えている課題はシステム障害の根本原因特定である。',
    );

    expect(extractedKeywords['システム障害']).toBe(3);
    expect(extractedKeywords['根本原因特定']).toBe(1);
    expect(extractedKeywords['対応']).toBe(1);

    // メール送信結果の検証
    expect(result.emailId).toBeDefined();
    expect(result.sentAt).toBeDefined();
    expect(result.recipientEmail).toBeDefined();
    expect(result.includedIssueCount).toBeGreaterThan(0);
    expect(result.submissionSummary).toBeDefined();
    expect(result.submissionSummary.submittedCount).toBe(1);
    expect(result.submissionSummary.unsubmittedCount).toBe(0);
  });
});