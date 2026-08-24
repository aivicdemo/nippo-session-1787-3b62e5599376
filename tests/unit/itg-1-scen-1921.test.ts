import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8AgentInput, Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('課題の再発パターン分析機能', () => {
  // SCEN-1921
  test('グループ化対象のキーワードが空文字列のときエラーになる', async () => {
    const mockAiClient = {
      analyzeRecurringPatterns: jest.fn(),
      generateVisualizationGraphs: jest.fn(),
    };

    const invalidInput: Tx8AgentInput = {
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    const invalidGroupingKeyword = '';

    expect(async () => {
      await runTx8Imp1Agent(
        {
          ...invalidInput,
          groupingKeyword: invalidGroupingKeyword,
        },
        mockAiClient
      );
    }).rejects.toThrow(/グループ化対象のキーワード/);

    expect(mockAiClient.analyzeRecurringPatterns).not.toHaveBeenCalled();
  });
});