import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('課題の再発パターン分析機能', () => {
  // SCEN-1917
  test('開始日が終了日より後の場合エラーになる', async () => {
    const analysisStartDate = '2026-08-20';
    const analysisEndDate = '2026-08-19';
    const teamIds = ['team-001', 'team-002'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const mockAiClient = {
      extractRecurringPatterns: jest.fn(),
      generateVisualizationGraphs: jest.fn(),
      validateDateRange: jest.fn(),
      sendReportEmail: jest.fn(),
    };

    const input = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    await expect(
      runTx8Imp1Agent(input, mockAiClient)
    ).rejects.toThrow(/開始日は終了日以前/);
  });
});