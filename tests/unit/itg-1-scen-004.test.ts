import { runTx1Imp1Agent, type Tx1Imp1AgentInput, type Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('朝会報告管理システム - tx-1-imp-1 オーケストレーター', () => {
  // SCEN-004: 課題の優先度スコア計算に必要なパラメータが不足または無効な場合にエラーが発生することを検証
  test('should throw error when priority score calculation parameters are missing or invalid', async () => {
    const executionTimestamp = new Date('2024-01-15T08:00:00Z');
    const reportDeadlineTime = '09:30';
    const targetTeamIds: string[] = [];
    const managerEmailAddresses = ['manager@example.com'];

    const invalidAgentInput: Tx1Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      targetTeamIds,
      managerEmailAddresses,
    };

    // 課題の優先度付けに必要なパラメータが不足している場合、エラーが発生することを期待
    await expect(runTx1Imp1Agent(invalidAgentInput)).rejects.toThrow(/優先度付け/);
  });
});