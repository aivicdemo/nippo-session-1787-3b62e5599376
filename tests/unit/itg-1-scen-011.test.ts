import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('Tx3Imp1Agent - 日報集約から優先度別課題一覧提示までの自動判定・配信', () => {
  test('SCEN-011: メール送信失敗時にManagerEmailDeliveryFailureエラーをスロー', async () => {
    // Arrange: スタブの定義
    const mockAiClient = {
      aggregateReportsByPeriod: jest.fn().mockResolvedValue({
        totalReports: 10,
        submittedCount: 10,
        pendingCount: 0,
        reportDetails: [
          {
            employeeId: 'emp-001',
            employeeName: 'Employee A',
            yesterday: 'Completed feature X',
            today: 'Start feature Y',
            issue: 'Build timeout issue',
            submittedAt: '2026-01-31T08:00:00Z'
          },
          {
            employeeId: 'emp-002',
            employeeName: 'Employee B',
            yesterday: 'Fixed bug Y',
            today: 'Review PR',
            issue: 'Database connection delayed',
            submittedAt: '2026-01-31T08:15:00Z'
          }
        ]
      }),
      extractAndRankIssuesFromReports: jest.fn().mockResolvedValue({
        extractedIssueCount: 2,
        rankedIssues: [
          {
            keyword: 'Build timeout issue',
            frequency: 5,
            affectedMemberCount: 3,
            priorityScore: 75,
            priorityLevel: 'high',
            displayColor: '#FF0000'
          },
          {
            keyword: 'Database connection delayed',
            frequency: 3,
            affectedMemberCount: 2,
            priorityScore: 55,
            priorityLevel: 'medium',
            displayColor: '#FFFF00'
          }
        ]
      }),
      generateAndSendManagerConfirmationEmail: jest.fn().mockRejectedValue(
        new Error('SMTP connection failed: Unable to connect to mail server')
      )
    };

    const aggregationPeriodStartDate = '2026-01-01';
    const aggregationPeriodEndDate = '2026-01-31';
    const targetTeamIds = null;
    const managerUserId = 'manager-001';

    // Act & Assert: メール送信失敗でエラーをスロー
    await expect(
      runTx3Imp1Agent(
        {
          aggregationPeriodStartDate,
          aggregationPeriodEndDate,
          targetTeamIds,
          managerUserId
        },
        mockAiClient
      )
    ).rejects.toThrow(/部長へのメール送信に失敗しました。リトライを実行します。/);

    // Assert: スタブが適切に呼び出されたことを確認
    expect(mockAiClient.aggregateReportsByPeriod).toHaveBeenCalledWith(
      aggregationPeriodStartDate,
      aggregationPeriodEndDate,
      targetTeamIds
    );

    expect(mockAiClient.extractAndRankIssuesFromReports).toHaveBeenCalled();

    expect(mockAiClient.generateAndSendManagerConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        managerUserId: 'manager-001',
        reportingPeriodStart: aggregationPeriodStartDate,
        reportingPeriodEnd: aggregationPeriodEndDate,
        submittedReportCount: 10,
        extractedIssueCount: 2
      })
    );
  });
});