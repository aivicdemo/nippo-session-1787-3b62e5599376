import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('ボトルネック変化パターン可視化レポート生成機能', () => {
  // SCEN-1999
  test('過去30日以外の期間が指定されたとき、レポート生成がエラーになる', async () => {
    const stubAiClient: Tx8Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'ビルドエラー', frequency: 5 },
          { keyword: 'テスト失敗', frequency: 3 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high'
      }),
      analyzeTimeSeriesPattern: jest.fn().mockResolvedValue({
        pattern: '増加傾向',
        confidence: 0.85
      }),
      generateVisualizationGraphs: jest.fn().mockResolvedValue({
        graphs: [
          {
            graphType: '折れ線',
            title: 'ビルドエラー発生推移',
            dataPoints: []
          }
        ]
      })
    };

    const inputWithInvalidPeriod60Days = {
      analysisStartDate: '2024-01-15T00:00:00Z',
      analysisEndDate: '2024-03-15T23:59:59Z',
      teamIds: ['team-001', 'team-002'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001'
    };

    await expect(
      runTx8Imp1Agent(inputWithInvalidPeriod60Days, stubAiClient)
    ).rejects.toThrow(/過去30日|期間|30days/);
  });
});