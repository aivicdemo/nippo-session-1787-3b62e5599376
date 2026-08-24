import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/types';

describe('朝会報告から課題再発パターン分析と可視化レポート生成', () => {
  // SCEN-1918: [error] 課題の再発パターン分析機能 - 蓄積期間が30日未満のときエラーになる
  test('蓄積期間が30日未満の場合、INSUFFICIENT_DATA_PERIODエラーをスローする', async () => {
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-29T23:59:59Z';
    const recipientManagerId = 'manager-001';

    const input: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId,
    };

    const mockAiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'ネットワーク遅延', frequency: 15, confidence: 0.92 },
        ],
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        score: 85,
      }),
      analyzeTimeSeriesPattern: jest.fn().mockResolvedValue({
        pattern: 'increasing',
        trend: '上昇傾向',
      }),
      generateVisualizationSpec: jest.fn().mockResolvedValue({
        graphs: [
          {
            type: 'line',
            title: '課題発生頻度の推移',
            dataPoints: [],
          },
        ],
      }),
    };

    await expect(
      runTx8Imp1Agent(input, mockAiClient)
    ).rejects.toThrow(/蓄積期間は30日以上である必要があります/);

    expect(mockAiClient.extractKeywords).not.toHaveBeenCalled();
  });
});