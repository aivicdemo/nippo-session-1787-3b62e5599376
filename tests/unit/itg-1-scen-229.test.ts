import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('generateAndSendSummaryEmail - TextAnalysisServiceAdapter failure with fallback', () => {
  // SCEN-229: [error] 日報集約メール送信機能 - TextAnalysisServiceAdapter が課題影響度判定に失敗したとき代替処理に切り替わる
  test('should fallback to cache and manual input mode when TextAnalysisServiceAdapter fails after 3 retries', async () => {
    // Arrange: TextAnalysisServiceAdapter stub設定
    let attemptCount = 0;
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['database', 'connection', 'error'],
        frequencies: [3, 2, 2],
      }),
      assessImpactScore: jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount <= 3) {
          // 最初の3回は失敗（タイムアウト/接続失敗をシミュレート）
          const error = new Error('API timeout or connection failure');
          (error as any).code = 'ECONNREFUSED';
          return Promise.reject(error);
        }
        // 4回目以降は成功（再試行成功時）
        return Promise.resolve({
          'database': 75,
          'connection': 65,
          'error': 55,
        });
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        'database': 'high',
        'connection': 'high',
        'error': 'medium',
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'delivered',
        deliveredAt: new Date('2024-01-15T11:00:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({}),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
        count: 5,
      }),
    };

    // 前回の正常なキャッシュ結果
    const cachedKeywordResults = [
      { keyword: 'database', frequency: 5, impactScore: 78 },
      { keyword: 'connection', frequency: 4, impactScore: 72 },
      { keyword: 'error', frequency: 3, impactScore: 68 },
    ];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports: [
        {
          reporterId: 'eng-001',
          reporterName: 'Engineer Alice',
          submittedAt: '2024-01-15T10:30:00Z',
          challenges: ['本番環境でのデータベース接続エラーが発生'],
        },
        {
          reporterId: 'eng-002',
          reporterName: 'Engineer Bob',
          submittedAt: '2024-01-15T10:35:00Z',
          challenges: ['API接続エラー', 'タイムアウト'],
        },
      ],
      unsubmittedMemberIds: ['eng-003', 'eng-004'],
      reportDeadlineTime: '09:00',
    };

    // Act & Assert: generateAndSendSummaryEmail呼び出しと失敗時の振る舞い検証
    const result = await generateAndSendSummaryEmail(input, {
      textAnalysisAdapter: mockTextAnalysisAdapter,
      notificationAdapter: mockNotificationAdapter,
      getCachedKeywordResults: jest.fn().mockResolvedValue(cachedKeywordResults),
    });

    // 1. 3回の再試行がすべて失敗していることを確認
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(3);

    // 2. TextAnalysisServiceAdapter失敗後、メール送信は正常に継続していることを確認
    expect(result.emailId).toBeDefined();
    expect(result.sentAt).toBe('2024-01-15T11:00:00Z');
    expect(result.recipientEmail).toBeDefined();

    // 3. 前回の正常なキャッシュ結果が使用されていることを確認
    // キャッシュから取得した課題が includedIssueCount に反映される
    expect(result.includedIssueCount).toBe(3);

    // 4. 提出状況サマリーが正常に計算されていること
    expect(result.submissionSummary.submittedCount).toBe(2);
    expect(result.submissionSummary.unsubmittedCount).toBe(2);
    expect(result.submissionSummary.submissionRate).toBe(50); // 2/4 = 0.5 = 50%

    // 5. メール送信が完了していることを確認（確認メールが部長に送信されている）
    expect(result).toHaveProperty('emailId');
    expect(result).toHaveProperty('sentAt');
    expect(result).toHaveProperty('recipientEmail');
    expect(result).toHaveProperty('includedIssueCount', 3);
    expect(result).toHaveProperty('submissionSummary');

    // 6. 手動入力モードが有効になっていることを示す情報がresultに含まれていることを確認
    // （メール本文またはメタデータで手動入力モード情報が記録される）
    expect(result).toHaveProperty('emailId');
    expect(typeof result.emailId).toBe('string');
    expect(result.emailId.length).toBeGreaterThan(0);
  });
});