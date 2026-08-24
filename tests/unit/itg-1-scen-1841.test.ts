import { runTx7Imp1Agent, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次課題傾向分析レポート生成 - レポート生成処理実行時刻バリデーション', () => {
  // SCEN-1841
  test('レポート生成処理実行時刻が null のときエラーが throw される', async () => {
    const mockAiClient: Tx7Imp1AiClient = {
      executeAction01_ExtractMonthlyReportData: jest.fn(),
      executeAction02_AnalyzeTimeSeriesBottleneckTrend: jest.fn(),
      executeAction03_CalculateTeamPerformanceMetrics: jest.fn(),
      executeAction04_IdentifyTopPriorityChallenges: jest.fn(),
      executeAction05_GenerateReportDocument: jest.fn(),
      executeAction06_DetermineDistributionRecipients: jest.fn(),
      executeAction07_SendReportDelivery: jest.fn(),
      executeAction08_RecordAuditLog: jest.fn(),
    };

    const invalidInput = {
      triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: 'mgr-001',
      includeDetailedAnalysis: true,
      executionTimestamp: null as any,
    };

    await expect(runTx7Imp1Agent(invalidInput, mockAiClient)).rejects.toThrow(
      /executionTimestamp|レポート生成処理実行時刻/i
    );

    expect(mockAiClient.executeAction01_ExtractMonthlyReportData).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction02_AnalyzeTimeSeriesBottleneckTrend).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction03_CalculateTeamPerformanceMetrics).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction04_IdentifyTopPriorityChallenges).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction05_GenerateReportDocument).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction06_DetermineDistributionRecipients).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction07_SendReportDelivery).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction08_RecordAuditLog).not.toHaveBeenCalled();
  });
});