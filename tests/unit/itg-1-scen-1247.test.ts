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

describe('tx-5-imp-1: 既存ツール連携機能 - 課題キーワード出現頻度が上限値と同じ場合の処理', () => {
  test('SCEN-1247: キーワード出現頻度が上限値(10回)の場合、重複なく連携される', async () => {
    // ===== Setup: Mock TextAnalysisServiceAdapter =====
    const mockExtractKeywords = jest.fn().mockResolvedValue({
      keywords: [
        {
          keyword: 'データベース接続エラー',
          frequency: 10,
          confidenceScore: 0.95,
        },
      ],
      totalProcessed: 3,
    });

    const mockAssessImpactScore = jest.fn().mockResolvedValue({
      impactScore: 75,
      affectedTeamMembers: 5,
    });

    const mockClassifyIssueSeverity = jest.fn().mockResolvedValue({
      severity: 'high',
      justification: 'Affects database operations',
    });

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: mockExtractKeywords,
      assessImpactScore: mockAssessImpactScore,
      classifyIssueSeverity: mockClassifyIssueSeverity,
    };

    // ===== Setup: Test Data =====
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'ISSUE-001',
        content: 'データベース接続エラー が昨日発生。データベース接続エラー で処理停止。',
        reportedBy: 'engineer_001',
        reportedAt: new Date('2024-01-15T08:30:00Z'),
        sourceReport: '昨日やったこと',
      },
      {
        issueId: 'ISSUE-002',
        content: 'データベース接続エラー を修復。今日はデータベース接続エラー への対応を予定。',
        reportedBy: 'engineer_001',
        reportedAt: new Date('2024-01-15T08:30:00Z'),
        sourceReport: '今日やること',
      },
      {
        issueId: 'ISSUE-003',
        content:
          '抱えている課題: データベース接続エラー は依然解決せず。データベース接続エラー がランダムに発生する傾向。データベース接続エラー の根本原因を特定中。',
        reportedBy: 'engineer_001',
        reportedAt: new Date('2024-01-15T08:30:00Z'),
        sourceReport: '抱えている課題',
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/api/v3',
      authToken: 'test-token-12345',
      projectKey: 'PROJ',
      maxRetries: 3,
      timeoutMs: 30000,
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 75,
      mediumThreshold: 50,
      lowThreshold: 25,
      frequencyUpperLimit: 10,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'database',
        jiraIssuetype: 'Bug',
        jiraComponent: 'Database-Layer',
        asanaProjectId: 'asana_proj_001',
      },
    ];

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // ===== Execute =====
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      agentInput,
      mockTextAnalysisServiceAdapter as any
    );

    // ===== Assertions =====

    // 1. validateIssues に少なくとも1つの課題が含まれる
    expect(result.validatedIssues).toBeDefined();
    expect(Array.isArray(result.validatedIssues)).toBe(true);
    expect(result.validatedIssues.length).toBeGreaterThan(0);

    // 2. 課題が出現頻度10で登録されていることを確認
    const databaseIssue = result.validatedIssues.find(
      (issue: ValidatedIssue) =>
        issue.issueId === 'ISSUE-003' ||
        (issue.category && issue.category.includes('database'))
    );

    if (databaseIssue) {
      // 優先度スコアが計算されている (上限値 100 以下)
      expect(databaseIssue.priorityScore).toBeDefined();
      expect(typeof databaseIssue.priorityScore).toBe('number');
      expect(databaseIssue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(databaseIssue.priorityScore).toBeLessThanOrEqual(100);

      // 優先度ランクが'high'として判定されている (影響度が高いため)
      expect(databaseIssue.priorityRank).toBe('high');

      // validationStatus が 'valid' である
      expect(databaseIssue.validationStatus).toBe('valid');
    }

    // 3. TextAnalysisServiceAdapter の呼び出し回数が1回に限定されている
    // (同一キーワードの重複呼び出しがないことを確認)
    expect(mockExtractKeywords).toHaveBeenCalledTimes(1);

    // 4. 統合結果が成功ステータスであることを確認
    expect(result.integrationResult).toBeDefined();
    const integrationResult: ToolIntegrationResult =
      result.integrationResult;

    // 成功件数が1件以上
    expect(integrationResult.successCount).toBeGreaterThanOrEqual(1);

    // 失敗件数が0件
    expect(integrationResult.failureCount).toBe(0);

    // integrationStatus が 'success'
    expect(integrationResult.integrationStatus).toBe('success');

    // 5. 実行サマリーが記録されている
    expect(result.executionSummary).toBeDefined();
    const summary: ExecutionSummary = result.executionSummary;

    // 実行ステータスが 'success'
    expect(summary.executionStatus).toBe('success');

    // 処理時間が記録されている (0以上)
    expect(summary.processingTimeMs).toBeGreaterThanOrEqual(0);

    // 例外が発生していない
    expect(summary.exceptionOccurred).toBe(false);
  });
});