import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('ボトルネック変化パターン可視化レポート生成機能', () => {
  test('SCEN-1994: 分析対象期間の開始日が終了日より後のときエラーになる', async () => {
    const mockAiClient: Tx8Imp1AiClient = {
      extractRecurringPatterns: jest.fn(),
      generateVisualizationGraphs: jest.fn(),
      validateDateRange: jest.fn(),
    };

    const input = {
      analysisStartDate: '2024-12-31T00:00:00Z',
      analysisEndDate: '2024-12-25T23:59:59Z',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'mgr-001',
    };

    try {
      await runTx8Imp1Agent(input, mockAiClient);
      fail('エラーが発生するべきですが、成功しました');
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      expect(err.message).toMatch(/分析対象期間の開始日は終了日より前である必要があります/);
      expect(err.code).toBe('ERR_INVALID_DATE_RANGE');
    }

    expect(mockAiClient.extractRecurringPatterns).not.toHaveBeenCalled();
    expect(mockAiClient.generateVisualizationGraphs).not.toHaveBeenCalled();
  });
});