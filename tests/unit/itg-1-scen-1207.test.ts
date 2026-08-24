import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
  ValidatedIssue,
  ToolIntegrationResult,
  ExecutionSummary,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('朝会報告管理システム - 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1207: [normal] 既存ツール連携機能 - 抽出された課題データ複数件が既存ツールに正常に連携される
  test('3件の課題データが既存ツール連携機能によって正常に処理され、課題キーワード辞書に保存される', async () => {
    // テストデータの準備：3件の抽出課題データ
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        title: 'Database connection timeout',
        description: 'Connection to database times out under load',
        extractedAt: new Date('2024-01-15T09:00:00Z'),
        sourceReportId: 'report-001',
        confidence: 0.92,
      },
      {
        issueId: 'issue-002',
        title: 'Memory leak in batch process',
        description: 'Memory usage increases continuously during batch job execution',
        extractedAt: new Date('2024-01-15T09:15:00Z'),
        sourceReportId: 'report-002',
        confidence: 0.88,
      },
      {
        issueId: 'issue-003',
        title: 'API response latency',
        description: 'API endpoints respond slowly during peak hours',
        extractedAt: new Date('2024-01-15T09:30:00Z'),
        sourceReportId: 'report-003',
        confidence: 0.85,
      },
    ];

    // 既存ツール連携設定
    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com',
      apiToken: 'test-token-12345',
      projectKey: 'TEST',
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000,
    };

    // 優先度判定ルール
    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      thresholds: {
        highPriority: 70,
        mediumPriority: 40,
        lowPriority: 0,
      },
    };

    // カテゴリマッピング
    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'infrastructure',
        toolCategory: 'Infrastructure',
        toolCategoryId: 'CAT-001',
      },
      {
        systemCategory: 'performance',
        toolCategory: 'Performance',
        toolCategoryId: 'CAT-002',
      },
      {
        systemCategory: 'api',
        toolCategory: 'API',
        toolCategoryId: 'CAT-003',
      },
    ];

    // TextAnalysisServiceAdapterのモック
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn()
        .mockResolvedValueOnce({
          keywords: ['database', 'connection', 'timeout', 'load'],
          frequency: [5, 4, 3, 2],
        })
        .mockResolvedValueOnce({
          keywords: ['memory', 'leak', 'batch', 'process'],
          frequency: [6, 4, 3, 2],
        })
        .mockResolvedValueOnce({
          keywords: ['api', 'response', 'latency', 'peak'],
          frequency: [7, 5, 4, 3],
        }),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce(72)
        .mockResolvedValueOnce(88)
        .mockResolvedValueOnce(45),
      classifyIssueSeverity: jest.fn()
        .mockResolvedValueOnce('high')
        .mockResolvedValueOnce('high')
        .mockResolvedValueOnce('medium'),
    };

    // ToolIntegrationServiceAdapterのモック
    const mockToolIntegrationAdapter = {
      validateConnection: jest.fn().mockResolvedValueOnce({ connected: true }),
      createIssue: jest.fn()
        .mockResolvedValueOnce({ issueKey: 'TEST-100', issueId: 'issue-001-jira' })
        .mockResolvedValueOnce({ issueKey: 'TEST-101', issueId: 'issue-002-jira' })
        .mockResolvedValueOnce({ issueKey: 'TEST-102', issueId: 'issue-003-jira' }),
      checkForDuplicates: jest.fn()
        .mockResolvedValueOnce({ isDuplicate: false })
        .mockResolvedValueOnce({ isDuplicate: false })
        .mockResolvedValueOnce({ isDuplicate: false }),
      linkRelatedIssues: jest.fn().mockResolvedValue({ linked: true }),
    };

    // NotificationServiceAdapterのモック
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValueOnce({
        status: 'delivered',
        timestamp: new Date('2024-01-15T09:45:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValueOnce({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValueOnce({ status: 'delivered' }),
    };

    // エージェント入力データの構築
    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // エージェント実行
    const result = await runTx5Imp1Agent(agentInput, {
      textAnalysisService: mockTextAnalysisAdapter,
      toolIntegrationService: mockToolIntegrationAdapter,
      notificationService: mockNotificationAdapter,
    });

    // 検証1：外部サービスの呼び出し回数を確認
    // extractKeywordsが3回呼び出されたこと
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);
    // assessImpactScoreが3回呼び出されたこと
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(3);
    // classifyIssueSeverityが3回呼び出されたこと
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(3);

    // 検証2：validatedIssuesの構造と内容を確認
    expect(result).toBeDefined();
    expect(result.validatedIssues).toHaveLength(3);

    // 第1件の課題：Database connection timeout（優先度スコア：72、ランク：high）
    const validatedIssue1: ValidatedIssue = result.validatedIssues[0];
    expect(validatedIssue1.issueId).toBe('issue-001');
    expect(validatedIssue1.priorityScore).toBe(72);
    expect(validatedIssue1.priorityRank).toBe('high');
    expect(validatedIssue1.category).toBe('infrastructure');
    expect(validatedIssue1.toolIssueId).toBe('TEST-100');
    expect(validatedIssue1.validationStatus).toBe('valid');

    // 第2件の課題：Memory leak in batch process（優先度スコア：88、ランク：high）
    const validatedIssue2: ValidatedIssue = result.validatedIssues[1];
    expect(validatedIssue2.issueId).toBe('issue-002');
    expect(validatedIssue2.priorityScore).toBe(88);
    expect(validatedIssue2.priorityRank).toBe('high');
    expect(validatedIssue2.category).toBe('performance');
    expect(validatedIssue2.toolIssueId).toBe('TEST-101');
    expect(validatedIssue2.validationStatus).toBe('valid');

    // 第3件の課題：API response latency（優先度スコア：45、ランク：medium）
    const validatedIssue3: ValidatedIssue = result.validatedIssues[2];
    expect(validatedIssue3.issueId).toBe('issue-003');
    expect(validatedIssue3.priorityScore).toBe(45);
    expect(validatedIssue3.priorityRank).toBe('medium');
    expect(validatedIssue3.category).toBe('api');
    expect(validatedIssue3.toolIssueId).toBe('TEST-102');
    expect(validatedIssue3.validationStatus).toBe('valid');

    // 検証3：integrationResultの内容を確認
    const integrationResult: ToolIntegrationResult = result.integrationResult;
    expect(integrationResult).toBeDefined();
    expect(integrationResult.successCount).toBe(3);
    expect(integrationResult.failureCount).toBe(0);
    expect(integrationResult.toolType).toBe('jira');
    expect(integrationResult.processedIssueCount).toBe(3);

    // 検証4：executionSummaryの内容を確認
    const executionSummary: ExecutionSummary = result.executionSummary;
    expect(executionSummary).toBeDefined();
    expect(executionSummary.totalProcessed).toBe(3);
    expect(executionSummary.successCount).toBe(3);
    expect(executionSummary.failureCount).toBe(0);
    expect(executionSummary.status).toBe('success');
    expect(executionSummary.executionStartTime).toBeLessThanOrEqual(
      executionSummary.executionEndTime,
    );

    // 検証5：toolIntegrationServiceの呼び出しを確認
    expect(mockToolIntegrationAdapter.validateConnection).toHaveBeenCalledTimes(1);
    expect(mockToolIntegrationAdapter.createIssue).toHaveBeenCalledTimes(3);
    expect(mockToolIntegrationAdapter.checkForDuplicates).toHaveBeenCalledTimes(3);
  });
});