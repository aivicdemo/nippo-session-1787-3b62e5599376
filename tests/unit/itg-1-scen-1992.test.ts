import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-1992
  test('影響度スコアが0～100の範囲外のとき、レポート生成がエラーになる', async () => {
    const mockAiClient: Tx8Imp1AiClient = {
      extractKeywords: jest.fn(async () => ({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 5,
            confidenceScore: 0.95,
          },
        ],
        totalMentions: 5,
      })),
      assessImpactScore: jest.fn(async () => -5),
      classifyIssueSeverity: jest.fn(async () => ({
        severity: 'high',
        confidence: 0.88,
      })),
    };

    const input = {
      analysisStartDate: '2024-01-01T00:00:00Z',
      analysisEndDate: '2024-01-31T23:59:59Z',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    await expect(runTx8Imp1Agent(input, mockAiClient)).rejects.toThrow(
      /影響度スコアは0～100の範囲内である必要があります。受け取った値: -5/
    );

    mockAiClient.assessImpactScore = jest.fn(async () => 101);

    await expect(runTx8Imp1Agent(input, mockAiClient)).rejects.toThrow(
      /影響度スコアは0～100の範囲内である必要があります。受け取った値: 101/
    );
  });
});