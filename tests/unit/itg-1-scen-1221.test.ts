import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AgentInput, type Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('TX5-IMP1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1221: [error] 既存ツール連携機能 - 課題データの一意識別子（課題キー）が null のとき処理が中断される
  test('should halt analysis and switch to manual input mode when issue key is null', async () => {
    // Arrange: TextAnalysisServiceAdapterをモック化
    const mockAiClient: Tx5Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue(null),
      assessImpactScore: jest.fn().mockResolvedValue(undefined),
      classifyIssueSeverity: jest.fn().mockResolvedValue(undefined),
    };

    const extractedIssueData = [
      {
        issueId: 'issue-001',
        title: 'Database connection timeout',
        description: 'Connection to DB is timing out frequently',
        reportedBy: 'user-123',
        reportedAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        issueId: 'issue-002',
        title: 'API response slow',
        description: 'API endpoints responding slowly',
        reportedBy: 'user-456',
        reportedAt: new Date('2024-01-15T10:15:00Z'),
      },
    ];

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://jira.example.com',
      apiKey: 'test-key',
      projectKey: 'DEV',
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
    };

    const categoryMappings = [
      {
        extractedCategory: 'Database',
        toolCategory: 'Infrastructure',
      },
      {
        extractedCategory: 'API',
        toolCategory: 'Backend',
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // Act: runTx5Imp1Agentを実行
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, mockAiClient);

    // Assert: extractKeywordsがnullを返したため、以降の分析処理が実行されないことを検証
    expect(mockAiClient.extractKeywords).toHaveBeenCalled();
    expect(mockAiClient.assessImpactScore).not.toHaveBeenCalled();
    expect(mockAiClient.classifyIssueSeverity).not.toHaveBeenCalled();

    // 処理が中断され、validationStatusが'invalid'になっていることを検証
    expect(result.validatedIssues).toBeDefined();
    expect(result.validatedIssues.length).toBeGreaterThan(0);

    const invalidIssues = result.validatedIssues.filter(
      issue => issue.validationStatus === 'invalid'
    );
    expect(invalidIssues.length).toBeGreaterThan(0);

    // integrationResultで連携が失敗状態になっていることを検証
    expect(result.integrationResult.successCount).toBe(0);
    expect(result.integrationResult.failureCount).toBeGreaterThan(0);

    // executionSummaryでエラーが記録されていることを検証
    expect(result.executionSummary.finalStatus).toBe('failure');
    expect(result.executionSummary.errorOccurred).toBe(true);
    expect(result.executionSummary.errorMessage).toMatch(/課題キー/);
  });
});