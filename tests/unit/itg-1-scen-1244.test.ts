import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題の影響度判定と優先度スコア付与', () => {
  // SCEN-1244: [edge] 既存ツール連携機能 - 優先度スコアが中央値（50）の課題は正しい優先順で連携される
  test('should correctly order issues with priority scores at boundary value (50) when integrating with external tools', async () => {
    // Setup: Mock TextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['database', 'performance'],
        frequency: { database: 5, performance: 3 },
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        // Issue A: score 50 (boundary)
        if (keyword === 'issue-a-keyword') return Promise.resolve(50);
        // Issue B: score 51 (above boundary)
        if (keyword === 'issue-b-keyword') return Promise.resolve(51);
        // Issue C: score 49 (below boundary)
        if (keyword === 'issue-c-keyword') return Promise.resolve(49);
        return Promise.resolve(0);
      }),
      classifyIssueSeverity: jest
        .fn()
        .mockResolvedValue({ severity: 'medium' }),
    };

    // Setup: Extracted issues with specific keywords for scoring
    const extractedIssues: ExtractedIssue[] = [
      {
        issueId: 'issue-c',
        title: 'Performance Degradation',
        description: 'issue-c-keyword appears in analysis',
        extractedAt: new Date('2024-01-15T09:00:00Z').toISOString(),
        confidenceScore: 0.85,
      },
      {
        issueId: 'issue-a',
        title: 'Database Lock Issue',
        description: 'issue-a-keyword appears in analysis',
        extractedAt: new Date('2024-01-15T09:00:00Z').toISOString(),
        confidenceScore: 0.90,
      },
      {
        issueId: 'issue-b',
        title: 'Critical System Error',
        description: 'issue-b-keyword appears in analysis',
        extractedAt: new Date('2024-01-15T09:00:00Z').toISOString(),
        confidenceScore: 0.92,
      },
    ];

    // Setup: Tool integration config
    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://api.jira.example.com',
      authToken: 'mock-token-xyz',
      projectKey: 'PROJ',
    };

    // Setup: Priority rules
    const priorityRules: PriorityRuleSet = {
      highThreshold: 75,
      mediumThreshold: 50,
      lowThreshold: 0,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    // Setup: Category mappings
    const categoryMappings: CategoryMapping[] = [
      { systemCategory: 'database', toolCategory: 'Backend' },
      { systemCategory: 'performance', toolCategory: 'Performance' },
    ];

    // Setup: Agent input
    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData: extractedIssues,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // Execute: Run agent with mocked AI client
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      agentInput,
      mockTextAnalysisServiceAdapter
    );

    // Verify: Validate returned issues are correctly ordered by priority score
    expect(result.validatedIssues).toBeDefined();
    expect(result.validatedIssues.length).toBe(3);

    // Extract priority scores from validated issues
    const issueScores = result.validatedIssues.map((issue) => ({
      issueId: issue.issueId,
      priorityScore: issue.priorityScore,
      priorityRank: issue.priorityRank,
    }));

    // Verify order: [issue-c(49), issue-a(50), issue-b(51)]
    expect(issueScores[0].issueId).toBe('issue-c');
    expect(issueScores[0].priorityScore).toBe(49);
    expect(issueScores[0].priorityRank).toBe('low');

    expect(issueScores[1].issueId).toBe('issue-a');
    expect(issueScores[1].priorityScore).toBe(50);
    expect(issueScores[1].priorityRank).toBe('medium');

    expect(issueScores[2].issueId).toBe('issue-b');
    expect(issueScores[2].priorityScore).toBe(51);
    expect(issueScores[2].priorityRank).toBe('high');

    // Verify integration result indicates successful processing
    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.successCount).toBeGreaterThan(0);
    expect(result.integrationResult.failureCount).toBe(0);

    // Verify execution summary
    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.status).toBe('success');
    expect(result.executionSummary.totalProcessed).toBe(3);
    expect(result.executionSummary.totalSucceeded).toBe(3);
  });
});