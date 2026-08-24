import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('TX5 Imp1 Agent - Issue Priority Ordering with Equal Scores', () => {
  // SCEN-1246: [edge] 既存ツール連携機能 - 複数課題が同一の優先度スコアを持つ場合、順序が保持される
  test('should maintain stable ordering when multiple issues have equal priority scores across multiple executions', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        if (text.includes('データベース障害')) {
          return { keywords: ['データベース障害'], frequency: 1 };
        }
        if (text.includes('ネットワーク遅延')) {
          return { keywords: ['ネットワーク遅延'], frequency: 1 };
        }
        if (text.includes('サーバーメモリ不足')) {
          return { keywords: ['サーバーメモリ不足'], frequency: 1 };
        }
        return { keywords: [], frequency: 0 };
      }),
      assessImpactScore: jest.fn(() => 75),
      classifyIssueSeverity: jest.fn(() => 'high'),
    };

    const mockToolIntegrationAdapter = {
      validateConnectivity: jest.fn().mockResolvedValue(true),
      registerIssue: jest.fn().mockResolvedValue({ toolIssueId: 'JIRA-001' }),
      getIssueMapping: jest.fn().mockResolvedValue({}),
    };

    const mockNotificationAdapter = {
      sendConfirmationEmail: jest.fn().mockResolvedValue(true),
      notifyProjectManager: jest.fn().mockResolvedValue(true),
    };

    const extractedIssues: ExtractedIssue[] = [
      {
        issueId: 'ISSUE-A',
        keyword: 'データベース障害',
        description: 'Database failure detected',
        reportedDate: new Date('2024-01-15T09:00:00Z'),
        reportingEngineerId: 'ENG-001',
      },
      {
        issueId: 'ISSUE-B',
        keyword: 'ネットワーク遅延',
        description: 'Network latency issue',
        reportedDate: new Date('2024-01-15T09:05:00Z'),
        reportingEngineerId: 'ENG-002',
      },
      {
        issueId: 'ISSUE-C',
        keyword: 'サーバーメモリ不足',
        description: 'Server memory exhaustion',
        reportedDate: new Date('2024-01-15T09:10:00Z'),
        reportingEngineerId: 'ENG-003',
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/api/v3',
      projectKey: 'PROJ',
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 100,
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highPriorityThreshold: 70,
      mediumPriorityThreshold: 40,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'infrastructure',
        toolCategory: 'Infrastructure',
      },
      { systemCategory: 'performance', toolCategory: 'Performance' },
      { systemCategory: 'application', toolCategory: 'Application' },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData: extractedIssues,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    const executionResults: Tx5Imp1AgentOutput[] = [];

    for (let executionIndex = 0; executionIndex < 3; executionIndex++) {
      const result = await runTx5Imp1Agent(input, {
        textAnalysisAdapter: mockTextAnalysisAdapter,
        toolIntegrationAdapter: mockToolIntegrationAdapter,
        notificationAdapter: mockNotificationAdapter,
      });

      executionResults.push(result);
    }

    const firstExecutionOrder = executionResults[0].validatedIssues.map(
      (issue) => issue.issueId
    );
    const secondExecutionOrder = executionResults[1].validatedIssues.map(
      (issue) => issue.issueId
    );
    const thirdExecutionOrder = executionResults[2].validatedIssues.map(
      (issue) => issue.issueId
    );

    expect(firstExecutionOrder).toEqual([
      'ISSUE-A',
      'ISSUE-B',
      'ISSUE-C',
    ]);
    expect(secondExecutionOrder).toEqual([
      'ISSUE-A',
      'ISSUE-B',
      'ISSUE-C',
    ]);
    expect(thirdExecutionOrder).toEqual([
      'ISSUE-A',
      'ISSUE-B',
      'ISSUE-C',
    ]);

    expect(firstExecutionOrder).toEqual(secondExecutionOrder);
    expect(secondExecutionOrder).toEqual(thirdExecutionOrder);

    for (const result of executionResults) {
      expect(result.validatedIssues.length).toBe(3);

      for (const validatedIssue of result.validatedIssues) {
        expect(validatedIssue.priorityScore).toBe(75);
        expect(validatedIssue.priorityRank).toBe('high');
        expect(validatedIssue.validationStatus).toBe('valid');
      }
    }

    expect(executionResults[0].integrationResult.successCount).toBe(3);
    expect(executionResults[0].integrationResult.failureCount).toBe(0);
    expect(executionResults[0].executionSummary.finalStatus).toBe('completed');
  });
});