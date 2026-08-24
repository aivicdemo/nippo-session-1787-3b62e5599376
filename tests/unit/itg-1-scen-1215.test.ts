import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1215: [error] 既存ツール連携機能 - 連携設定のプロジェクトマネージャーID が null のとき処理が中断される
  test('should reject integration config when projectManagerId is null', async () => {
    const stubAiClient: Tx5Imp1AiClient = {
      validateExtractedIssues: jest.fn().mockResolvedValue({
        passedCount: 3,
        failedCount: 0,
        issues: [
          {
            issueId: 'ISSUE-001',
            description: 'Database connection timeout',
            confidenceScore: 0.95,
          },
          {
            issueId: 'ISSUE-002',
            description: 'API response delay',
            confidenceScore: 0.87,
          },
          {
            issueId: 'ISSUE-003',
            description: 'Memory leak in cache',
            confidenceScore: 0.92,
          },
        ],
      }),
      judgePriorityAndCategory: jest.fn().mockResolvedValue([
        {
          issueId: 'ISSUE-001',
          priorityScore: 85,
          category: 'Infrastructure',
        },
        {
          issueId: 'ISSUE-002',
          priorityScore: 72,
          category: 'Performance',
        },
        {
          issueId: 'ISSUE-003',
          priorityScore: 78,
          category: 'Maintenance',
        },
      ]),
      integrateWithExistingTool: jest.fn(),
    };

    const agentInput = {
      extractedIssueData: [
        {
          issueId: 'ISSUE-001',
          keyword: 'Database connection timeout',
          occurrenceCount: 2,
          affectedMembers: ['dev-001', 'dev-002'],
        },
        {
          issueId: 'ISSUE-002',
          keyword: 'API response delay',
          occurrenceCount: 3,
          affectedMembers: ['dev-001', 'dev-003', 'dev-004'],
        },
        {
          issueId: 'ISSUE-003',
          keyword: 'Memory leak in cache',
          occurrenceCount: 1,
          affectedMembers: ['dev-002'],
        },
      ],
      toolIntegrationConfig: {
        targetToolType: 'jira',
        apiToken: 'jira_token_abc123',
        workspaceId: 'workspace_xyz789',
        projectManagerId: null, // null として意図的に設定
      },
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        highThreshold: 75,
        mediumThreshold: 50,
      },
      categoryMappings: [
        {
          systemCategory: 'Infrastructure',
          toolCategory: 'DevOps',
        },
        {
          systemCategory: 'Performance',
          toolCategory: 'Performance',
        },
        {
          systemCategory: 'Maintenance',
          toolCategory: 'Technical Debt',
        },
      ],
    };

    // projectManagerId が null のため処理が失敗する
    await expect(
      runTx5Imp1Agent(agentInput, stubAiClient)
    ).rejects.toThrow(/projectManagerId/);
  });
});