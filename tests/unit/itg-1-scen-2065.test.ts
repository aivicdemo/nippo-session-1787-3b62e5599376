import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('submitDailyReport with duplicate task items validation', () => {
  // SCEN-2065
  test('should pass validation when execution plan contains duplicate task items', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: '顧客DB改修', frequency: 2, confidenceScore: 0.95 },
          { keyword: 'API統合', frequency: 1, confidenceScore: 0.85 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
        severity: 'high',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        category: 'backend',
      }),
    };

    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed user authentication module',
      todayPlan: 'Start customer DB refactoring',
      challenges: '顧客DB改修が複雑になっている',
      reportDate: '2026-08-25',
    };

    const executionPlan = [
      {
        taskId: '1',
        taskName: '顧客DB改修',
        dueDate: '2026-08-25',
      },
      {
        taskId: '2',
        taskName: '顧客DB改修',
        dueDate: '2026-08-26',
      },
    ];

    const output: SubmitDailyReportOutput = await submitDailyReport(
      input,
      mockTextAnalysisServiceAdapter,
      executionPlan
    );

    expect(output).toEqual(
      expect.objectContaining({
        reportId: expect.any(String),
        submissionTimestamp: expect.any(String),
        isWithinDeadline: expect.any(Boolean),
      })
    );

    expect(output.reportId).toBeTruthy();
    expect(output.submissionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/
    );
    expect(typeof output.isWithinDeadline).toBe('boolean');

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.stringContaining('顧客DB改修')
    );
  });
});