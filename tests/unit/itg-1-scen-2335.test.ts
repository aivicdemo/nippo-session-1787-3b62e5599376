import { calculateTeamPerformanceMetrics, type TeamPerformanceMetricsInput, type TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('課題解決速度計算機能 - 同一日付での集計', () => {
  test('SCEN-2335: 開始日と終了日が同日のとき、その日の課題解決データのみを集計する', () => {
    const aggregationStartDate = new Date('2024-01-15T09:00:00Z');
    const aggregationEndDate = new Date('2024-01-15T23:59:59Z');
    const teamIds = ['team-001'];

    const reportRecords = [
      {
        reportId: 'report-001',
        teamId: 'team-001',
        reportDate: new Date('2024-01-15T09:30:00Z'),
        issueId: 'issue-A',
        issueName: '課題A',
        issueStatus: 'resolved' as const,
        resolutionDays: 1,
      },
      {
        reportId: 'report-002',
        teamId: 'team-001',
        reportDate: new Date('2024-01-15T14:20:00Z'),
        issueId: 'issue-B',
        issueName: '課題B',
        issueStatus: 'resolved' as const,
        resolutionDays: 1,
      },
      {
        reportId: 'report-003',
        teamId: 'team-001',
        reportDate: new Date('2024-01-15T18:45:00Z'),
        issueId: 'issue-C',
        issueName: '課題C',
        issueStatus: 'resolved' as const,
        resolutionDays: 1,
      },
      {
        reportId: 'report-004',
        teamId: 'team-001',
        reportDate: new Date('2024-01-14T10:00:00Z'),
        issueId: 'issue-D',
        issueName: '課題D',
        issueStatus: 'resolved' as const,
        resolutionDays: 2,
      },
      {
        reportId: 'report-005',
        teamId: 'team-001',
        reportDate: new Date('2024-01-16T10:00:00Z'),
        issueId: 'issue-E',
        issueName: '課題E',
        issueStatus: 'resolved' as const,
        resolutionDays: 1,
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportDataset: reportRecords,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(result.teamMetrics.length).toBe(1);

    const teamMetric = result.teamMetrics[0];
    expect(teamMetric.teamId).toBe('team-001');

    const aggregatedIssueCount = reportRecords.filter(
      (record) =>
        record.teamId === 'team-001' &&
        record.reportDate >= aggregationStartDate &&
        record.reportDate <= aggregationEndDate,
    ).length;
    expect(aggregatedIssueCount).toBe(3);

    expect(teamMetric.issueResolutionSpeed).toBe(1);

    const resolvedIssuesOnTargetDate = reportRecords.filter(
      (record) =>
        record.teamId === 'team-001' &&
        record.reportDate >= aggregationStartDate &&
        record.reportDate <= aggregationEndDate &&
        record.issueStatus === 'resolved',
    );
    expect(resolvedIssuesOnTargetDate.length).toBe(3);
    expect(resolvedIssuesOnTargetDate.map((r) => r.issueId)).toEqual([
      'issue-A',
      'issue-B',
      'issue-C',
    ]);

    const excludedBeforeDate = reportRecords.find((r) => r.issueId === 'issue-D');
    const excludedAfterDate = reportRecords.find((r) => r.issueId === 'issue-E');
    expect(excludedBeforeDate?.reportDate.toISOString()).toBe(
      '2024-01-14T10:00:00.000Z',
    );
    expect(excludedAfterDate?.reportDate.toISOString()).toBe(
      '2024-01-16T10:00:00.000Z',
    );

    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.outlierDetectionResult).toBeDefined();
  });
});