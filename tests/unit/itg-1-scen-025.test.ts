import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1 orchestrator', () => {
  test('SCEN-025: should handle IssueDataExtractionFailure and return failure status with appropriate error message', async () => {
    const aiClientStub = {
      extractIssueDataFromReports: jest.fn().mockRejectedValueOnce(
        new Error('課題データの抽出に失敗しました。システム管理者に連絡してください。')
      ),
      analyzeTimeSeriesPattern: jest.fn(),
      generateVisualizationReport: jest.fn(),
      sendManagerNotification: jest.fn(),
    };

    const analysisStartDate = '2026-01-01';
    const analysisEndDate = '2026-01-31';
    const targetTeamIds = undefined;
    const managerUserId = 'manager-001';

    const result = await runTx8Imp1Agent(
      {
        analysisStartDate,
        analysisEndDate,
        targetTeamIds,
        managerUserId,
      },
      aiClientStub
    );

    expect(result.executionStatus).toBe('failure');
    expect(result.visualizationReportId).toBeUndefined();
    expect(result.issuePatternSummary).toBeUndefined();
    expect(result.managerNotificationSent).toBe(false);
  });
});