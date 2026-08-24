import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次課題傾向分析レポート生成エージェント', () => {
  // SCEN-1846
  test('should throw TypeError when retryCount is null during TextAnalysisServiceAdapter failure', async () => {
    const input: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: 'manager-001',
      includeDetailedAnalysis: true,
    };

    const aiClient: Tx7Imp1AiClient = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error('External API call failed')
      ),
      assessImpactScore: jest.fn().mockResolvedValue({ score: 50 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
      generateReport: jest.fn().mockResolvedValue({
        reportId: 'report-001',
        generatedAt: new Date('2024-01-01T09:15:00Z'),
      }),
      sendNotification: jest.fn().mockResolvedValue({ success: true }),
    };

    const textAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockImplementation(() => {
        let retryCount: number | null = null;
        const maxRetries = 3;
        const retryDelays = [3000, 10000, 30000];

        const attemptExtraction = async (): Promise<void> => {
          throw new Error('API failed');
        };

        const executeWithRetry = async (): Promise<void> => {
          try {
            await attemptExtraction();
          } catch (error) {
            if (retryCount === null) {
              retryCount++;
            }
            throw new TypeError('Cannot read property of null');
          }
        };

        return executeWithRetry();
      }),
    };

    expect(async () => {
      await runTx7Imp1Agent(input, aiClient);
    }).rejects.toThrow(/null/);
  });
});