import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('朝会報告管理システム - Tx9 月次分析レポート自動実行', () => {
  test('SCEN-028: 指定期間内の日報データが10件未満の場合、分析中止とエラー返却', async () => {
    const fakeAiClient = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn().mockResolvedValue(0),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const mockAggregateReportsByPeriod = jest.fn().mockResolvedValue({
      reports: Array(8).fill({
        employeeId: 'user001',
        yesterday: 'completed task A',
        today: 'start task B',
        issue: 'connection timeout',
      }),
      period: { startDate: '2025-01-01', endDate: '2025-01-31' },
    });

    const mockCalculateProductivityMetrics = jest.fn().mockResolvedValue({
      issueResolutionSpeed: 3.5,
      reportSubmissionRate: 85,
      issueRecurrenceRate: 15,
      teamProductivityScore: 75,
    });

    const mockExtractAndRankIssuesFromReports = jest.fn().mockResolvedValue([
      {
        issueId: 'issue001',
        keyword: 'connection',
        frequency: 3,
      },
    ]);

    const mockValidateReportQuality = jest.fn().mockResolvedValue({
      isValid: true,
      qualityScore: 85,
    });

    const mockSaveExtractedIssueData = jest.fn().mockResolvedValue({
      saved: true,
    });

    const mockGenerateAndSendManagerConfirmationEmail = jest.fn().mockResolvedValue({
      emailSent: true,
      sentAt: '2025-02-01T09:00:00Z',
    });

    const instruction = {
      aggregationStartDate: '2025-01-01',
      aggregationEndDate: '2025-01-31',
      targetUserIds: ['user001', 'user002'],
      targetTeamIds: [],
      outputFormat: 'summary' as const,
      managerId: 'manager001',
    };

    const dependencies = {
      aggregateReportsByPeriod: mockAggregateReportsByPeriod,
      calculateProductivityMetrics: mockCalculateProductivityMetrics,
      extractAndRankIssuesFromReports: mockExtractAndRankIssuesFromReports,
      validateReportQuality: mockValidateReportQuality,
      saveExtractedIssueData: mockSaveExtractedIssueData,
      generateAndSendManagerConfirmationEmail: mockGenerateAndSendManagerConfirmationEmail,
    };

    await expect(
      runTx9Imp1Agent(instruction, fakeAiClient, dependencies)
    ).rejects.toThrow(/分析に必要な最小日報件数/);

    expect(mockAggregateReportsByPeriod).toHaveBeenCalledWith(
      '2025-01-01',
      '2025-01-31',
      ['user001', 'user002'],
      []
    );

    expect(mockCalculateProductivityMetrics).not.toHaveBeenCalled();
    expect(mockExtractAndRankIssuesFromReports).not.toHaveBeenCalled();
    expect(mockValidateReportQuality).not.toHaveBeenCalled();
    expect(mockSaveExtractedIssueData).not.toHaveBeenCalled();
    expect(mockGenerateAndSendManagerConfirmationEmail).not.toHaveBeenCalled();
  });
});