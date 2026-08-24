import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type ExtractedIssue, type ToolIntegrationConfig, type PriorityRuleSet, type CategoryMapping } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('TX5 Imp1 Agent - Issue Priority Reordering', () => {
  // SCEN-1251
  test('should reorder extracted issues from reverse priority order to canonical priority order when integrating with existing tools', async () => {
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue_001',
        keywordText: 'チームコミュニケーション不足',
        occurrenceCount: 2,
        impactScore: 35,
        extractedAt: new Date('2026-01-20T09:00:00Z'),
      },
      {
        issueId: 'issue_002',
        keywordText: 'ドキュメント作成遅延',
        occurrenceCount: 5,
        impactScore: 65,
        extractedAt: new Date('2026-01-20T09:00:00Z'),
      },
      {
        issueId: 'issue_003',
        keywordText: 'サーバ障害対応',
        occurrenceCount: 8,
        impactScore: 92,
        extractedAt: new Date('2026-01-20T09:00:00Z'),
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      projectKey: 'TEST-PROJ',
      apiEndpoint: 'https://jira.example.com/rest/api/3',
      authToken: 'mock-auth-token',
    };

    const priorityRules: PriorityRuleSet = {
      highThreshold: 70,
      mediumThreshold: 40,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'infrastructure',
        toolCategory: 'Infrastructure',
        keyword: 'サーバ',
      },
      {
        systemCategory: 'documentation',
        toolCategory: 'Documentation',
        keyword: 'ドキュメント',
      },
      {
        systemCategory: 'communication',
        toolCategory: 'Team Process',
        keyword: 'コミュニケーション',
      },
    ];

    const mockAiClient: Tx5Imp1AiClient = {
      validateAndClassifyIssues: jest.fn().mockResolvedValue({
        validatedIssues: [
          {
            issueId: 'issue_003',
            priorityScore: 92,
            priorityRank: 'high',
            category: 'infrastructure',
            toolIssueId: null,
            validationStatus: 'valid',
          },
          {
            issueId: 'issue_002',
            priorityScore: 65,
            priorityRank: 'medium',
            category: 'documentation',
            toolIssueId: null,
            validationStatus: 'valid',
          },
          {
            issueId: 'issue_001',
            priorityScore: 35,
            priorityRank: 'low',
            category: 'communication',
            toolIssueId: null,
            validationStatus: 'valid',
          },
        ],
        confidence: 0.92,
      }),
      determineToolMapping: jest.fn().mockResolvedValue({
        mappings: [
          { systemCategory: 'infrastructure', toolCategoryId: 'CAT-001' },
          { systemCategory: 'documentation', toolCategoryId: 'CAT-002' },
          { systemCategory: 'communication', toolCategoryId: 'CAT-003' },
        ],
      }),
      generateIntegrationPayload: jest.fn().mockResolvedValue({
        issues: [
          {
            externalId: 'issue_003_mapped',
            title: 'サーバ障害対応',
            priority: 'highest',
            category: 'Infrastructure',
            description: 'チーム全体に影響する重大インシデント',
          },
          {
            externalId: 'issue_002_mapped',
            title: 'ドキュメント作成遅延',
            priority: 'medium',
            category: 'Documentation',
            description: 'プロジェクト進捗に中程度の影響',
          },
          {
            externalId: 'issue_001_mapped',
            title: 'チームコミュニケーション不足',
            priority: 'low',
            category: 'Team Process',
            description: '内部コミュニケーションの課題',
          },
        ],
      }),
      handleIntegrationError: jest.fn().mockResolvedValue({
        retryCount: 0,
        nextRetryAt: null,
        status: 'ready_for_integration',
      }),
    };

    const result = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      mockAiClient
    );

    expect(result.validatedIssues).toHaveLength(3);
    expect(result.validatedIssues[0].issueId).toBe('issue_003');
    expect(result.validatedIssues[0].priorityScore).toBe(92);
    expect(result.validatedIssues[0].priorityRank).toBe('high');

    expect(result.validatedIssues[1].issueId).toBe('issue_002');
    expect(result.validatedIssues[1].priorityScore).toBe(65);
    expect(result.validatedIssues[1].priorityRank).toBe('medium');

    expect(result.validatedIssues[2].issueId).toBe('issue_001');
    expect(result.validatedIssues[2].priorityScore).toBe(35);
    expect(result.validatedIssues[2].priorityRank).toBe('low');

    expect(result.integrationResult.successCount).toBeGreaterThanOrEqual(3);
    expect(result.integrationResult.failureCount).toBe(0);

    expect(result.executionSummary.status).toBe('completed');
    expect(result.executionSummary.finalizedAt).toBeDefined();

    expect(mockAiClient.validateAndClassifyIssues).toHaveBeenCalledWith(
      extractedIssueData,
      priorityRules
    );

    expect(mockAiClient.determineToolMapping).toHaveBeenCalledWith(
      result.validatedIssues,
      categoryMappings
    );

    const integrationPayload = await mockAiClient.generateIntegrationPayload(
      result.validatedIssues
    );
    expect(integrationPayload.issues[0].priority).toBe('highest');
    expect(integrationPayload.issues[1].priority).toBe('medium');
    expect(integrationPayload.issues[2].priority).toBe('low');
  });
});