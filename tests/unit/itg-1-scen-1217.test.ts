import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient, type Tx5Imp1AgentInput, type Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('Tx5Imp1Agent - 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1217: [error] 既存ツール連携機能 - 連携先ツールタイプ（Jira/Asana）が null のとき処理が中断される
  test('連携先ツール型が null のとき、既存ツール連携処理は中断され、エラーコードとメッセージを返す', async () => {
    const extractedIssueData = [
      {
        issueId: 'issue-001',
        title: 'Database connection timeout',
        description: 'Connection times out after 30 seconds',
        frequency: 5,
        severity: 'high',
      },
      {
        issueId: 'issue-002',
        title: 'Memory leak in background worker',
        description: 'Memory usage increases continuously',
        frequency: 3,
        severity: 'medium',
      },
    ];

    const toolIntegrationConfig = {
      toolType: null as any,
      apiEndpoint: 'https://api.jira.example.com',
      apiToken: 'test-token-12345',
      projectKey: 'PROJ',
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highImpactThreshold: 70,
      mediumImpactThreshold: 40,
    };

    const categoryMappings = [
      {
        systemCategory: 'database',
        toolCategory: 'Infrastructure',
      },
      {
        systemCategory: 'memory',
        toolCategory: 'Performance',
      },
    ];

    const mockAiClient: Tx5Imp1AiClient = {
      validateIssues: jest.fn(),
      classifyIssueCategory: jest.fn(),
      assessIntegrationReadiness: jest.fn(),
    };

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.integrationResult.status).toBe('failed');
    expect(result.integrationResult.errorCode).toBe('INTEGRATION_CONFIG_ERROR');
    expect(result.integrationResult.errorMessage).toBe('ツール連携タイプが設定されていません');
    expect(result.integrationResult.toolType).toBeNull();
    expect(result.integrationResult.successCount).toBe(0);
    expect(result.integrationResult.failureCount).toBe(0);
    expect(result.validatedIssues).toEqual([]);
    expect(result.executionSummary.status).toBe('error');
    expect(result.executionSummary.adminLog).toMatch(/連携先ツール設定エラー/);
    expect(result.executionSummary.adminLog).toMatch(/toolType=null/);
    expect(result.executionSummary.adminLog).toMatch(/処理中断/);

    expect(mockAiClient.validateIssues).not.toHaveBeenCalled();
    expect(mockAiClient.classifyIssueCategory).not.toHaveBeenCalled();
    expect(mockAiClient.assessIntegrationReadiness).not.toHaveBeenCalled();
  });
});