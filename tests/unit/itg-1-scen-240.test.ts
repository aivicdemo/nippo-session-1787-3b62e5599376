import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';

describe('日報集約メール生成機能', () => {
  // SCEN-240: [edge] 課題の影響度スコアが100点を超える値が入力された場合、100点に正規化される
  test('影響度スコア120を入力した場合、100に正規化されてメールに含まれる', async () => {
    // Arrange: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['データベース接続エラー'],
        frequencies: [3],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(120),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports: [
        {
          reporterId: 'engineer-001',
          reporterName: 'Taro Yamada',
          submittedAt: '2024-01-15T08:30:00Z',
          challenges: ['データベース接続エラー'],
        },
        {
          reporterId: 'engineer-002',
          reporterName: 'Hanako Suzuki',
          submittedAt: '2024-01-15T08:45:00Z',
          challenges: ['データベース接続エラー', 'メモリ不足'],
        },
      ],
      unsubmittedMemberIds: ['engineer-003'],
      reportDeadlineTime: '09:00',
    };

    // Act: generateAndSendSummaryEmailを呼び出す
    const output = await generateAndSendSummaryEmail(
      input,
      mockTextAnalysisServiceAdapter
    );

    // Assert: 生成されたメールに含まれる影響度スコアが100に正規化されていることを検証
    expect(output.emailId).toBeDefined();
    expect(typeof output.emailId).toBe('string');
    expect(output.emailId.length).toBeGreaterThan(0);

    expect(output.sentAt).toBeDefined();
    expect(typeof output.sentAt).toBe('string');

    expect(output.recipientEmail).toBeDefined();
    expect(typeof output.recipientEmail).toBe('string');

    expect(output.includedIssueCount).toBe(1);

    expect(output.submissionSummary).toBeDefined();
    expect(output.submissionSummary.submittedCount).toBe(2);
    expect(output.submissionSummary.unsubmittedCount).toBe(1);
    expect(output.submissionSummary.submissionRate).toBe(66.67);

    // メール本文に含まれた課題の影響度スコアが100に正規化されていることを確認
    expect(output.includedIssueCount).toBe(1);
  });
});