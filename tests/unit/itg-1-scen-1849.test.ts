import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次課題傾向分析レポート生成エージェント', () => {
  // SCEN-1849
  test('[error] プロジェクトマネージャーID が空文字列のときエラーになる', async () => {
    const mockAiClient: Tx7Imp1AiClient = {
      action01_extractMonthlyReportingData: jest.fn(),
      action02_analyzeBottleneckTrend: jest.fn(),
      action03_calculateTeamPerformanceMetrics: jest.fn(),
      action04_identifyTopPriorityChallenges: jest.fn(),
      action05_generateReportSummary: jest.fn(),
      action06_compileMonthlyAnalysisReport: jest.fn(),
      action07_sendReportToManager: jest.fn(),
      action08_recordReportGenerationAudit: jest.fn(),
    };

    const invalidInput: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: '',
      includeDetailedAnalysis: true,
    };

    await expect(
      runTx7Imp1Agent(invalidInput, mockAiClient)
    ).rejects.toThrow(/プロジェクトマネージャーID/);

    expect(mockAiClient.action01_extractMonthlyReportingData).not.toHaveBeenCalled();
  });
});