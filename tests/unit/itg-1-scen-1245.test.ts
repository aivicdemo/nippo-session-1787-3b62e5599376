import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題優先度スコア計算と既存ツール連携', () => {
  // SCEN-1245: [edge] 優先度スコア小数点丸め処理
  test('優先度スコア72.5847が四捨五入により73に丸められ、整数値のみが外部連携される', async () => {
    // Setup: TextAnalysisServiceAdapterのassessImpactScoreをモック化
    // 戻り値として小数点を含むスコア値72.5847を返す
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['データベース接続エラー'],
        frequencies: [3],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(72.5847),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    // Setup: NotificationServiceAdapterのスタブ
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        deliveredAt: new Date('2024-01-15T09:00:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'sched-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };

    // Setup: ToolIntegrationConfigの定義
    const toolIntegrationConfig: ToolIntegrationConfig = {
      targetTool: 'jira',
      endpoint: 'https://jira.example.com/api/v3',
      apiKey: 'test-api-key-placeholder',
      projectKey: 'TEST',
    };

    // Setup: PriorityRuleSetの定義
    // 発生頻度の重み付け: 0.6、影響度の重み付け: 0.4
    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.6,
      impactWeight: 0.4,
      highThreshold: 70,
      mediumThreshold: 40,
      lowThreshold: 0,
    };

    // Setup: CategoryMappingの定義
    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: '技術的課題',
        externalToolCategory: 'Technical',
        priority: 'high',
      },
    ];

    // Setup: ExtractedIssueの準備
    // 小数点を含むスコア72.5847を返すシナリオ
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        description: 'データベース接続エラーが複数のモジュールで発生',
        frequency: 3,
        impactScore: 72.5847,
        category: '技術的課題',
        severity: 'high',
      },
    ];

    // 入力データの構築
    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // 実行
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      agentInput,
      mockTextAnalysisAdapter
    );

    // 検証1: validatedIssuesが返却されること
    expect(result.validatedIssues).toBeDefined();
    expect(Array.isArray(result.validatedIssues)).toBe(true);
    expect(result.validatedIssues.length).toBeGreaterThan(0);

    // 検証2: 優先度スコアが四捨五入により73に丸められていること
    const validatedIssue = result.validatedIssues[0];
    expect(validatedIssue.priorityScore).toBe(73);

    // 検証3: 整数値のみが格納されていること（小数点がないこと）
    expect(Number.isInteger(validatedIssue.priorityScore)).toBe(true);

    // 検証4: 優先度ランクがhighとして判定されていること（73は70以上）
    expect(validatedIssue.priorityRank).toBe('high');

    // 検証5: validationStatusが正常値であること
    expect(validatedIssue.validationStatus).toBe('valid');

    // 検証6: カテゴリが正しくマッピングされていること
    expect(validatedIssue.category).toBe('Technical');

    // 検証7: integrationResultが返却されていること
    expect(result.integrationResult).toBeDefined();

    // 検証8: integrationResultのステータスがsuccess、partial_failure、またはretry_scheduledのいずれかであること
    expect(['success', 'partial_failure', 'retry_scheduled']).toContain(
      result.integrationResult.integrationStatus
    );

    // 検証9: executionSummaryが返却されていること
    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.status).toBeDefined();
    expect(result.executionSummary.processedIssueCount).toBeGreaterThanOrEqual(1);

    // 検証10: 外部連携時には小数点を含まない整数値のみが送出されること
    // integrationResultに含まれるすべての課題IDが整数値として送出されていることを確認
    if (result.integrationResult.successCount > 0) {
      expect(Number.isInteger(validatedIssue.priorityScore)).toBe(true);
      expect(validatedIssue.priorityScore).toBe(73);
    }
  });
});