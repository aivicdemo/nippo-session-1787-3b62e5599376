import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1 orchestrator - Jira/Asana tool integration', () => {
  // SCEN-1218
  test('should fail when targetToolType is empty string and throw validation error', async () => {
    const mockAiClient: Tx5Imp1AiClient = {
      validateIssues: jest.fn().mockResolvedValue({
        validatedIssues: [
          {
            issueId: 'issue-001',
            priorityScore: 75,
            priorityRank: 'high',
            category: 'performance',
            toolIssueId: null,
            validationStatus: 'valid',
          },
        ],
        executionSummary: {
          processingTimeMs: 150,
          exceptionOccurred: false,
          finalStatus: 'success',
        },
      }),
      integrateWithTool: jest.fn(),
    };

    const input = {
      extractedIssueData: [
        {
          issueId: 'issue-001',
          title: 'Database connection timeout',
          description: 'Connection pool exhausted during peak hours',
          frequencyCount: 5,
          impactScore: 78,
        },
      ],
      toolIntegrationConfig: {
        toolType: '', // Empty string - invalid
        apiEndpoint: 'https://api.jira.com',
        authToken: 'token-xyz',
      },
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        highThreshold: 70,
        mediumThreshold: 40,
      },
      categoryMappings: [
        {
          sourceCategory: 'performance',
          targetCategory: 'Performance',
        },
      ],
    };

    await expect(
      runTx5Imp1Agent(input, mockAiClient)
    ).rejects.toThrow(/連携先ツールタイプ/);
  });
});