import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次課題傾向分析レポート生成 - AIエージェント実行', () => {
  // SCEN-1854: [error] 月次課題傾向分析レポート生成 - 待機時間が負の数のときエラーになる
  test('待機時間が負の数のときエラーが発生すること', async () => {
    const invalidWaitTime = -300;

    const mockAiClient: Tx7Imp1AiClient = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: 'mgr-001',
      includeDetailedAnalysis: true,
    };

    await expect(
      runTx7Imp1Agent(agentInput, mockAiClient, invalidWaitTime),
    ).rejects.toThrow(/待機時間/);
  });
});