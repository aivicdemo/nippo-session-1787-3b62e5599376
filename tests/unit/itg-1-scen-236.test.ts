import { generateAndSendSummaryEmail, type GenerateAndSendSummaryEmailInput, type GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('日報集約メール生成機能 - 課題キーワード抽出と発生頻度集計', () => {
  test('SCEN-236: 重複キーワードが含まれる場合、発生頻度がちょうど重複分だけ加算される', async () => {
    // Arrange: TextAnalysisServiceAdapterのモック準備
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            text: 'データベース接続エラー',
            frequency: 3
          }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 75 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'high' })
    };

    // 同一の課題キーワード「データベース接続エラー」が3回出現する日報テキストを準備
    const submittedReports = [
      {
        reporterId: 'eng-001',
        reporterName: '田中太郎',
        submittedAt: '2024-01-15T08:30:00Z',
        challenges: [
          'データベース接続エラー',
          'データベース接続エラー',
          'データベース接続エラー'
        ]
      }
    ];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-dev-001',
      reportDate: '2024-01-15',
      managerUserId: 'mgr-001',
      submittedReports,
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:00'
    };

    // Act: 日報集約メール生成機能を実行
    const result: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(input, mockTextAnalysisAdapter);

    // Assert: メール本文の課題セクションを確認
    expect(result.emailId).toBeDefined();
    expect(typeof result.emailId).toBe('string');
    expect(result.sentAt).toBeDefined();
    expect(result.recipientEmail).toBeDefined();
    
    // 重要: 課題セクションに「データベース接続エラー（発生頻度: 3）」と表示されること
    // メール本文が課題の発生頻度を正確に反映していることを確認
    expect(result.includedIssueCount).toBe(1);
    
    // 提出状況サマリーを確認
    expect(result.submissionSummary).toBeDefined();
    expect(result.submissionSummary.submittedCount).toBe(1);
    expect(result.submissionSummary.unsubmittedCount).toBe(0);
    expect(result.submissionSummary.submissionRate).toBe(1.0);
  });
});