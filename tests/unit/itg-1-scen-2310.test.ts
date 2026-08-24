import { calculateTeamPerformanceMetrics, type TeamPerformanceMetricsInput, type TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Team Performance Metrics Calculation', () => {
  // SCEN-2310: [edge] メンバー別生産性スコア計算機能 - メンバーの報告データが時系列で逆順に入力された場合、期間内の生産性スコアが正しく集計される
  test('should correctly aggregate member productivity scores regardless of input chronological order', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-03T23:59:59Z');
    const teamId = 'team-001';
    const memberId = 'member-001';

    const reverseChronologicalReportRecords = [
      {
        reportId: 'report-001',
        memberId: memberId,
        teamId: teamId,
        reportDate: new Date('2024-01-03T09:00:00Z'),
        yesterdayAccomplishments: 'Completed feature X',
        todayPlan: 'Work on feature Y',
        issues: 'One minor issue reported',
        completedTaskCount: 5,
        issueReportCount: 1,
        responseTimeHours: 8,
      },
      {
        reportId: 'report-002',
        memberId: memberId,
        teamId: teamId,
        reportDate: new Date('2024-01-02T09:00:00Z'),
        yesterdayAccomplishments: 'Completed feature A',
        todayPlan: 'Work on feature B',
        issues: 'Two issues found',
        completedTaskCount: 3,
        issueReportCount: 2,
        responseTimeHours: 7,
      },
      {
        reportId: 'report-003',
        memberId: memberId,
        teamId: teamId,
        reportDate: new Date('2024-01-01T09:00:00Z'),
        yesterdayAccomplishments: 'Completed feature M',
        todayPlan: 'Work on feature N',
        issues: 'No issues',
        completedTaskCount: 4,
        issueReportCount: 0,
        responseTimeHours: 9,
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate: aggregationStartDate,
      aggregationEndDate: aggregationEndDate,
      teamIds: [teamId],
      reportDataset: reverseChronologicalReportRecords,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    const memberMetrics = result.teamMetrics.find(
      (metric) => metric.teamId === teamId
    );

    expect(memberMetrics).toBeDefined();
    expect(memberMetrics?.teamId).toBe(teamId);

    const totalCompletedTasks = 5 + 3 + 4;
    const totalIssueReports = 1 + 2 + 0;
    const totalResponseTimeHours = 8 + 7 + 9;

    expect(totalCompletedTasks).toBe(12);
    expect(totalIssueReports).toBe(3);
    expect(totalResponseTimeHours).toBe(24);

    const expectedReportSubmissionRate = 100;
    expect(memberMetrics?.reportSubmissionRate).toBe(expectedReportSubmissionRate);

    expect(memberMetrics?.issueResolutionSpeed).toBeGreaterThanOrEqual(0);
    expect(memberMetrics?.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(memberMetrics?.issueRecurrenceRate).toBeLessThanOrEqual(100);
    expect(memberMetrics?.priorityScore).toBeGreaterThan(0);
    expect(memberMetrics?.priorityScore).toBeLessThanOrEqual(100);

    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);
    expect(result.aggregationPeriod.durationDays).toBe(3);

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.outlierDetectionResult).toBeDefined();
    expect(result.outlierDetectionResult.outliers).toBeDefined();
    expect(Array.isArray(result.outlierDetectionResult.outliers)).toBe(true);
  });
});