import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type ExtractedIssue, type ToolIntegrationConfig, type PriorityRuleSet, type CategoryMapping } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1 agent: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  test('SCEN-1206: 既存ツール連携機能 - 抽出された課題データ1件が既存ツールに正常に連携される', async () => {
    const extracted_issue_id = 'issue-001';
    const issue_keyword = 'データベース接続タイムアウト';
    const wave_impact_score = 65;
    const severity_level = 'medium';
    const priority_rank = 'medium';
    const priority_score = 65;
    const tool_issue_id_result = 'JIRA-12345';
    const validation_status_expected = 'valid';
    const integration_status_expected = 'success';
    const pass_count_expected = 1;
    const fail_count_expected = 0;

    const extracted_issues: ExtractedIssue[] = [
      {
        issueId: extracted_issue_id,
        keyword: issue_keyword,
        occurrenceCount: 1,
        description: 'Database connection timeout occurred during batch processing',
        reportDate: '2024-01-15T09:30:00Z',
        reporterId: 'engineer-001',
        teamId: 'team-dev-01',
      },
    ];

    const tool_integration_config: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.internal',
      projectKey: 'DEV',
      apiToken: 'mock-api-token',
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000,
    };

    const priority_rules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 80,
      mediumThreshold: 50,
      lowThreshold: 0,
    };

    const category_mappings: CategoryMapping[] = [
      {
        localCategory: 'infrastructure',
        toolCategory: 'Infrastructure',
        toolCategoryId: 'cat-001',
      },
      {
        localCategory: 'database',
        toolCategory: 'Database',
        toolCategoryId: 'cat-002',
      },
    ];

    const mockAiClient: Tx5Imp1AiClient = {
      validateIssues: async () => ({
        passedCount: pass_count_expected,
        failedCount: fail_count_expected,
        issues: [
          {
            issueId: extracted_issue_id,
            validationStatus: validation_status_expected,
            confidence: 0.95,
            detectedProblems: [],
          },
        ],
      }),

      judgePriority: async () => [
        {
          issueId: extracted_issue_id,
          priorityScore: priority_score,
          category: 'database',
        },
      ],

      integrateTool: async () => ({
        successCount: 1,
        failureCount: 0,
        mappings: [
          {
            issueId: extracted_issue_id,
            toolIssueId: tool_issue_id_result,
          },
        ],
      }),

      notifyIntegration: async () => ({
        emailSent: true,
        notificationTime: '2024-01-15T09:35:00Z',
      }),
    };

    const result = await runTx5Imp1Agent(
      {
        extractedIssueData: extracted_issues,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      mockAiClient,
    );

    expect(result.validatedIssues).toHaveLength(1);
    expect(result.validatedIssues[0].issueId).toBe(extracted_issue_id);
    expect(result.validatedIssues[0].validationStatus).toBe(validation_status_expected);
    expect(result.validatedIssues[0].priorityScore).toBe(priority_score);
    expect(result.validatedIssues[0].priorityRank).toBe(priority_rank);
    expect(result.validatedIssues[0].category).toBe('database');
    expect(result.validatedIssues[0].toolIssueId).toBe(tool_issue_id_result);

    expect(result.integrationResult.successCount).toBe(1);
    expect(result.integrationResult.failureCount).toBe(0);
    expect(result.integrationResult.toolMappings).toHaveLength(1);
    expect(result.integrationResult.toolMappings[0].issueId).toBe(extracted_issue_id);
    expect(result.integrationResult.toolMappings[0].toolIssueId).toBe(tool_issue_id_result);

    expect(result.integrationResult.integrationStatus).toBe(integration_status_expected);
    expect(result.integrationResult.notificationSent).toBe(true);

    expect(result.executionSummary.totalIssuesProcessed).toBe(1);
    expect(result.executionSummary.validCount).toBe(pass_count_expected);
    expect(result.executionSummary.invalidCount).toBe(fail_count_expected);
    expect(result.executionSummary.finalStatus).toBe('completed_successfully');
  });
});