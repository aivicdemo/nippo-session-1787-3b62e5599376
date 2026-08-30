import { analyzeProductivityTrends, type ProductivityTrendsAnalysisInput, type ProductivityTrendsAnalysisResult } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標傾向分析', () => {
  // SCEN-512
  test('計算済みの生産性指標から月次・四半期ごとの傾向を分析し、チーム全体のパフォーマンス変動を判定して、対策効果の成功判定基準との比較結果を報告書として提示する', () => {
    const aggregationPeriodStart = new Date('2024-01-01T00:00:00Z');
    const aggregationPeriodEnd = new Date('2024-01-31T23:59:59Z');

    const productivityMetricsDataPoints = [
      {
        periodDate: new Date('2024-01-10T00:00:00Z'),
        issueResolutionSpeed: 5.2,
        reportSubmissionRate: 50,
        issueRecurrenceRate: 40,
        teamProductivityScore: 50,
      },
      {
        periodDate: new Date('2024-01-20T00:00:00Z'),
        issueResolutionSpeed: 4.8,
        reportSubmissionRate: 55,
        issueRecurrenceRate: 35,
        teamProductivityScore: 55,
      },
      {
        periodDate: new Date('2024-01-31T00:00:00Z'),
        issueResolutionSpeed: 4.5,
        reportSubmissionRate: 60,
        issueRecurrenceRate: 20,
        teamProductivityScore: 60,
      },
    ];

    const successCriteria = {
      productivityImprovementRateTarget: 15,
      issueRecurrenceRateReductionTarget: 40,
      deadlineComplianceRateTarget: 90,
    };

    const input: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart,
      aggregationPeriodEnd,
      productivityMetricsDataPoints,
      successCriteria,
      teamId: 'TEAM-001',
      analysisContext: 'Monthly performance review for Q1 2024',
    };

    const result: ProductivityTrendsAnalysisResult = analyzeProductivityTrends(input);

    expect(result.trendDirection).toBe('improving');

    expect(result.successJudgmentResult.productivityAchievementStatus).toBe('達成');
    expect(result.successJudgmentResult.defectReductionAchievementStatus).toBe('達成');
    expect(result.successJudgmentResult.overallJudgment).toBe('成功');

    expect(result.monthlyTrendData).toBeDefined();
    expect(Array.isArray(result.monthlyTrendData)).toBe(true);
    expect(result.monthlyTrendData.length).toBeGreaterThan(0);

    result.monthlyTrendData.forEach((monthData) => {
      expect(monthData.keyword).toBeDefined();
      expect(typeof monthData.keyword).toBe('string');
    });

    expect(result.reportContent).toBeDefined();
    expect(typeof result.reportContent).toBe('string');
    expect(result.reportContent.length).toBeGreaterThan(0);
    expect(result.reportContent).toContain('improving');
    expect(result.reportContent).toContain('成功');
  });
});