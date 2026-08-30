import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';

describe('月次分析レポート生成', () => {
  // SCEN-451: [normal] 毎月初に前月の全日報データを抽出し、課題の時系列変化・ボトルネック推移・チーム別パフォーマンス指標を分析してレポートを生成し、プロジェクトマネージャーに通知する。 - analyzeBottleneckTrendWithTimeSeriesが設計された計算式の代表値を返す
  test('当月の日報から課題を抽出・分類し、時系列分析と優先度判定により設計された代表値を返す', () => {
    const monthlyReportData = [
      {
        date: '2024-01-15',
        reporterId: 'user-001',
        issueCategory: 'バグ',
        issueDescription: 'ログイン画面でセッション切れ',
        severity: 4,
      },
      {
        date: '2024-01-16',
        reporterId: 'user-002',
        issueCategory: 'バグ',
        issueDescription: 'ユーザー削除時のエラー',
        severity: 3,
      },
      {
        date: '2024-01-20',
        reporterId: 'user-003',
        issueCategory: 'パフォーマンス',
        issueDescription: 'レポート生成時の遅延',
        severity: 5,
      },
      {
        date: '2024-01-22',
        reporterId: 'user-001',
        issueCategory: 'バグ',
        issueDescription: 'ログイン画面でセッション切れ（再発）',
        severity: 4,
      },
    ];

    const previousMonthData = [
      { issueCategory: 'バグ', frequency: 1, resolutionRate: 100 },
      { issueCategory: 'パフォーマンス', frequency: 0, resolutionRate: 0 },
    ];

    const issueResolutionLog = [
      { issueId: 'issue-001', resolvedDate: '2024-01-18', resolutionDays: 3 },
      { issueId: 'issue-003', resolvedDate: '2024-01-24', resolutionDays: 4 },
    ];

    const result = generateMonthlyAnalysisReport(
      monthlyReportData,
      previousMonthData,
      issueResolutionLog
    );

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    const bugCategory = result.find(
      (item: any) => item.issueCategory === 'バグ'
    );
    expect(bugCategory).toBeDefined();
    expect(bugCategory.currentFrequency).toBe(2);
    expect(bugCategory.frequencyTrend).toBe('増加');
    expect(bugCategory.impactScore).toBeGreaterThan(0);
    expect(bugCategory.impactScore).toBeLessThanOrEqual(100);
    expect(bugCategory.resolutionRate).toBe(50);
    expect(bugCategory.bottleneckRank).toBe(2);
    expect(bugCategory.improvementTrend).toBe('悪化中');
    expect(bugCategory.recommendedAction).toBe('即座に対応が必要');

    const performanceCategory = result.find(
      (item: any) => item.issueCategory === 'パフォーマンス'
    );
    expect(performanceCategory).toBeDefined();
    expect(performanceCategory.currentFrequency).toBe(1);
    expect(performanceCategory.frequencyTrend).toBe('増加');
    expect(performanceCategory.impactScore).toBeGreaterThan(0);
    expect(performanceCategory.impactScore).toBeLessThanOrEqual(100);
    expect(performanceCategory.resolutionRate).toBe(100);
    expect(performanceCategory.bottleneckRank).toBe(3);
    expect(performanceCategory.improvementTrend).toBe('改善中');
    expect(performanceCategory.recommendedAction).toBe('継続監視');
  });
});