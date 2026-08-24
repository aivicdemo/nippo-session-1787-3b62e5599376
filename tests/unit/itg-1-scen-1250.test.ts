import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ValidatedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('Tx5Imp1Agent - 既存ツール連携機能', () => {
  // SCEN-1250: [edge] 既存ツール連携機能 - 抽出課題データに完全に重複したレコードが含まれる場合、1件のみ連携される
  test('should deduplicate completely identical extracted issue records and register only one to the integration target', async () => {
    // Arrange: 完全に重複した2件のレコードを含む抽出課題データセットを用意
    const duplicateIssueId = 'issue-dup-001';
    const duplicateKeyword = 'データベース接続エラー';
    const duplicateFrequency = 3;
    const duplicateImpactScore = 75;

    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: duplicateIssueId,
        keyword: duplicateKeyword,
        frequency: duplicateFrequency,
        impactScore: duplicateImpactScore,
        occurrences: ['2024-01-15', '2024-01-16', '2024-01-17'],
      },
      {
        issueId: duplicateIssueId,
        keyword: duplicateKeyword,
        frequency: duplicateFrequency,
        impactScore: duplicateImpactScore,
        occurrences: ['2024-01-15', '2024-01-16', '2024-01-17'],
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/rest/api/3',
      projectKey: 'TEST',
      apiToken: 'stub-token-for-testing',
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'インフラ',
        toolCategory: 'Infrastructure',
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // Mock AI client: TextAnalysisServiceAdapter
    const mockAiClient = {
      validateAndEnrichIssues: jest.fn().mockResolvedValue({
        validatedIssues: [
          {
            issueId: duplicateIssueId,
            priorityScore: 69,
            priorityRank: 'medium' as const,
            category: 'Infrastructure',
            toolIssueId: null,
            validationStatus: 'valid' as const,
          },
        ],
        validationDetails: {
          totalProcessed: 2,
          validCount: 1,
          duplicateCount: 1,
          invalidCount: 0,
        },
      }),
      integrateTool: jest.fn().mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        toolIssueIds: [{ systemIssueId: duplicateIssueId, toolIssueId: 'JIRA-12345' }],
        errors: [],
      }),
      generateExecutionSummary: jest.fn().mockResolvedValue({
        processingTimeMs: 1234,
        exceptionOccurred: false,
        finalStatus: 'success',
        summary: 'Duplicate record successfully deduplicated',
      }),
    };

    // Act: 既存ツール連携機能を実行
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, mockAiClient);

    // Assert: 重複排除結果を検証
    // 1. validatedIssuesには1件のみが含まれることを確認
    expect(result.validatedIssues).toHaveLength(1);

    // 2. validatedIssuesの内容が正しいことを確認
    expect(result.validatedIssues[0]).toEqual({
      issueId: duplicateIssueId,
      priorityScore: 69,
      priorityRank: 'medium',
      category: 'Infrastructure',
      toolIssueId: 'JIRA-12345',
      validationStatus: 'valid',
    });

    // 3. integrationResultで重複カウントが1であることを確認
    expect(result.integrationResult.successCount).toBe(1);
    expect(result.integrationResult.failureCount).toBe(0);

    // 4. executionSummaryが成功を示していることを確認
    expect(result.executionSummary.finalStatus).toBe('success');
    expect(result.executionSummary.exceptionOccurred).toBe(false);

    // 5. AIクライアントの呼び出しが想定通りであることを確認
    expect(mockAiClient.validateAndEnrichIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.validateAndEnrichIssues).toHaveBeenCalledWith(
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings
    );

    expect(mockAiClient.integrateTool).toHaveBeenCalledTimes(1);
    expect(mockAiClient.generateExecutionSummary).toHaveBeenCalledTimes(1);
  });
});