import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ValidatedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
  ToolIntegrationResult,
  ExecutionSummary,
} from '../../src/agents/tx-5-imp-1/types';

describe('tx-5-imp-1: 既存ツール連携機能 - 大規模課題データ（数千件）の完全連携処理', () => {
  let mockTextAnalysisAdapter: any;
  let mockNotificationAdapter: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: '品質課題', frequency: 450, confidence: 0.92 },
          { keyword: 'パフォーマンス', frequency: 320, confidence: 0.88 },
          { keyword: 'セキュリティ', frequency: 280, confidence: 0.91 },
          { keyword: 'ドキュメント', frequency: 200, confidence: 0.85 },
          { keyword: 'テスト漏れ', frequency: 180, confidence: 0.87 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
        affectedTeams: 3,
        businessImpact: 'high',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        classification: 'critical',
      }),
    };

    mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-tx5-' + Math.random().toString(36).substring(7),
        status: 'delivered',
        timestamp: '2024-01-15T11:00:00Z',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched-tx5-' + Math.random().toString(36).substring(7),
        status: 'scheduled',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: 1,
        failed: 0,
        pending: 0,
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1255
  test('should process and validate 3000 extracted issues without duplication or loss', async () => {
    const extracted_issue_count = 3000;
    const batch_size = 500;
    const batches_needed = Math.ceil(extracted_issue_count / batch_size);

    const generated_extracted_issues: ExtractedIssue[] = Array.from(
      { length: extracted_issue_count },
      (_, idx) => ({
        issueId: `issue-${String(idx + 1).padStart(5, '0')}`,
        title: `Issue Title ${idx + 1}`,
        description: `Issue Description ${idx + 1}: sample issue text with keywords`,
        createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
        status: 'open',
        impactScore: 50 + (idx % 50),
        frequency: 1 + (idx % 10),
      })
    );

    const tool_integration_config: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/api/v3',
      projectKey: 'PROJ',
      authToken: 'token-placeholder',
    };

    const priority_rule_set: PriorityRuleSet = {
      frequencyWeight: 0.3,
      impactWeight: 0.5,
      recencyWeight: 0.2,
      highThreshold: 80,
      mediumThreshold: 50,
      lowThreshold: 0,
    };

    const category_mappings: CategoryMapping[] = [
      {
        systemCategory: '品質',
        toolCategory: 'Quality',
        severity: 'high',
      },
      {
        systemCategory: 'パフォーマンス',
        toolCategory: 'Performance',
        severity: 'medium',
      },
      {
        systemCategory: 'セキュリティ',
        toolCategory: 'Security',
        severity: 'critical',
      },
      {
        systemCategory: 'ドキュメント',
        toolCategory: 'Documentation',
        severity: 'low',
      },
      {
        systemCategory: 'テスト',
        toolCategory: 'Testing',
        severity: 'medium',
      },
    ];

    const agent_input: Tx5Imp1AgentInput = {
      extractedIssueData: generated_extracted_issues,
      toolIntegrationConfig: tool_integration_config,
      priorityRules: priority_rule_set,
      categoryMappings: category_mappings,
    };

    const agent_output: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      agent_input,
      mockTextAnalysisAdapter,
      mockNotificationAdapter
    );

    expect(agent_output).toBeDefined();
    expect(agent_output.validatedIssues).toBeDefined();
    expect(Array.isArray(agent_output.validatedIssues)).toBe(true);

    const validated_issues_count = agent_output.validatedIssues.length;
    expect(validated_issues_count).toBe(extracted_issue_count);

    const validated_issue_ids = new Set(
      agent_output.validatedIssues.map((vi: ValidatedIssue) => vi.issueId)
    );
    expect(validated_issue_ids.size).toBe(extracted_issue_count);

    const all_validation_statuses = agent_output.validatedIssues.map(
      (vi: ValidatedIssue) => vi.validationStatus
    );
    expect(
      all_validation_statuses.every(
        (status: string) =>
          status === 'valid' || status === 'warning' || status === 'invalid'
      )
    ).toBe(true);

    const priority_ranks_present = agent_output.validatedIssues.map(
      (vi: ValidatedIssue) => vi.priorityRank
    );
    expect(
      priority_ranks_present.every(
        (rank: string) => rank === 'high' || rank === 'medium' || rank === 'low'
      )
    ).toBe(true);

    const priority_scores_in_range = agent_output.validatedIssues.map(
      (vi: ValidatedIssue) => vi.priorityScore
    );
    expect(priority_scores_in_range.every((score: number) => score >= 0 && score <= 100)).toBe(
      true
    );

    const categories_mapped = agent_output.validatedIssues.map(
      (vi: ValidatedIssue) => vi.category
    );
    const expected_categories = category_mappings.map((cm) => cm.toolCategory);
    expect(
      categories_mapped.every((cat: string) => expected_categories.includes(cat) || cat === '')
    ).toBe(true);

    expect(agent_output.integrationResult).toBeDefined();
    expect(agent_output.integrationResult.successCount).toBeGreaterThanOrEqual(0);
    expect(agent_output.integrationResult.failureCount).toBeGreaterThanOrEqual(0);

    const total_processed = agent_output.integrationResult.successCount + agent_output.integrationResult.failureCount;
    expect(total_processed).toBeGreaterThanOrEqual(extracted_issue_count * 0.95);

    expect(agent_output.executionSummary).toBeDefined();
    expect(agent_output.executionSummary.status).toBe('completed');
    expect(agent_output.executionSummary.processingTimeMs).toBeGreaterThan(0);
    expect(agent_output.executionSummary.totalProcessed).toBe(extracted_issue_count);
    expect(agent_output.executionSummary.skippedCount).toBeLessThanOrEqual(0);
    expect(agent_output.executionSummary.errorCount).toBe(0);

    const high_priority_count = agent_output.validatedIssues.filter(
      (vi: ValidatedIssue) => vi.priorityRank === 'high'
    ).length;
    const medium_priority_count = agent_output.validatedIssues.filter(
      (vi: ValidatedIssue) => vi.priorityRank === 'medium'
    ).length;
    const low_priority_count = agent_output.validatedIssues.filter(
      (vi: ValidatedIssue) => vi.priorityRank === 'low'
    ).length;

    const priority_distribution_is_valid =
      high_priority_count + medium_priority_count + low_priority_count === extracted_issue_count;
    expect(priority_distribution_is_valid).toBe(true);

    const has_unique_issue_ids = validated_issue_ids.size === extracted_issue_count;
    expect(has_unique_issue_ids).toBe(true);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalled();

    expect(agent_output.validatedIssues.length).toBe(3000);
  });
});