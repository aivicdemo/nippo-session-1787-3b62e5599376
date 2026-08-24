import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('朝会報告管理システム - 月次レポート生成', () => {
  // SCEN-1842
  test('レポート生成処理実行時刻が空文字列のときエラーになる', async () => {
    const mockAiClient: Tx7Imp1AiClient = {
      extractReportData: jest.fn(),
      analyzeTimeSeriesTrend: jest.fn(),
      calculateBottleneckMetrics: jest.fn(),
      assessTeamPerformance: jest.fn(),
      generateReportSummary: jest.fn(),
      formatDeliveryNotification: jest.fn(),
      executeRetryWithBackoff: jest.fn(),
    };

    const input = {
      triggerTimestamp: new Date(''),
      targetMonth: '2024-01',
      managerUserId: 'user-001',
      includeDetailedAnalysis: true,
    };

    const result = await runTx7Imp1Agent(input, mockAiClient);

    expect(result).toHaveProperty('executionStatus');
    expect(result.executionStatus).toBe('failure');
    expect(result).toHaveProperty('reportId');
    expect(typeof result.reportId).toBe('string');
    expect(result).toHaveProperty('analysisResultSummary');
    expect(result.analysisResultSummary).toBeNull();
    expect(result).toHaveProperty('deliveryTimestamp');
  });
});