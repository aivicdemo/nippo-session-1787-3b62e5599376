import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1273
  test('リトライ回数の上限値が負の数で指定された場合、バリデーションエラーを発生させる', async () => {
    const mockAiClient: Tx5Imp1AiClient = {
      validateIssues: jest.fn().mockResolvedValue({
        passedCount: 5,
        failedCount: 0,
        issues: [
          {
            issueId: 'ISSUE-001',
            content: 'Database connection timeout',
            validationStatus: 'valid',
          },
          {
            issueId: 'ISSUE-002',
            content: 'Memory leak in service',
            validationStatus: 'valid',
          },
          {
            issueId: 'ISSUE-003',
            content: 'API rate limit exceeded',
            validationStatus: 'valid',
          },
          {
            issueId: 'ISSUE-004',
            content: 'Cache invalidation issue',
            validationStatus: 'valid',
          },
          {
            issueId: 'ISSUE-005',
            content: 'Concurrent request handling',
            validationStatus: 'valid',
          },
        ],
      }),
      judgeIssuePriority: jest.fn().mockResolvedValue([
        { issueId: 'ISSUE-001', priorityScore: 85, category: 'infrastructure' },
        { issueId: 'ISSUE-002', priorityScore: 78, category: 'performance' },
        { issueId: 'ISSUE-003', priorityScore: 72, category: 'api' },
        { issueId: 'ISSUE-004', priorityScore: 65, category: 'performance' },
        { issueId: 'ISSUE-005', priorityScore: 60, category: 'concurrency' },
      ]),
      integrateWithExistingTool: jest.fn(),
    };

    const input = {
      extractedIssueData: [
        {
          issueId: 'ISSUE-001',
          title: 'Database connection timeout',
          description: 'Connection pool exhausted during peak hours',
          frequency: 3,
          impactScore: 85,
        },
        {
          issueId: 'ISSUE-002',
          title: 'Memory leak in service',
          description: 'Memory usage grows without recovery',
          frequency: 2,
          impactScore: 78,
        },
        {
          issueId: 'ISSUE-003',
          title: 'API rate limit exceeded',
          description: 'External API rate limit reached',
          frequency: 1,
          impactScore: 72,
        },
        {
          issueId: 'ISSUE-004',
          title: 'Cache invalidation issue',
          description: 'Cache not invalidating properly',
          frequency: 2,
          impactScore: 65,
        },
        {
          issueId: 'ISSUE-005',
          title: 'Concurrent request handling',
          description: 'Race condition in concurrent requests',
          frequency: 1,
          impactScore: 60,
        },
      ],
      toolIntegrationConfig: {
        toolType: 'jira' as const,
        apiEndpoint: 'https://jira.example.com/api',
        projectKey: 'PROJ-001',
        credentials: {
          username: 'bot_user',
          apiToken: 'secret_token',
        },
      },
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
      },
      categoryMappings: [
        { sourceCategory: 'infrastructure', targetCategory: 'Infra' },
        { sourceCategory: 'performance', targetCategory: 'Perf' },
        { sourceCategory: 'api', targetCategory: 'API' },
        { sourceCategory: 'concurrency', targetCategory: 'Conc' },
      ],
      integrationRetryConfig: {
        maxRetries: -1,
        backoffMultiplier: 2,
        initialDelayMs: 1000,
      },
    };

    await expect(runTx5Imp1Agent(input, mockAiClient)).rejects.toThrow(
      /リトライ回数/
    );
  });
});