import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import { type Tx1Imp1AgentInput, type Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('朝会報告管理システム - tx-1-imp-1 エージェント', () => {
  // SCEN-002
  test('日報集約処理中にデータベース接続エラーが発生した場合、ReportAggregationFailureErrorが発生しエラーメッセージが表示される', async () => {
    const executionTimestamp = new Date('2024-01-15T08:00:00Z');
    const reportDeadlineTime = '09:00';
    const targetTeamIds: string[] = [];
    const managerEmailAddresses = ['manager@example.com'];

    const mockAiClient = {
      aggregateReportsByPeriod: jest.fn().mockRejectedValue(
        new Error('Database connection failed: Unable to connect to database server')
      ),
      detectAndNotifyUnsubmittedMembers: jest.fn(),
      extractAndRankIssueKeywords: jest.fn(),
      calculateIssuePriorityScore: jest.fn(),
      generateAndSendSummaryEmail: jest.fn(),
    };

    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      targetTeamIds,
      managerEmailAddresses,
    };

    try {
      await runTx1Imp1Agent(input, mockAiClient);
      fail('Expected ReportAggregationFailureError to be thrown');
    } catch (error: unknown) {
      const errorInstance = error as { message: string; name: string };
      expect(errorInstance.message).toMatch(/日報データの集約に失敗しました/);
      expect(errorInstance.name).toBe('ReportAggregationFailureError');
    }

    expect(mockAiClient.aggregateReportsByPeriod).toHaveBeenCalledWith({
      executionTimestamp,
      reportDeadlineTime,
      targetTeamIds,
    });
  });
});