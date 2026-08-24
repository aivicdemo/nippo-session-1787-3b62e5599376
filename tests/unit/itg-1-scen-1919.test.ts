import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('課題の再発パターン分析機能 - 類似度判定の閾値検証', () => {
  test('SCEN-1919: 類似度判定の閾値が0未満のときエラーになる', async () => {
    const stubAiClient = {
      extractRecurringPatterns: jest.fn().mockResolvedValue({
        recurringPatterns: [],
        analysisMetadata: {
          similarityThreshold: -0.5,
        },
      }),
      generateVisualizationGraphs: jest.fn().mockResolvedValue({
        graphs: [],
      }),
      generateReport: jest.fn().mockResolvedValue({
        reportId: 'report-001',
      }),
    };

    const input = {
      analysisStartDate: '2024-01-01T00:00:00Z',
      analysisEndDate: '2024-01-31T23:59:59Z',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    await expect(() =>
      runTx8Imp1Agent(input, {
        ...stubAiClient,
        extractRecurringPatterns: jest.fn().mockImplementation(() => {
          throw new Error('INVALID_THRESHOLD: 類似度判定の閾値は0以上1以下の値である必要があります');
        }),
      })
    ).rejects.toThrow(/類似度判定の閾値/);
  });
});