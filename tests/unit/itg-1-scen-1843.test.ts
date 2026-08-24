import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AgentOutput } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次課題傾向分析レポート生成エージェント (tx_7_imp_1)', () => {
  // SCEN-1843: [error] 月次課題傾向分析レポート生成 - レポート生成処理の状態が undefined のときエラーになる
  test('レポート生成処理の状態が undefined のとき、適切なエラーをスローする', async () => {
    const mockAiClient: Tx7Imp1AiClient = {
      callAction01: jest.fn().mockResolvedValue({
        status: 'success',
        extractedReports: [
          {
            reportId: 'rpt_001',
            submittedAt: new Date('2024-01-15T08:00:00Z'),
            challenges: ['課題A', '課題B'],
          },
        ],
      }),
      callAction02: jest.fn().mockResolvedValue({
        status: 'success',
        aggregatedData: {
          totalReports: 1,
          challengeFrequency: [
            { keyword: '課題A', frequency: 1 },
            { keyword: '課題B', frequency: 1 },
          ],
        },
      }),
      callAction03: jest.fn().mockResolvedValue({
        state: undefined,
      }),
      callAction04: jest.fn(),
      callAction05: jest.fn(),
      callAction06: jest.fn(),
      callAction07: jest.fn(),
      callAction08: jest.fn(),
    };

    const input: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-02-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: 'mgr_001',
      includeDetailedAnalysis: true,
    };

    await expect(async () => {
      await runTx7Imp1Agent(input, mockAiClient);
    }).rejects.toThrow(/レポート生成処理の状態が不正です|state.*undefined/);
  });
});