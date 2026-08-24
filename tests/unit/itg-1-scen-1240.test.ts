import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
  ValidatedIssue,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 既存ツール連携機能 - 課題抽出から検証・連携までの自律実行', () => {
  // SCEN-1240: [edge] 既存ツール連携機能 - 抽出課題データ件数が上限値未満の場合、すべて重複なく連携される
  test('should validate and integrate 9 extracted issues without duplication when count is below limit', async () => {
    // Arrange: モック AI クライアントを構築
    const mockExtractedIssues: ExtractedIssue[] = [
      {
        issueId: 'ext-001',
        keyword: 'データベース接続エラー',
        frequency: 5,
        impactScore: 75,
        confidenceScore: 0.92,
      },
      {
        issueId: 'ext-002',
        keyword: 'メモリリーク',
        frequency: 3,
        impactScore: 85,
        confidenceScore: 0.88,
      },
      {
        issueId: 'ext-003',
        keyword: 'API タイムアウト',
        frequency: 4,
        impactScore: 70,
        confidenceScore: 0.85,
      },
      {
        issueId: 'ext-004',
        keyword: 'ログファイル肥大化',
        frequency: 6,
        impactScore: 50,
        confidenceScore: 0.80,
      },
      {
        issueId: 'ext-005',
        keyword: 'スレッド競合',
        frequency: 2,
        impactScore: 90,
        confidenceScore: 0.95,
      },
      {
        issueId: 'ext-006',
        keyword: 'キャッシュミス',
        frequency: 7,
        impactScore: 60,
        confidenceScore: 0.82,
      },
      {
        issueId: 'ext-007',
        keyword: 'リソースリーク',
        frequency: 3,
        impactScore: 80,
        confidenceScore: 0.89,
      },
      {
        issueId: 'ext-008',
        keyword: '設定ファイルエラー',
        frequency: 2,
        impactScore: 65,
        confidenceScore: 0.78,
      },
      {
        issueId: 'ext-009',
        keyword: 'ネットワーク遅延',
        frequency: 4,
        impactScore: 72,
        confidenceScore: 0.86,
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      targetTool: 'jira',
      apiEndpoint: 'https://jira.example.com/api/v3',
      apiKey: 'mock-api-key',
      projectKey: 'TEST',
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000,
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highScoreThreshold: 75,
      mediumScoreThreshold: 50,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'パフォーマンス',
        jiraCategory: 'Performance',
        asanaCategory: 'Performance Issues',
      },
      {
        systemCategory: 'システム構成',
        jiraCategory: 'Configuration',
        asanaCategory: 'Setup',
      },
      {
        systemCategory: 'ネットワーク',
        jiraCategory: 'Network',
        asanaCategory: 'Network Issues',
      },
    ];

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData: mockExtractedIssues,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // モック AI クライアント
    const mockAiClient = {
      validateIssues: jest.fn().mockResolvedValue({
        validatedIssues: mockExtractedIssues.map((issue) => ({
          issueId: issue.issueId,
          priorityScore:
            issue.frequency * priorityRules.frequencyWeight +
            issue.impactScore * priorityRules.impactWeight,
          priorityRank:
            issue.frequency * priorityRules.frequencyWeight +
              issue.impactScore * priorityRules.impactWeight >=
            priorityRules.highScoreThreshold
              ? 'high'
              : issue.frequency * priorityRules.frequencyWeight +
                  issue.impactScore * priorityRules.impactWeight >=
                priorityRules.mediumScoreThreshold
                ? 'medium'
                : 'low',
          category: 'パフォーマンス',
          toolIssueId: null,
          validationStatus: 'valid' as const,
        })),
      }),
      classifyIssues: jest.fn().mockResolvedValue({
        classifications: mockExtractedIssues.map((issue) => ({
          issueId: issue.issueId,
          category: 'パフォーマンス',
          confidence: issue.confidenceScore,
        })),
      }),
      integrateWithTool: jest.fn().mockResolvedValue({
        successCount: 9,
        failureCount: 0,
        toolIssueIds: [
          'JIRA-001',
          'JIRA-002',
          'JIRA-003',
          'JIRA-004',
          'JIRA-005',
          'JIRA-006',
          'JIRA-007',
          'JIRA-008',
          'JIRA-009',
        ],
      }),
    };

    // Act: エージェント実行
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      agentInput,
      mockAiClient
    );

    // Assert: 検証ステータス確認
    expect(result.validatedIssues).toBeDefined();
    expect(result.validatedIssues.length).toBe(9);

    // 検証済み課題の内容確認
    result.validatedIssues.forEach((validatedIssue, index) => {
      expect(validatedIssue.issueId).toBe(mockExtractedIssues[index].issueId);
      expect(validatedIssue.validationStatus).toBe('valid');
      expect(typeof validatedIssue.priorityScore).toBe('number');
      expect(validatedIssue.priorityRank).toMatch(/^(high|medium|low)$/);
      expect(validatedIssue.category).toBe('パフォーマンス');
    });

    // 優先度スコアの検証
    const validatedIssue1 = result.validatedIssues[0];
    const expectedScore1 =
      mockExtractedIssues[0].frequency *
        priorityRules.frequencyWeight +
      mockExtractedIssues[0].impactScore * priorityRules.impactWeight;
    expect(validatedIssue1.priorityScore).toBe(expectedScore1);

    // 連携結果の検証
    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.successCount).toBe(9);
    expect(result.integrationResult.failureCount).toBe(0);
    expect(result.integrationResult.toolIssueIds.length).toBe(9);
    expect(result.integrationResult.toolIssueIds).toEqual([
      'JIRA-001',
      'JIRA-002',
      'JIRA-003',
      'JIRA-004',
      'JIRA-005',
      'JIRA-006',
      'JIRA-007',
      'JIRA-008',
      'JIRA-009',
    ]);

    // 実行サマリーの検証
    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.totalProcessed).toBe(9);
    expect(result.executionSummary.duplicatesRemoved).toBe(0);
    expect(result.executionSummary.finalStatus).toBe('success');
    expect(typeof result.executionSummary.executionTimeMs).toBe('number');

    // 重複排除が実施されたことの確認
    const issueIds = result.validatedIssues.map((issue) => issue.issueId);
    const uniqueIssueIds = new Set(issueIds);
    expect(uniqueIssueIds.size).toBe(9);

    // ツール連携の確認
    expect(mockAiClient.integrateWithTool).toHaveBeenCalled();
    expect(result.integrationResult.integrationStatus).toBe('success');
  });
});