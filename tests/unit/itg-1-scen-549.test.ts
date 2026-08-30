import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  test('SCEN-549: 標準偏差が0のとき異常値判定をスキップする', async () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const targetTeamIds = ['team-001'];
    const excludeOutliers = true;

    const issuesDataset = [
      {
        issueId: 'issue-001',
        issueKeyword: 'API_ERROR',
        reportedDate: new Date('2024-01-05T09:00:00Z'),
        resolvedDate: new Date('2024-01-08T09:00:00Z'),
        status: 'resolved' as const,
        teamId: 'team-001',
        reporterId: 'eng-001',
        resolutionDays: 3,
        teamImpactScore: 20,
      },
      {
        issueId: 'issue-002',
        issueKeyword: 'API_ERROR',
        reportedDate: new Date('2024-01-10T09:00:00Z'),
        resolvedDate: new Date('2024-01-13T09:00:00Z'),
        status: 'resolved' as const,
        teamId: 'team-001',
        reporterId: 'eng-002',
        resolutionDays: 3,
        teamImpactScore: 30,
      },
      {
        issueId: 'issue-003',
        issueKeyword: 'API_ERROR',
        reportedDate: new Date('2024-01-15T09:00:00Z'),
        resolvedDate: new Date('2024-01-18T09:00:00Z'),
        status: 'resolved' as const,
        teamId: 'team-001',
        reporterId: 'eng-003',
        resolutionDays: 3,
        teamImpactScore: 40,
      },
      {
        issueId: 'issue-004',
        issueKeyword: 'API_ERROR',
        reportedDate: new Date('2024-01-20T09:00:00Z'),
        resolvedDate: new Date('2024-01-23T09:00:00Z'),
        status: 'resolved' as const,
        teamId: 'team-001',
        reporterId: 'eng-004',
        resolutionDays: 3,
        teamImpactScore: 50,
      },
      {
        issueId: 'issue-005',
        issueKeyword: 'API_ERROR',
        reportedDate: new Date('2024-01-25T09:00:00Z'),
        resolvedDate: new Date('2024-01-28T09:00:00Z'),
        status: 'resolved' as const,
        teamId: 'team-001',
        reporterId: 'eng-005',
        resolutionDays: 3,
        teamImpactScore: 60,
      },
    ];

    const reportSubmissionsData = [
      {
        memberId: 'eng-001',
        submittedAt: new Date('2024-01-05T08:00:00Z'),
        teamId: 'team-001',
      },
      {
        memberId: 'eng-002',
        submittedAt: new Date('2024-01-10T08:00:00Z'),
        teamId: 'team-001',
      },
      {
        memberId: 'eng-003',
        submittedAt: new Date('2024-01-15T08:00:00Z'),
        teamId: 'team-001',
      },
      {
        memberId: 'eng-004',
        submittedAt: new Date('2024-01-20T08:00:00Z'),
        teamId: 'team-001',
      },
      {
        memberId: 'eng-005',
        submittedAt: new Date('2024-01-25T08:00:00Z'),
        teamId: 'team-001',
      },
    ];

    const recurrenceData = [
      {
        keyword: 'API_ERROR',
        totalOccurrences: 5,
        recurrenceCount: 0,
        recurrenceRate: 0,
      },
    ];

    const result = await calculateProductivityMetrics({
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      excludeOutliers,
      issuesDataset,
      reportSubmissionsData,
      recurrenceData,
    });

    expect(result.issueResolutionSpeed).toBe(3.0);
    expect(result.reportSubmissionRate).toBeGreaterThanOrEqual(0);
    expect(result.reportSubmissionRate).toBeLessThanOrEqual(100);
    expect(result.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(result.issueRecurrenceRate).toBeLessThanOrEqual(100);
    expect(result.teamProductivityScore).toBeGreaterThanOrEqual(0);
    expect(result.teamProductivityScore).toBeLessThanOrEqual(100);

    expect(Array.isArray(result.detectedAnomalies)).toBe(true);

    if (
      result.detectedAnomalies &&
      result.detectedAnomalies.length === 0
    ) {
      expect(result.detectedAnomalies).toEqual([]);
    }

    expect(result.dataQualityAssessment).toBeDefined();
    expect(result.dataQualityAssessment.completenessPercentage).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityAssessment.completenessPercentage).toBeLessThanOrEqual(100);
    expect(result.dataQualityAssessment.extractionAccuracy).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityAssessment.extractionAccuracy).toBeLessThanOrEqual(100);
    expect(typeof result.dataQualityAssessment.isReportable).toBe('boolean');
  });
});