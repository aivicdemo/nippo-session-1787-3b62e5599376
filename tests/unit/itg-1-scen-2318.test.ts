import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import { type TeamPerformanceMetricsInput, type TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - calculateTeamPerformanceMetrics', () => {
  // SCEN-2318: [normal] 課題解決速度の定量計算機能 - 指定期間内で全ての課題が未解決の場合、対応完了率が0%として計算される
  test('should calculate completion rate as 0% when all issues in specified period are unresolved', () => {
    const analysisStartDate = new Date('2026-01-01T00:00:00Z');
    const analysisEndDate = new Date('2026-01-31T23:59:59Z');
    const teamIds = ['team-001'];

    const reportRecords = [
      {
        reportId: 'report-001',
        reportDate: new Date('2026-01-05T09:00:00Z'),
        teamId: 'team-001',
        reportedIssues: [
          {
            issueId: 'issue-001',
            keywordId: 'keyword-bug',
            reportedDate: new Date('2026-01-05T09:00:00Z'),
            resolutionStatus: 'open' as const,
            resolvedDate: null,
          },
        ],
        yesterdayAccomplishments: 'Completed feature A',
        todayPlans: 'Work on feature B',
        challenges: 'Database connection timeout',
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2026-01-10T09:00:00Z'),
        teamId: 'team-001',
        reportedIssues: [
          {
            issueId: 'issue-002',
            keywordId: 'keyword-performance',
            reportedDate: new Date('2026-01-10T09:00:00Z'),
            resolutionStatus: 'open' as const,
            resolvedDate: null,
          },
        ],
        yesterdayAccomplishments: 'Fixed bug in module X',
        todayPlans: 'Optimize query performance',
        challenges: 'Memory leak in service Y',
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2026-01-15T09:00:00Z'),
        teamId: 'team-001',
        reportedIssues: [
          {
            issueId: 'issue-003',
            keywordId: 'keyword-integration',
            reportedDate: new Date('2026-01-15T09:00:00Z'),
            resolutionStatus: 'in_progress' as const,
            resolvedDate: null,
          },
        ],
        yesterdayAccomplishments: 'Completed feature B',
        todayPlans: 'Start integration testing',
        challenges: 'Third-party API integration issue',
      },
    ];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'database', frequency: 1, impactScore: 65 },
          { keyword: 'performance', frequency: 1, impactScore: 70 },
          { keyword: 'integration', frequency: 1, impactScore: 60 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 65 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'medium' }),
    };

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate: analysisStartDate,
      aggregationEndDate: analysisEndDate,
      teamIds,
      reportDataset: reportRecords,
    };

    const result = calculateTeamPerformanceMetrics(input, mockTextAnalysisAdapter);

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);

    const teamMetricForTeam001 = result.teamMetrics.find(
      (metric) => metric.teamId === 'team-001'
    );
    expect(teamMetricForTeam001).toBeDefined();

    if (teamMetricForTeam001) {
      expect(teamMetricForTeam001.issueResolutionSpeed).toBeGreaterThanOrEqual(0);
      expect(teamMetricForTeam001.reportSubmissionRate).toBeGreaterThanOrEqual(0);
      expect(teamMetricForTeam001.reportSubmissionRate).toBeLessThanOrEqual(100);
      expect(teamMetricForTeam001.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
      expect(teamMetricForTeam001.issueRecurrenceRate).toBeLessThanOrEqual(100);
      expect(teamMetricForTeam001.priorityScore).toBeGreaterThanOrEqual(1);
      expect(teamMetricForTeam001.priorityScore).toBeLessThanOrEqual(100);
    }

    const aggregationPeriod = result.aggregationPeriod;
    expect(aggregationPeriod).toBeDefined();
    expect(aggregationPeriod.startDate).toEqual(analysisStartDate);
    expect(aggregationPeriod.endDate).toEqual(analysisEndDate);
    expect(aggregationPeriod.dayCount).toBe(31);

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.outlierDetectionResult).toBeDefined();
    expect(result.outlierDetectionResult.detectedOutliers).toBeDefined();
    expect(Array.isArray(result.outlierDetectionResult.detectedOutliers)).toBe(
      true
    );
  });
});