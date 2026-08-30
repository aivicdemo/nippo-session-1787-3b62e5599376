import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('tx-2-imp-1 orchestrator', () => {
  // SCEN-007
  test('should throw IssueExtractionFailureError when issue keyword extraction fails', async () => {
    const input = {
      executionDate: new Date('2026-08-20T00:00:00Z'),
      teamIds: ['team-001'],
      managerNotificationEnabled: true,
    };

    const mockAiClient = {
      extractAndRankIssuesFromReports: jest.fn().mockRejectedValue(
        new Error('Failed to extract keywords from report text')
      ),
      fetchDailyReportsForTeams: jest.fn().mockResolvedValue([
        {
          employeeId: 'emp-001',
          employeeName: 'John Doe',
          yesterday: 'Completed feature A',
          today: 'Start feature B',
          issue: 'Database connection timeout',
          submittedAt: '2026-08-20T07:00:00Z',
        },
      ]),
      identifyUnsubmittedMembers: jest.fn().mockResolvedValue([]),
      formatAndSendConfirmationEmail: jest.fn().mockResolvedValue({
        emailSent: false,
        sentAt: new Date('2026-08-20T08:00:00Z'),
      }),
      logProcessingEvent: jest.fn().mockResolvedValue(undefined),
    };

    await expect(runTx2Imp1Agent(input, mockAiClient)).rejects.toThrow(
      /課題の抽出に失敗しました。日報の形式を確認してください。/
    );
  });
});