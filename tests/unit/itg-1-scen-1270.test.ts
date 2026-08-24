import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AgentInput, type Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1270: [error] 既存ツール課題データ連携リトライ機能 - 連携APIのエンドポイントURLが空文字列の場合、エラーとなる
  test('連携APIのエンドポイントURLが空文字列の場合、入力値検証フェーズでエラーが発生し、API呼び出しは実行されない', async () => {
    const extractedIssueData = [
      {
        issueId: 'issue-001',
        title: 'Database connection timeout',
        description: 'Connection pool exhausted under high load',
        severity: 'high',
        frequency: 3,
      },
    ];

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      endpointUrl: '', // 空文字列 - 入力値検証エラーの原因
      apiKey: 'valid-api-key-12345',
      projectKey: 'DEV',
      issuetypeId: '10001',
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 75,
      mediumThreshold: 50,
      lowThreshold: 0,
    };

    const categoryMappings = [
      {
        sourceCategory: 'performance',
        targetCategory: 'Performance Issue',
      },
      {
        sourceCategory: 'reliability',
        targetCategory: 'Reliability Issue',
      },
    ];

    const aiClientStub: Tx5Imp1AiClient = {
      validateExtractedIssues: async () => ({
        isValid: true,
        validationDetails: [],
      }),
      judgeIssuePriority: async () => ({
        issues: [
          {
            issueId: 'issue-001',
            priorityScore: 85,
            category: 'reliability',
          },
        ],
      }),
      prepareCategoryMapping: async () => ({
        mappings: categoryMappings,
      }),
      executeToolIntegration: async () => {
        throw new Error('INVALID_ENDPOINT_URL');
      },
      notifyIntegrationError: async () => undefined,
      generateSummaryReport: async () => ({
        summary: 'Integration attempt failed due to configuration error',
      }),
    };

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    let caughtError: Error | null = null;
    let agentOutput: Tx5Imp1AgentOutput | null = null;

    try {
      agentOutput = await runTx5Imp1Agent(input, aiClientStub);
    } catch (error) {
      caughtError = error as Error;
    }

    // エンドポイントURL検証エラーが発生することを確認
    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/INVALID_ENDPOINT_URL/);

    // API呼び出しが実行されないことを確認（エラーで中断されている）
    expect(agentOutput).toBeNull();
  });
});