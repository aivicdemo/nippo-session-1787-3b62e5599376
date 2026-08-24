import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次課題傾向分析レポート生成 - Tx7Imp1Agent', () => {
  // SCEN-1850
  test('部長IDが null のときエラーがスローされ、外部サービス呼び出しが実行されない', async () => {
    const triggerTimestamp = new Date('2024-02-01T09:00:00Z');
    const targetMonth = '2024-01';
    const managerUserId = null as any;

    const mockAiClient: Tx7Imp1AiClient = {
      generateMonthlyAnalysisReport: jest.fn(),
      extractTopPriorityChallenges: jest.fn(),
      analyzeBottleneckTrend: jest.fn(),
      calculateTeamPerformanceMetrics: jest.fn(),
      formatReportForDelivery: jest.fn(),
      recordAuditLog: jest.fn(),
      notifyManagerDelivery: jest.fn(),
    };

    const input: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    await expect(async () => {
      await runTx7Imp1Agent(input, mockAiClient);
    }).rejects.toThrow(/部長ID/);

    expect(mockAiClient.generateMonthlyAnalysisReport).not.toHaveBeenCalled();
    expect(mockAiClient.extractTopPriorityChallenges).not.toHaveBeenCalled();
    expect(mockAiClient.analyzeBottleneckTrend).not.toHaveBeenCalled();
    expect(mockAiClient.calculateTeamPerformanceMetrics).not.toHaveBeenCalled();
    expect(mockAiClient.formatReportForDelivery).not.toHaveBeenCalled();
    expect(mockAiClient.notifyManagerDelivery).not.toHaveBeenCalled();
  });
});