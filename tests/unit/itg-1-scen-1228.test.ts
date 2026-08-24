import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type ExtractedIssue, type ToolIntegrationConfig, type PriorityRuleSet, type CategoryMapping } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1228: [error] 既存ツール連携機能 - 複数の課題データのうち 1 つの課題キーが重複しているとき処理が中断される
  test('should halt processing and throw error when duplicate issue keys are detected among multiple extracted issues', async () => {
    // テストデータ: 複数の課題データを準備（課題キー『ISSUE-001』が重複）
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'ISSUE-001',
        title: 'Database connection timeout',
        description: 'Connection to DB fails intermittently',
        severity: 'high',
        frequency: 3,
        impactScore: 85,
        keywordTokens: ['database', 'timeout', 'connection'],
      },
      {
        issueId: 'ISSUE-002',
        title: 'API response delay',
        description: 'API takes longer than expected',
        severity: 'medium',
        frequency: 2,
        impactScore: 65,
        keywordTokens: ['api', 'delay', 'response'],
      },
      {
        issueId: 'ISSUE-001', // 重複した課題キー
        title: 'Database pool exhaustion',
        description: 'DB connection pool is exhausted',
        severity: 'high',
        frequency: 5,
        impactScore: 90,
        keywordTokens: ['database', 'pool', 'exhaustion'],
      },
    ];

    // ツール連携設定
    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/rest/api/3',
      authToken: 'stub-auth-token-for-testing',
    };

    // 優先度ルール
    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 75,
      mediumThreshold: 50,
    };

    // カテゴリマッピング
    const categoryMappings: CategoryMapping[] = [
      {
        issueKeyword: 'database',
        toolCategory: 'Infrastructure',
      },
      {
        issueKeyword: 'api',
        toolCategory: 'API',
      },
    ];

    // スタブ化した AI クライアント
    const stubAiClient: Tx5Imp1AiClient = {
      validateIssueData: async (issues) => {
        // スタブが重複した課題データをそのまま返す
        return {
          validatedIssues: issues.map((issue) => ({
            issueId: issue.issueId,
            priorityScore: (issue.frequency * priorityRules.frequencyWeight +
              issue.impactScore * priorityRules.impactWeight) as number,
            priorityRank:
              issue.impactScore >= priorityRules.highThreshold
                ? ('high' as const)
                : issue.impactScore >= priorityRules.mediumThreshold
                  ? ('medium' as const)
                  : ('low' as const),
            category: categoryMappings.find((m) =>
              issue.keywordTokens.includes(m.issueKeyword)
            )?.toolCategory || 'General',
            toolIssueId: null,
            validationStatus: 'valid' as const,
          })),
          invalidIssueIds: [],
        };
      },
      integrateTool: async () => {
        // このメソッドは重複検出で処理中断前に呼ばれないはず
        throw new Error('Tool integration should not be called when duplicate keys exist');
      },
    };

    // runTx5Imp1Agent 実行時に重複課題キーが検出されて処理が中断されることを検証
    await expect(
      runTx5Imp1Agent(
        {
          extractedIssueData,
          toolIntegrationConfig,
          priorityRules,
          categoryMappings,
        },
        stubAiClient
      )
    ).rejects.toThrow(/重複/);

    // 日報送信が実行されていないこと（スタブの integrateTool が呼ばれていないこと）を検証
    // ※ stubAiClient.integrateTool は期待通りに呼ばれていないため、エラーがスローされない
  });
});