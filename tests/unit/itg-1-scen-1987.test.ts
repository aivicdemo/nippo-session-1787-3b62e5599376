import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('Tx8Imp1Agent - ボトルネック変化パターン可視化レポート生成', () => {
  // SCEN-1987
  test('過去30日間の課題データが空のとき、レポート生成がエラーになる', async () => {
    const input = {
      analysisStartDate: '2024-01-01T00:00:00Z',
      analysisEndDate: '2024-01-31T23:59:59Z',
      teamIds: ['team-001', 'team-002'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    const mockAiClient: Tx8Imp1AiClient = {
      action01_extractCourseData: jest.fn().mockResolvedValue({
        issues: [],
        dataPointsCount: 0,
      }),
      action02_analyzeTimeSeriesPattern: jest.fn(),
      action03_identifyBottleneckTransition: jest.fn(),
      action04_selectVisualizationGraphs: jest.fn(),
      action05_generateReport: jest.fn(),
    };

    const result = await runTx8Imp1Agent(input, mockAiClient);

    expect(result.type).toBe('error');
    expect(result.error?.code).toBe('INSUFFICIENT_DATA');
    expect(result.error?.message).toContain('過去30日間の課題データが存在しません');
    expect(result.error?.message).toContain('レポート生成には最小1件以上のデータが必要');
    expect(result.error?.context?.escalationCondition).toBe('DATA_QUALITY_BELOW_THRESHOLD');
    expect(mockAiClient.action02_analyzeTimeSeriesPattern).not.toHaveBeenCalled();
    expect(mockAiClient.action03_identifyBottleneckTransition).not.toHaveBeenCalled();
    expect(mockAiClient.action04_selectVisualizationGraphs).not.toHaveBeenCalled();
    expect(mockAiClient.action05_generateReport).not.toHaveBeenCalled();
  });
});