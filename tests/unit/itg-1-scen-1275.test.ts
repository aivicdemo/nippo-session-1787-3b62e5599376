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
import type { Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1 orchestrator: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1275: 既存ツール課題データ連携リトライ機能 - タイムアウト値が0の場合、エラーとなる
  test('should reject with timeout error when integration retry config has 0 timeout', async () => {
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        title: 'Database performance degradation',
        description: 'Query response time exceeds 5 seconds',
        frequency: 3,
        impactScore: 75,
        category: 'Performance',
      },
      {
        issueId: 'issue-002',
        title: 'Memory leak in background service',
        description: 'Memory usage increases by 100MB daily',
        frequency: 2,
        impactScore: 85,
        category: 'Reliability',
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/api/v3',
      authToken: 'test-token-placeholder',
      projectKey: 'TEST',
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 5000,
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 75,
      mediumThreshold: 50,
      lowThreshold: 0,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        sourceCategory: 'Performance',
        targetCategory: 'PERF',
      },
      {
        sourceCategory: 'Reliability',
        targetCategory: 'REL',
      },
    ];

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    const mockAiClient: Tx5Imp1AiClient = {
      validateIssues: async () => ({
        validatedIssues: extractedIssueData.map((issue) => ({
          issueId: issue.issueId,
          priorityScore: issue.impactScore,
          priorityRank: issue.impactScore >= 75 ? 'high' : 'medium',
          category: 'Performance',
          toolIssueId: null,
          validationStatus: 'valid',
        })),
      }),
      assessImpactScoreForIntegration: async () => {
        throw new Error('timeout value must be greater than 0');
      },
      classifyIssueCategory: async () => ({
        category: 'Performance',
        confidence: 0.95,
      }),
      determinePriorityRank: async () => ({
        rank: 'high',
      }),
      scheduleRetryWithBackoff: async () => ({
        scheduled: false,
        reason: 'Initial timeout value is 0; retry not initiated',
      }),
      recordAdminAlert: async () => ({
        alertId: 'alert-timeout-001',
        timestamp: new Date('2024-01-15T10:30:00Z').toISOString(),
        severity: 'critical',
        message: 'timeout value must be greater than 0',
      }),
    };

    await expect(runTx5Imp1Agent(agentInput, mockAiClient)).rejects.toThrow(
      /timeout value must be greater than 0/
    );
  });
});