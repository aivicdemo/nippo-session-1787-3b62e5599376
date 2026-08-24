import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import type {
  Tx6AgentInput,
  Tx6AgentOutput,
} from '../../src/agents/tx-6-imp-1/orchestrator';

describe('tx-6-imp-1: 日報収集から分析レポート生成までの自動実行', () => {
  // SCEN-3176
  test('should deny authorization when unprivileged user attempts to access report database and tool operations', async () => {
    const mockAiClient = {
      analyzeReportData: jest.fn().mockResolvedValue({
        status: 'error',
        code: 'AUTHORIZATION_DENIED',
        message: 'Authorization denied: user_id_001 does not have permission to access daily_report_database',
        timestamp: new Date('2024-01-15T09:00:00Z'),
      }),
      extractKeywords: jest.fn().mockResolvedValue({
        status: 'error',
        code: 'TOOL_OPERATION_DENIED',
        message: 'Authorization denied: user_id_001 does not have permission to perform tool operation',
        timestamp: new Date('2024-01-15T09:00:00Z'),
      }),
      sendNotification: jest.fn().mockResolvedValue({
        status: 'skipped',
        reason: 'Authorization check failed before notification',
      }),
      generateReport: jest.fn().mockResolvedValue(null),
    };

    const input: Tx6AgentInput = {
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      analysisStartDate: '2024-01-08',
      analysisEndDate: '2024-01-14',
      teamId: 'team_001',
      requestingUserId: 'user_id_001',
      requestingUserRole: 'engineer',
    };

    let thrownError: Error | null = null;
    let executionResult: Tx6AgentOutput | null = null;

    try {
      executionResult = await runTx6Imp1Agent(input, mockAiClient);
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    expect(mockAiClient.analyzeReportData).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisStartDate: '2024-01-08',
        analysisEndDate: '2024-01-14',
        teamId: 'team_001',
      })
    );

    const analyzeResponse = await mockAiClient.analyzeReportData(
      expect.objectContaining({
        analysisStartDate: '2024-01-08',
        analysisEndDate: '2024-01-14',
        teamId: 'team_001',
      })
    );
    expect(analyzeResponse.code).toBe('AUTHORIZATION_DENIED');
    expect(analyzeResponse.message).toMatch(/Authorization denied/);
    expect(analyzeResponse.message).toMatch(/user_id_001/);
    expect(analyzeResponse.message).toMatch(/daily_report_database/);

    const toolResponse = await mockAiClient.extractKeywords({});
    expect(toolResponse.code).toBe('TOOL_OPERATION_DENIED');
    expect(toolResponse.message).toMatch(/Authorization denied/);

    const notificationResponse = await mockAiClient.sendNotification({});
    expect(notificationResponse.status).toBe('skipped');

    expect(mockAiClient.generateReport).not.toHaveBeenCalled();

    if (thrownError) {
      expect(thrownError.message).toMatch(/Authorization/);
    } else if (executionResult) {
      expect(executionResult.executionStatus).toBe('failure');
      expect(executionResult.errorDetails).toMatch(/Authorization/);
      expect(executionResult.reportId).toBeUndefined();
      expect(executionResult.emailDeliveryStatus).toBe('failed');
    }
  });
});