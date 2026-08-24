import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1220: [error] 既存ツール連携機能 - 連携先ツールの認証情報が空のとき処理が中断される
  test('should throw error and record failed notification when authentication credentials are empty', async () => {
    const extractedIssueData = [
      {
        issueId: 'ISSUE-001',
        title: '本番環境でのメモリリーク発生',
        description: 'ユーザー数が100以上になるとメモリ使用率が異常上昇',
        occurrenceFrequency: 3,
        impactScore: 85,
        reportedDate: '2024-01-15',
        category: 'システム'
      },
      {
        issueId: 'ISSUE-002',
        title: 'APIレスポンス遅延',
        description: '夜間の大量アクセス時にAPIレスポンスが5秒以上遅延',
        occurrenceFrequency: 2,
        impactScore: 72,
        reportedDate: '2024-01-15',
        category: 'パフォーマンス'
      }
    ];

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      baseUrl: 'https://jira.example.com',
      slackToken: '', // 空の認証情報
      teamsWebhookUrl: '', // 空の認証情報
      apiKey: '',
      projectKey: 'DEV'
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highScoreThreshold: 75,
      mediumScoreThreshold: 50,
      recurrenceMultiplier: 1.5
    };

    const categoryMappings = [
      {
        sourceCategory: 'システム',
        targetToolCategory: 'Bug',
        priority: 'High'
      },
      {
        sourceCategory: 'パフォーマンス',
        targetToolCategory: 'Task',
        priority: 'Medium'
      }
    ];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockImplementation(() => {
        throw new Error('Authentication credentials are empty for notification service');
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn()
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'メモリリーク', frequency: 3, confidence: 0.95 },
        { keyword: 'API遅延', frequency: 2, confidence: 0.88 }
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(78),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    const mockAiClient: Tx5Imp1AiClient = {
      notificationService: mockNotificationServiceAdapter,
      textAnalysisService: mockTextAnalysisServiceAdapter,
      toolIntegrationService: {
        validateAndSyncIssue: jest.fn(),
        retryFailedSync: jest.fn()
      }
    };

    const input = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings
    };

    // 認証情報空チェックでエラーが発生することを検証
    await expect(
      runTx5Imp1Agent(input, mockAiClient)
    ).rejects.toThrow(/Authentication/);

    // NotificationServiceAdapter が呼び出されたことを確認
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
  });
});