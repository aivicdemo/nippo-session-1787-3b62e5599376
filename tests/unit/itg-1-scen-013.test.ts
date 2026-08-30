import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4AgentExecutionContext } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('tx-4-imp-1 orchestrator', () => {
  // SCEN-013: [error] 毎朝、リアルタイム進捗データを自動集約し、報告済み日報から課題を抽出・優先順位付けして、対応方針案を作成し、部長向け朝会資料として提示する。 - 集約対象期間内に提出済み日報が0件の場合、課題抽出・優先度付けが実行不可
  test('should throw NoReportDataAvailableError when no reports are submitted during aggregation period', async () => {
    const context: Tx4AgentExecutionContext = {
      executionTimestamp: new Date('2026-08-20T09:00:00Z'),
      targetTeamIds: ['team-001'],
      aggregationPeriodStartDate: new Date('2026-08-19T00:00:00Z'),
      aggregationPeriodEndDate: new Date('2026-08-19T23:59:59Z'),
    };

    const mockAiClient = {
      aggregateReportsByPeriod: jest.fn().mockResolvedValue([]),
      extractIssuesFromReports: jest.fn(),
      prioritizeIssues: jest.fn(),
      generateBriefingMaterial: jest.fn(),
      sendManagerNotification: jest.fn(),
    };

    await expect(runTx4Imp1Agent(context, mockAiClient)).rejects.toThrow(/報告データが未提出/);
  });
});