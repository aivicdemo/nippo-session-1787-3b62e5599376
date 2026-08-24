import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1 orchestrator', () => {
  // SCEN-1855
  test('should handle unknown error during monthly analysis report generation', async () => {
    const mockAiClient: Tx7Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Unknown analysis failure',
        },
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
      analyzeTimeSeries: jest.fn(),
      calculateTeamMetrics: jest.fn(),
      generateReport: jest.fn(),
      sendNotification: jest.fn(),
    };

    const mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const mockAdminAlertQueue = {
      enqueue: jest.fn(),
    };

    const input: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: 'user-123',
      includeDetailedAnalysis: true,
    };

    const result = await runTx7Imp1Agent(input, mockAiClient, {
      logger: mockLogger,
      adminAlertQueue: mockAdminAlertQueue,
    });

    expect(result.executionStatus).toBe('failure');
    expect(result.analysisResultSummary).toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('予期しないエラーが発生しました。エラーコード: UNKNOWN_ERROR')
    );
    expect(mockAdminAlertQueue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: 'UNKNOWN_ERROR',
        errorMessage: 'Unknown analysis failure',
        severity: 'high',
      })
    );
    expect(result.deliveryTimestamp).toBeUndefined();
  });
});