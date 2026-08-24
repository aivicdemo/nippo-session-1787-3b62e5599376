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

describe('tx-5-imp-1: 既存ツール連携エラーハンドリング - APIデータ形式エラー判定', () => {
  // SCEN-1288
  test('APIレスポンスボディが不正なJSON形式を返す場合、failureType=DATA_FORMAT_ERRORと判定し、nextRetryScheduledAtを5分後に設定する', async () => {
    const mockAiClient = {
      validateAndJudgePriority: jest.fn(),
      integrateWithExternalTool: jest.fn(),
      generateExecutionSummary: jest.fn(),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockRejectedValueOnce(
        new Error('Malformed JSON: Unexpected token } in JSON at position 125')
      ),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'ISSUE-001',
        title: 'Database connection timeout',
        description: 'Connection pool exhausted during peak hours',
        extractedAt: new Date('2024-01-15T09:00:00Z'),
        sourceTeamId: 'TEAM-A',
        confidence: 0.92,
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/rest/api/3',
      apiKey: 'masked-api-key',
      projectKey: 'PROJ',
      issueTypeMapping: {
        bug: '10000',
        task: '10001',
      },
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
      lowThreshold: 0,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'performance',
        toolCategory: 'Performance',
        toolCategoryId: 'PERF-001',
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    mockAiClient.validateAndJudgePriority.mockResolvedValueOnce({
      validatedIssues: [
        {
          issueId: 'ISSUE-001',
          priorityScore: 85,
          priorityRank: 'high',
          category: 'Performance',
          toolIssueId: null,
          validationStatus: 'valid',
        } as ValidatedIssue,
      ],
    });

    mockAiClient.integrateWithExternalTool.mockRejectedValueOnce({
      failureType: 'DATA_FORMAT_ERROR',
      failureDetail: 'Malformed JSON: Unexpected token } in JSON at position 125',
      retryCount: 0,
      nextRetryScheduledAt: new Date('2024-01-15T09:05:00Z'),
    });

    mockAiClient.generateExecutionSummary.mockResolvedValueOnce({
      processedAt: new Date('2024-01-15T09:00:30Z'),
      totalDuration: 30000,
      failedDuration: 500,
      exceptionOccurred: true,
      exceptionType: 'DATA_FORMAT_ERROR',
      exceptionDetail: 'Malformed JSON in API response',
      finalStatus: 'partial_failure',
    } as ExecutionSummary);

    const output = (await runTx5Imp1Agent(input, mockAiClient)) as Tx5Imp1AgentOutput;

    expect(output.integrationResult.failureType).toBe('DATA_FORMAT_ERROR');
    expect(output.integrationResult.failureDetail).toMatch(/Malformed JSON/);
    expect(output.integrationResult.retryCount).toBe(0);

    const nextRetryTime = new Date(output.integrationResult.nextRetryScheduledAt as string);
    const expectedRetryTime = new Date('2024-01-15T09:05:00Z');
    expect(nextRetryTime.getTime()).toBe(expectedRetryTime.getTime());

    expect(output.executionSummary.exceptionOccurred).toBe(true);
    expect(output.executionSummary.exceptionType).toBe('DATA_FORMAT_ERROR');
    expect(output.executionSummary.finalStatus).toBe('partial_failure');

    expect(mockAiClient.validateAndJudgePriority).toHaveBeenCalledTimes(1);
    expect(mockAiClient.integrateWithExternalTool).toHaveBeenCalledTimes(1);
    expect(mockAiClient.generateExecutionSummary).toHaveBeenCalledTimes(1);
  });
});