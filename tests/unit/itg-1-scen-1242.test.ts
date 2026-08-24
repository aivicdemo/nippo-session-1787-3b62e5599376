import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type ExtractedIssue } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type ToolIntegrationConfig } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type PriorityRuleSet } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type CategoryMapping } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('Tx5Imp1Agent - Issue Priority and Tool Integration', () => {
  // SCEN-1242: [edge] 既存ツール連携機能 - 優先度スコアが最大値（100）の課題は正しい優先順で連携される
  test('should correctly prioritize and integrate issues with maximum priority score (100) at the top of linked results', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (text: string) => ({
        keywords: text.split(' ').slice(0, 3),
        frequency: [5, 3, 2],
      })),
      assessImpactScore: jest.fn(async (keyword: string): Promise<number> => {
        const scoreMap: Record<string, number> = {
          'critical_db_failure': 100,
          'api_timeout': 100,
          'memory_leak': 75,
          'ui_glitch': 50,
          'documentation_typo': 30,
        };
        return scoreMap[keyword] ?? 50;
      }),
      classifyIssueSeverity: jest.fn(async (text: string) => {
        if (text.includes('critical') || text.includes('fail')) return 'high';
        if (text.includes('memory') || text.includes('timeout')) return 'medium';
        return 'low';
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async () => ({ success: true, deliveryStatus: 'sent' })),
      scheduleNotification: jest.fn(async () => ({ scheduled: true })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'delivered' })),
    };

    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'ISSUE-001',
        title: 'Database Connection Pool Exhaustion',
        description: 'critical_db_failure in production affecting all API calls',
        keyword: 'critical_db_failure',
        frequency: 8,
        teamImpactScope: 'entire_team',
        reportedAt: new Date('2024-01-15T10:00:00Z'),
        reporterId: 'user-001',
      },
      {
        issueId: 'ISSUE-002',
        title: 'API Response Timeout',
        description: 'api_timeout occurring sporadically in staging environment',
        keyword: 'api_timeout',
        frequency: 5,
        teamImpactScope: 'backend_team',
        reportedAt: new Date('2024-01-15T10:05:00Z'),
        reporterId: 'user-002',
      },
      {
        issueId: 'ISSUE-003',
        title: 'Memory Leak in Worker Process',
        description: 'memory_leak detected after 24 hours of operation',
        keyword: 'memory_leak',
        frequency: 3,
        teamImpactScope: 'backend_team',
        reportedAt: new Date('2024-01-15T10:10:00Z'),
        reporterId: 'user-003',
      },
      {
        issueId: 'ISSUE-004',
        title: 'UI Rendering Glitch',
        description: 'ui_glitch on dashboard in specific browsers',
        keyword: 'ui_glitch',
        frequency: 2,
        teamImpactScope: 'frontend_team',
        reportedAt: new Date('2024-01-15T10:15:00Z'),
        reporterId: 'user-004',
      },
      {
        issueId: 'ISSUE-005',
        title: 'Documentation Typo',
        description: 'documentation_typo in API reference guide',
        keyword: 'documentation_typo',
        frequency: 1,
        teamImpactScope: 'documentation_team',
        reportedAt: new Date('2024-01-15T10:20:00Z'),
        reporterId: 'user-005',
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/rest/api/3',
      projectKey: 'TEAM',
      authToken: 'test-token-placeholder',
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000,
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactScopeWeight: 0.6,
      impactThresholds: {
        high: { minScore: 80 },
        medium: { minScore: 50, maxScore: 79 },
        low: { maxScore: 49 },
      },
    };

    const categoryMappings: CategoryMapping[] = [
      { systemCategory: 'database', jiraLabel: 'infrastructure' },
      { systemCategory: 'api', jiraLabel: 'backend' },
      { systemCategory: 'memory', jiraLabel: 'performance' },
      { systemCategory: 'ui', jiraLabel: 'frontend' },
      { systemCategory: 'documentation', jiraLabel: 'documentation' },
    ];

    const mockAiClient: Tx5Imp1AiClient = {
      textAnalysisAdapter: mockTextAnalysisAdapter,
      notificationAdapter: mockNotificationAdapter,
    };

    const input = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.validatedIssues).toBeDefined();
    expect(Array.isArray(result.validatedIssues)).toBe(true);
    expect(result.validatedIssues.length).toBe(5);

    const maxScoreIssues = result.validatedIssues.filter(
      (issue) => issue.priorityScore === 100
    );
    expect(maxScoreIssues.length).toBe(2);
    expect(maxScoreIssues[0].issueId).toBe('ISSUE-001');
    expect(maxScoreIssues[1].issueId).toBe('ISSUE-002');

    const firstMaxScoreIndex = result.validatedIssues.findIndex(
      (issue) => issue.priorityScore === 100
    );
    const firstNonMaxScoreIndex = result.validatedIssues.findIndex(
      (issue) => issue.priorityScore < 100
    );

    expect(firstMaxScoreIndex).toBeLessThan(firstNonMaxScoreIndex);

    expect(result.validatedIssues[0].priorityScore).toBe(100);
    expect(result.validatedIssues[0].priorityRank).toBe('high');
    expect(result.validatedIssues[0].validationStatus).toBe('valid');

    expect(result.validatedIssues[1].priorityScore).toBe(100);
    expect(result.validatedIssues[1].priorityRank).toBe('high');

    expect(result.validatedIssues[2].priorityScore).toBe(75);
    expect(result.validatedIssues[2].priorityRank).toBe('medium');

    expect(result.validatedIssues[3].priorityScore).toBe(50);
    expect(result.validatedIssues[3].priorityRank).toBe('medium');

    expect(result.validatedIssues[4].priorityScore).toBe(30);
    expect(result.validatedIssues[4].priorityRank).toBe('low');

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith('critical_db_failure');
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith('api_timeout');
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith('memory_leak');

    const allAssessmentCalls = (mockTextAnalysisAdapter.assessImpactScore as jest.Mock).mock.results;
    const score100Results = allAssessmentCalls.filter((call) => call.value === 100);
    expect(score100Results.length).toBeGreaterThanOrEqual(2);

    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.successCount).toBeGreaterThanOrEqual(2);

    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.finalStatus).toBe('success');
    expect(result.executionSummary.processedCount).toBe(5);
  });
});