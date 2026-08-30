import { analyzeProductivityTrends } from '../../src/logic/productivity-metrics-calculation';
import { type ProductivityTrendsAnalysisInput, type ProductivityTrendsAnalysisResult } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標傾向分析', () => {
  // SCEN-513: 対策実行から29日経過した時点での傾向分析 - データ不足警告を含む
  test('SCEN-513: 対策実行から29日経過時に評価データ不足警告を含むレポートを返す', () => {
    const countermeasureStartDate = new Date('2024-12-01T00:00:00Z');
    const analysisStartDate = new Date('2024-11-02T00:00:00Z'); // 対策実行日から29日前
    const analysisEndDate = new Date('2024-12-30T00:00:00Z'); // 対策実行から29日後

    const productivityMetricsDataPoints = [
      {
        periodDate: new Date('2024-11-30T00:00:00Z'),
        issueResolutionSpeed: 5.2,
        reportSubmissionRate: 85.0,
        issueRecurrenceRate: 12.0,
        teamProductivityScore: 72.0,
      },
      {
        periodDate: new Date('2024-12-07T00:00:00Z'),
        issueResolutionSpeed: 5.0,
        reportSubmissionRate: 87.0,
        issueRecurrenceRate: 11.5,
        teamProductivityScore: 73.5,
      },
      {
        periodDate: new Date('2024-12-14T00:00:00Z'),
        issueResolutionSpeed: 4.8,
        reportSubmissionRate: 89.0,
        issueRecurrenceRate: 11.0,
        teamProductivityScore: 74.5,
      },
      {
        periodDate: new Date('2024-12-21T00:00:00Z'),
        issueResolutionSpeed: 4.7,
        reportSubmissionRate: 90.0,
        issueRecurrenceRate: 10.5,
        teamProductivityScore: 75.0,
      },
      {
        periodDate: new Date('2024-12-28T00:00:00Z'),
        issueResolutionSpeed: 4.6,
        reportSubmissionRate: 91.0,
        issueRecurrenceRate: 10.0,
        teamProductivityScore: 75.5,
      },
    ];

    const successCriteria = {
      productivityImprovementRateTarget: 15,
      issueRecurrenceRateReductionTarget: 30,
      deadlineComplianceRateTarget: 95,
    };

    const analysisContext = `対策実行開始日：${countermeasureStartDate.toISOString().split('T')[0]}`;

    const input: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart: analysisStartDate,
      aggregationPeriodEnd: analysisEndDate,
      productivityMetricsDataPoints,
      successCriteria,
      teamId: 'team-001',
      analysisContext,
    };

    // 関数を呼び出す
    const result: ProductivityTrendsAnalysisResult = analyzeProductivityTrends(input);

    // 結果の検証
    expect(result).toBeDefined();
    expect(result.trendDirection).toBeDefined();
    expect(['improving', 'declining', 'stable']).toContain(result.trendDirection);

    expect(result.monthlyTrendData).toBeDefined();
    expect(Array.isArray(result.monthlyTrendData)).toBe(true);

    expect(result.successJudgmentResult).toBeDefined();
    expect(result.successJudgmentResult.achievementRate).toBeDefined();
    expect(typeof result.successJudgmentResult.achievementRate).toBe('number');

    expect(result.reportContent).toBeDefined();
    expect(typeof result.reportContent).toBe('string');

    // 重要: reportContent に評価データ不足警告が含まれていることを検証
    expect(result.reportContent).toMatch(/評価データが不足しています/);
    expect(result.reportContent).toMatch(/1ヶ月以上経過後の測定をお勧めします/);
  });
});