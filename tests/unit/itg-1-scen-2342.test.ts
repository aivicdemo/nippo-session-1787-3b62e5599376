import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import { type TeamPerformanceMetricsInput, type TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア付与機能', () => {
  // SCEN-2342: [edge] 課題解決速度計算機能 - 対応完了率が100%未満（例：99.9%）のとき、99.9と表示される
  test('対応完了率が99.9%のとき、表示値が99.9となること', () => {
    const aggregationStartDate = new Date('2024-01-01');
    const aggregationEndDate = new Date('2024-01-31');
    const teamIds = ['team-001'];

    const reportDataset = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-15'),
        teamId: 'team-001',
        memberId: 'member-001',
        yesterdayAccomplishments: 'Feature A implementation',
        todayPlan: 'Feature B implementation',
        issues: ['DB connection timeout'],
        submittedAt: new Date('2024-01-15T08:00:00Z'),
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-16'),
        teamId: 'team-001',
        memberId: 'member-002',
        yesterdayAccomplishments: 'Feature B implementation',
        todayPlan: 'Testing',
        issues: ['API rate limiting'],
        submittedAt: new Date('2024-01-16T08:00:00Z'),
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2024-01-17'),
        teamId: 'team-001',
        memberId: 'member-003',
        yesterdayAccomplishments: 'Testing',
        todayPlan: 'Deployment',
        issues: ['Load balancer config'],
        submittedAt: new Date('2024-01-17T08:00:00Z'),
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportDataset,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);

    const teamMetric = result.teamMetrics.find((m) => m.teamId === 'team-001');
    expect(teamMetric).toBeDefined();

    if (teamMetric) {
      expect(teamMetric.reportSubmissionRate).toBeDefined();
      expect(typeof teamMetric.reportSubmissionRate).toBe('number');

      const displayedCompletionRate = Math.floor(teamMetric.reportSubmissionRate * 10) / 10;
      expect(displayedCompletionRate).toBe(99.9);

      expect(teamMetric.reportSubmissionRate).toBeLessThan(100);
      expect(teamMetric.reportSubmissionRate).toBeGreaterThanOrEqual(99);
    }

    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);

    expect(result.dataQualityScore).toBeDefined();
    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.outlierDetectionResult).toBeDefined();
  });
});