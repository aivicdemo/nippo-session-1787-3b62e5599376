import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1216: [error] 既存ツール連携機能 - 連携設定のプロジェクトマネージャーID が空文字のとき処理が中断される
  test('should stop processing and display error when projectManagerId is empty string', async () => {
    // Arrange
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'ISSUE-001',
        title: 'Database connection timeout',
        description: 'Database queries are timing out during peak hours',
        severity: 'high',
        affectedArea: 'Backend',
        extractedAt: '2024-01-15T09:30:00Z',
        occurrenceFrequency: 3,
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      projectKey: 'PROJ',
      baseUrl: 'https://jira.example.com',
      apiToken: 'test-token-value',
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      lowThreshold: 30,
      mediumThreshold: 70,
      highThreshold: 85,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        sourceCategoryId: 'backend-issue',
        sourceCategory: 'Backend',
        targetToolCategory: 'Backend - Infrastructure',
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
      projectManagerId: '', // Empty string - invalid
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // Act & Assert
    await expect(
      runTx5Imp1Agent(input, mockNotificationAdapter as any)
    ).rejects.toThrow(/プロジェクトマネージャーID/);

    // Verify NotificationServiceAdapter was never called
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.scheduleNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.getDeliveryStatus).not.toHaveBeenCalled();
  });
});