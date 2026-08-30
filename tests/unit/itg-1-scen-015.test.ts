import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4AgentExecutionContext, Tx4MorningBriefingMaterial } from '../../src/agents/tx-4-imp-1/types';

describe('tx-4-imp-1 Agent: Dashboard Analysis to Manager Brief Material', () => {
  // SCEN-015
  test('should handle manager confirmation email send failure and set notification status to RETRYING', async () => {
    const executionTimestamp = new Date('2026-08-20T06:00:00Z');
    const aggregationPeriodStartDate = new Date('2026-08-19');
    const aggregationPeriodEndDate = new Date('2026-08-19');

    const mockContext: Tx4AgentExecutionContext = {
      executionTimestamp,
      targetTeamIds: ['team-001'],
      aggregationPeriodStartDate,
      aggregationPeriodEndDate,
    };

    const mockAiClient = {
      generateAndSendManagerConfirmationEmail: jest.fn().mockRejectedValueOnce(
        new Error('部長への資料配信に失敗しました。リトライを実行します。')
      ),
      aggregateReportsByPeriod: jest.fn().mockResolvedValueOnce([
        {
          reportId: 'report-001',
          employeeId: 'emp-001',
          employeeName: 'Test Engineer',
          yesterday: 'Completed feature A',
          today: 'Start feature B',
          issues: 'Database connection timeout',
          submittedAt: new Date('2026-08-20T05:30:00Z'),
        },
      ]),
      extractAndRankIssuesFromReports: jest.fn().mockResolvedValueOnce([
        {
          keyword: 'Database connection timeout',
          frequency: 1,
          affectedMemberCount: 1,
          impactScore: 80,
          priorityScore: 75,
          priorityRank: 1,
        },
      ]),
      calculatePriorityScoreForIssue: jest.fn().mockResolvedValueOnce(75),
      prepareDashboardData: jest.fn().mockResolvedValueOnce({
        issueFrequencyRanking: [
          {
            keyword: 'Database connection timeout',
            frequency: 1,
            percentageOfTeam: 10,
          },
        ],
        issuePriorityScores: [
          {
            issueKeyword: 'Database connection timeout',
            frequencyScore: 50,
            impactScore: 80,
            priorityScore: 75,
          },
        ],
      }),
    };

    try {
      await runTx4Imp1Agent(mockContext, mockAiClient as any);
      fail('Expected ManagerNotificationFailureError to be thrown');
    } catch (error) {
      const errorMessage = (error as Error).message;
      expect(errorMessage).toMatch(/部長への資料配信に失敗しました/);
      expect(errorMessage).toMatch(/リトライを実行します/);
    }

    expect(mockAiClient.aggregateReportsByPeriod).toHaveBeenCalledWith(
      mockContext.targetTeamIds,
      mockContext.aggregationPeriodStartDate,
      mockContext.aggregationPeriodEndDate
    );
    expect(mockAiClient.extractAndRankIssuesFromReports).toHaveBeenCalled();
    expect(mockAiClient.calculatePriorityScoreForIssue).toHaveBeenCalled();
    expect(mockAiClient.prepareDashboardData).toHaveBeenCalled();
    expect(mockAiClient.generateAndSendManagerConfirmationEmail).toHaveBeenCalled();
  });
});