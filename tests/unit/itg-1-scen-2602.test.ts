import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1 orchestrator - initial report data quality assessment', () => {
  // SCEN-2602
  test('should throw error when formatUniformityScore is returned as string instead of number', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['リソース不足'],
        frequency: [1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue('85%'),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: true,
      }),
    };

    const input = {
      deploymentInitiationTimestamp: new Date('2024-01-15T08:00:00Z'),
      participantList: [
        {
          userId: 'eng001',
          role: 'Engineer',
          email: 'eng001@example.com',
        },
        {
          userId: 'eng002',
          role: 'Engineer',
          email: 'eng002@example.com',
        },
        {
          userId: 'eng003',
          role: 'Engineer',
          email: 'eng003@example.com',
        },
        {
          userId: 'eng004',
          role: 'Engineer',
          email: 'eng004@example.com',
        },
        {
          userId: 'eng005',
          role: 'Engineer',
          email: 'eng005@example.com',
        },
        {
          userId: 'eng006',
          role: 'Engineer',
          email: 'eng006@example.com',
        },
        {
          userId: 'eng007',
          role: 'Engineer',
          email: 'eng007@example.com',
        },
        {
          userId: 'eng008',
          role: 'Engineer',
          email: 'eng008@example.com',
        },
        {
          userId: 'eng009',
          role: 'Engineer',
          email: 'eng009@example.com',
        },
        {
          userId: 'eng010',
          role: 'Engineer',
          email: 'eng010@example.com',
        },
        {
          userId: 'pm001',
          role: 'ProjectManager',
          email: 'pm001@example.com',
        },
        {
          userId: 'mgr001',
          role: 'Manager',
          email: 'mgr001@example.com',
        },
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    const initialTestReports = [
      {
        userId: 'eng001',
        yesterdayWork: 'タスクA完了',
        todayWork: 'タスクB開始',
        issues: 'リソース不足',
      },
      {
        userId: 'eng002',
        yesterdayWork: 'テスト実施',
        todayWork: 'バグ修正',
        issues: 'スケジュール遅延',
      },
      {
        userId: 'eng003',
        yesterdayWork: 'レビュー',
        todayWork: 'マージ',
        issues: 'なし',
      },
      {
        userId: 'eng004',
        yesterdayWork: 'ドキュメント作成',
        todayWork: 'ドキュメント更新',
        issues: 'なし',
      },
      {
        userId: 'eng005',
        yesterdayWork: 'デプロイ',
        todayWork: 'モニタリング',
        issues: 'アラート多数',
      },
      {
        userId: 'eng006',
        yesterdayWork: 'ミーティング',
        todayWork: 'タスク割り当て',
        issues: 'なし',
      },
      {
        userId: 'eng007',
        yesterdayWork: 'コード確認',
        todayWork: 'フィードバック',
        issues: '品質問題',
      },
      {
        userId: 'eng008',
        yesterdayWork: '機能開発',
        todayWork: '実装続行',
        issues: 'なし',
      },
      {
        userId: 'eng009',
        yesterdayWork: 'インシデント対応',
        todayWork: 'レポート作成',
        issues: '重大障害',
      },
      {
        userId: 'eng010',
        yesterdayWork: 'パフォーマンス調査',
        todayWork: '最適化',
        issues: 'なし',
      },
    ];

    await expect(
      runTx10Imp1Agent(input, mockTextAnalysisServiceAdapter, mockNotificationServiceAdapter, initialTestReports)
    ).rejects.toThrow(/形式/);
  });
});