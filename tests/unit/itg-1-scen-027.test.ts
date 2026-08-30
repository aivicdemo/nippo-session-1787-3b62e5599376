import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import type { Tx9AggregationInstruction } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('朝会報告管理システム - tx-9-imp-1 orchestrator', () => {
  // SCEN-027
  test('集約期間の開始日が終了日より後の場合、InvalidAggregationPeriodError が発生すること', async () => {
    const instruction: Tx9AggregationInstruction = {
      aggregationStartDate: '2024-01-31',
      aggregationEndDate: '2024-01-01',
      targetUserIds: ['user-001', 'user-002'],
      outputFormat: 'summary',
      managerId: 'manager-001',
    };

    await expect(() => runTx9Imp1Agent(instruction, {} as any)).rejects.toThrow(
      /集約期間が無効です/
    );
  });
});