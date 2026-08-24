import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type ExtractedIssue, type ToolIntegrationConfig, type PriorityRuleSet, type CategoryMapping } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 優先度スコアが最小値（0）の課題は正しい優先順で連携される', () => {
  // SCEN-1243
  test('should handle zero-priority-score issues with consistent secondary sort order', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['test_keyword'],
        frequency: 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(0),
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        deliveredAt: new Date('2024-01-15T09:00:00Z').toISOString(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'sched_001',
        scheduledAt: new Date('2024-01-15T08:00:00Z').toISOString(),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sent: 1,
        failed: 0,
        pending: 0,
      }),
    };

    const extractedIssuesWithZeroPriority: ExtractedIssue[] = [
      {
        issueId: 'issue_001',
        title: 'Issue A',
        description: 'Test issue A',
        keywordMatches: ['test_keyword'],
        confidenceScore: 0.85,
        createdAt: new Date('2024-01-15T07:00:00Z').toISOString(),
      },
      {
        issueId: 'issue_002',
        title: 'Issue B',
        description: 'Test issue B',
        keywordMatches: ['test_keyword'],
        confidenceScore: 0.85,
        createdAt: new Date('2024-01-15T07:15:00Z').toISOString(),
      },
      {
        issueId: 'issue_003',
        title: 'Issue C',
        description: 'Test issue C',
        keywordMatches: ['test_keyword'],
        confidenceScore: 0.85,
        createdAt: new Date('2024-01-15T07:30:00Z').toISOString(),
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/api/v3',
      projectKey: 'PROJ',
      authentication: {
        type: 'bearer',
        token: 'mock_token',
      },
    };

    const priorityRules: PriorityRuleSet = {
      highThreshold: 80,
      mediumThreshold: 50,
      lowThreshold: 0,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'bug',
        toolCategory: 'Bug',
        toolCategoryId: 'bug_id_001',
      },
      {
        systemCategory: 'feature',
        toolCategory: 'Feature',
        toolCategoryId: 'feature_id_001',
      },
    ];

    const aiClient: Tx5Imp1AiClient = {
      validateIssues: jest.fn().mockResolvedValue({
        validatedIssues: extractedIssuesWithZeroPriority.map((issue) => ({
          issueId: issue.issueId,
          priorityScore: 0,
          priorityRank: 'low',
          category: 'feature',
          toolIssueId: null,
          validationStatus: 'valid',
        })),
        validationSummary: {
          totalProcessed: 3,
          passed: 3,
          failed: 0,
        },
      }),
      determineCategoryMapping: jest.fn().mockResolvedValue({
        mappings: [
          { issueId: 'issue_001', category: 'feature', toolCategoryId: 'feature_id_001' },
          { issueId: 'issue_002', category: 'feature', toolCategoryId: 'feature_id_001' },
          { issueId: 'issue_003', category: 'feature', toolCategoryId: 'feature_id_001' },
        ],
      }),
      executeToolIntegration: jest.fn().mockResolvedValue({
        integrationResult: {
          successCount: 3,
          failureCount: 0,
          toolIssueIds: {
            issue_001: 'PROJ-1001',
            issue_002: 'PROJ-1002',
            issue_003: 'PROJ-1003',
          },
        },
        retryInfo: {
          retriedCount: 0,
          maxRetries: 3,
        },
      }),
    };

    const input = {
      extractedIssueData: extractedIssuesWithZeroPriority,
      toolIntegrationConfig: toolIntegrationConfig,
      priorityRules: priorityRules,
      categoryMappings: categoryMappings,
    };

    const result = await runTx5Imp1Agent(input, aiClient);

    // 検証1: 3件すべてのissueが検証結果に含まれること
    expect(result.validatedIssues.length).toBe(3);

    // 検証2: すべての課題の優先度スコアが0であること
    result.validatedIssues.forEach((issue) => {
      expect(issue.priorityScore).toBe(0);
    });

    // 検証3: すべての課題の優先度ランクが'low'であること
    result.validatedIssues.forEach((issue) => {
      expect(issue.priorityRank).toBe('low');
    });

    // 検証4: 課題の順序が作成日時（createdAt）昇順に一貫しているか確認
    const sortedByCreatedTime = result.validatedIssues.map((issue) => issue.issueId);
    expect(sortedByCreatedTime).toEqual(['issue_001', 'issue_002', 'issue_003']);

    // 検証5: 既存ツール連携が正常に完了したこと
    expect(result.integrationResult.integrationStatus).toBe('success');
    expect(result.integrationResult.toolIssueIds?.issue_001).toBe('PROJ-1001');
    expect(result.integrationResult.toolIssueIds?.issue_002).toBe('PROJ-1002');
    expect(result.integrationResult.toolIssueIds?.issue_003).toBe('PROJ-1003');

    // 検証6: executionSummaryが正常に記録されていること
    expect(result.executionSummary.status).toBe('success');
    expect(result.executionSummary.totalProcessed).toBe(3);
    expect(result.executionSummary.successCount).toBe(3);
    expect(result.executionSummary.failureCount).toBe(0);

    // 検証7: 整合性確認 - validatedIssuesの長さが integrationResultの成功件数と一致
    expect(result.validatedIssues.length).toBe(
      result.integrationResult.successCount
    );

    // 検証8: AIクライアントの呼び出し確認
    expect(aiClient.validateIssues).toHaveBeenCalledWith(
      expect.objectContaining({
        extractedIssueData: extractedIssuesWithZeroPriority,
        priorityRules: priorityRules,
      })
    );
    expect(aiClient.executeToolIntegration).toHaveBeenCalled();

    // 検証9: すべての課題がvalid statusを持つこと
    result.validatedIssues.forEach((issue) => {
      expect(issue.validationStatus).toBe('valid');
    });

    // 検証10: 副次的なソート基準が一貫性を持つこと（issueIdでも確認）
    const issueIdOrder = result.validatedIssues.map((issue) => issue.issueId);
    const expectedOrder = ['issue_001', 'issue_002', 'issue_003'];
    expect(issueIdOrder).toEqual(expectedOrder);
  });
});