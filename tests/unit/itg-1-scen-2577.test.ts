import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('朝会報告アプリ初期導入・ユーザー教育 - 初回報告データ評価機能', () => {
  // SCEN-2577: [normal] 初回報告データ評価機能 - 提出率90%以上・データ品質スコア80点以上・形式統一度85%以上をすべて満たす場合、本格運用への移行判定が真になる
  test('提出率90%・データ品質スコア80点・形式統一度85%をすべて満たす場合、本格運用への移行判定がtrueになること', async () => {
    // テストデータセット準備：初回報告データ
    const testReportData = {
      totalTeamMembers: 10,
      submittedReports: [
        {
          userId: 'user_001',
          reportContent: '昨日やったこと：機能A実装\n今日やること：機能B実装\n抱えている課題：要件変更対応',
          submittedAt: '2024-01-15T08:45:00Z',
        },
        {
          userId: 'user_002',
          reportContent: '昨日やったこと：バグ修正\n今日やること：テスト実施\n抱えている課題：環境構築',
        },
        {
          userId: 'user_003',
          reportContent: '昨日やったこと：ドキュメント作成\n今日やること：レビュー対応\n抱えている課題：スケジュール遅延',
        },
        {
          userId: 'user_004',
          reportContent: '昨日やったこと：デバッグ\n今日やること：本番リリース準備\n抱えている課題：性能問題',
        },
        {
          userId: 'user_005',
          reportContent: '昨日やったこと：画面実装\n今日やること：統合テスト\n抱えている課題：依存関係解決',
        },
        {
          userId: 'user_006',
          reportContent: '昨日やったこと：API開発\n今日やること：ドキュメント更新\n抱えている課題：仕様曖昧性',
        },
        {
          userId: 'user_007',
          reportContent: '昨日やったこと：インフラ構築\n今日やること：監視設定\n抱えている課題：容量不足警告',
        },
        {
          userId: 'user_008',
          reportContent: '昨日やったこと：セキュリティチェック\n今日やること：脆弱性対応\n抱えている課題：認証問題',
        },
        {
          userId: 'user_009',
          reportContent: '昨日やったこと：パフォーマンス最適化\n今日やること：負荷テスト\n抱えている課題：メモリリーク',
        },
      ],
    };

    // TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisService = {
      extractKeywords: jest.fn((text: string) => ({
        keywords: ['機能実装', 'バグ修正', '要件変更'],
        frequencies: [15, 12, 8],
      })),
      assessImpactScore: jest.fn((keywords: string[]) => ({
        impactScores: [75, 68, 72],
      })),
      classifyIssueSeverity: jest.fn((issueText: string) => ({
        severity: 'medium',
        confidence: 0.85,
      })),
    };

    // NotificationServiceAdapterをモック化
    const mockNotificationService = {
      sendReminderNotification: jest.fn((userId: string, message: string) =>
        Promise.resolve({ status: 'sent', userId, timestamp: '2024-01-15T09:00:00Z' })
      ),
      scheduleNotification: jest.fn((scheduleCfg: any) =>
        Promise.resolve({ scheduleId: 'sched_001', status: 'scheduled' })
      ),
      getDeliveryStatus: jest.fn((notificationId: string) =>
        Promise.resolve({ status: 'delivered', notificationId })
      ),
    };

    // 初回報告データ評価機能を実行
    const result = await runTx10Imp1Agent(
      {
        deploymentInitiationTimestamp: new Date('2024-01-15T08:00:00Z'),
        participantList: [
          { userId: 'pm_001', role: 'ProjectManager', email: 'pm@example.com' },
          { userId: 'manager_001', role: 'Manager', email: 'manager@example.com' },
          { userId: 'user_001', role: 'Engineer', email: 'user001@example.com' },
          { userId: 'user_002', role: 'Engineer', email: 'user002@example.com' },
          { userId: 'user_003', role: 'Engineer', email: 'user003@example.com' },
          { userId: 'user_004', role: 'Engineer', email: 'user004@example.com' },
          { userId: 'user_005', role: 'Engineer', email: 'user005@example.com' },
          { userId: 'user_006', role: 'Engineer', email: 'user006@example.com' },
          { userId: 'user_007', role: 'Engineer', email: 'user007@example.com' },
          { userId: 'user_008', role: 'Engineer', email: 'user008@example.com' },
          { userId: 'user_009', role: 'Engineer', email: 'user009@example.com' },
          { userId: 'user_010', role: 'Engineer', email: 'user010@example.com' },
        ],
        preparationDaysRequired: 5,
        reportingDeadlineTime: '09:00',
      },
      mockTextAnalysisService,
      mockNotificationService
    );

    // 評価結果から3つの判定値を確認
    expect(result).toBeDefined();
    expect(result.initialReportAnalysis).toBeDefined();

    // (1) 提出率 = 90%以上を確認
    const submissionRate = result.initialReportAnalysis.submissionRate;
    expect(submissionRate).toBe(90);

    // (2) データ品質スコア = 80点以上を確認
    const dataQualityScore = result.initialReportAnalysis.dataQualityScore;
    expect(dataQualityScore).toBe(80);

    // (3) 形式統一度スコア = 85%以上を確認
    const formatUniformityScore = result.initialReportAnalysis.formatUniformityScore;
    expect(formatUniformityScore).toBe(85);

    // 本格運用への移行判定フラグを確認
    // 3つの条件をすべて満たす場合（90 >= 90 AND 80 >= 80 AND 85 >= 85）、移行判定がtrueになること
    expect(result.onboardingApprovalStatus).toBeDefined();
    expect(result.onboardingApprovalStatus.isApproved).toBe(true);
    expect(result.onboardingApprovalStatus.canTransitionToProduction).toBe(true);
  });
});