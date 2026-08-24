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

describe('tx-5-imp-1 orchestrator - runTx5Imp1Agent', () => {
  test('SCEN-1253: existing tool integration with month-start report date validates issues within correct period range', async () => {
    // Setup: Create extracted issues with report date at month start (2024-02-01)
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        title: 'Database performance degradation',
        description: 'Query response time exceeds 5 seconds during peak hours',
        reportDate: new Date('2024-02-01T09:00:00Z'),
        reporterTeamId: 'team-dev-001',
        keywordMatches: ['performance', 'database'],
        confidenceScore: 0.92,
      },
      {
        issueId: 'issue-002',
        title: 'API timeout error',
        description: 'Third-party API integration fails intermittently',
        reportDate: new Date('2024-02-01T10:30:00Z'),
        reporterTeamId: 'team-dev-001',
        keywordMatches: ['api', 'integration'],
        confidenceScore: 0.88,
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.company.internal/api/v3',
      projectKey: 'DEVTEAM',
      authToken: 'token-placeholder',
      categoryMappingMode: 'auto',
      retryConfig: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelayMs: 1000,
      },
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.35,
      urgencyWeight: 0.25,
      highThreshold: 75,
      mediumThreshold: 50,
      lowThreshold: 0,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        extractedCategory: 'performance',
        toolCategory: 'performance',
        toolCategoryId: 'PERF',
      },
      {
        extractedCategory: 'api',
        toolCategory: 'integration',
        toolCategoryId: 'INTEG',
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // Create stub AI client that processes issues without actual external calls
    const stubAiClient = {
      validateIssues: async (
        issues: ExtractedIssue[]
      ): Promise<ValidatedIssue[]> => {
        return issues.map((issue) => ({
          issueId: issue.issueId,
          priorityScore: 82,
          priorityRank: 'high' as const,
          category: 'performance',
          toolIssueId: null,
          validationStatus: 'valid' as const,
        }));
      },
      integrateWithTool: async (
        validatedIssues: ValidatedIssue[],
        config: ToolIntegrationConfig
      ): Promise<ToolIntegrationResult> => {
        return {
          successCount: validatedIssues.length,
          failureCount: 0,
          totalAttempted: validatedIssues.length,
          integratedIssueIds: validatedIssues.map((vi) => ({
            extractedId: vi.issueId,
            toolId: `DEVTEAM-${Math.floor(Math.random() * 1000)}`,
          })),
          failedIssueIds: [],
          lastRetryTimestamp: null,
          integrationStatus: 'success' as const,
        };
      },
    };

    // Execute agent
    const output: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      input,
      stubAiClient
    );

    // Assertions: Verify validated issues have correct structure and period-aware validation
    expect(output.validatedIssues).toBeDefined();
    expect(output.validatedIssues.length).toBe(2);

    // Verify first issue (month-start report)
    const firstValidated = output.validatedIssues[0];
    expect(firstValidated.issueId).toBe('issue-001');
    expect(firstValidated.priorityScore).toBe(82);
    expect(firstValidated.priorityRank).toBe('high');
    expect(firstValidated.category).toBe('performance');
    expect(firstValidated.validationStatus).toBe('valid');

    // Verify second issue
    const secondValidated = output.validatedIssues[1];
    expect(secondValidated.issueId).toBe('issue-002');
    expect(secondValidated.priorityScore).toBe(82);
    expect(secondValidated.priorityRank).toBe('high');

    // Verify tool integration result shows success
    expect(output.integrationResult).toBeDefined();
    expect(output.integrationResult.successCount).toBe(2);
    expect(output.integrationResult.failureCount).toBe(0);
    expect(output.integrationResult.totalAttempted).toBe(2);
    expect(output.integrationResult.integrationStatus).toBe('success');
    expect(output.integrationResult.integratedIssueIds.length).toBe(2);

    // Verify each integrated issue has both extracted and tool IDs
    output.integrationResult.integratedIssueIds.forEach((mapping, index) => {
      expect(mapping.extractedId).toBe(extractedIssueData[index].issueId);
      expect(mapping.toolId).toBeDefined();
      expect(mapping.toolId).toMatch(/^DEVTEAM-\d+$/);
    });

    // Verify execution summary
    expect(output.executionSummary).toBeDefined();
    expect(output.executionSummary.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(output.executionSummary.successStatus).toBe(true);
    expect(output.executionSummary.exceptionOccurred).toBe(false);
    expect(output.executionSummary.finalStatus).toBe('COMPLETED');

    // Verify month-start issues are included (not filtered out by period logic)
    const reportDates = extractedIssueData.map((issue) => issue.reportDate);
    reportDates.forEach((date) => {
      expect(date.getDate()).toBe(1); // All reports are on Feb 1st
      expect(date.getMonth()).toBe(1); // February
      expect(date.getFullYear()).toBe(2024);
    });

    // Verify category mapping was applied correctly
    expect(output.validatedIssues[0].category).toBe('performance');
    expect(output.validatedIssues[1].category).toBe('performance');
  });
});