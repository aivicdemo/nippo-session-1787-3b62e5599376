import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport, type RankedIssue } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能 - 優先度スコア同値時の順序一貫性', () => {
  // SCEN-1597
  test('優先度スコアが同値である複数課題が一貫した順序で表示されること', () => {
    // テスト用入力データを構築
    const testAggregationStartDate = '2024-01-08';
    const testAggregationEndDate = '2024-01-14';
    const testTeamId = 'team-001';

    // 優先度スコアが同一値（75）を持つ3つの課題を作成
    const testExtractedIssuesWithSameScore = [
      {
        issueId: 'issue-001-a',
        issueKeyword: 'Database Connection',
        occurrenceFrequency: 4,
        impactScore: 75,
        createdAt: new Date('2024-01-08T09:00:00Z'),
      },
      {
        issueId: 'issue-001-b',
        issueKeyword: 'API Response Timeout',
        occurrenceFrequency: 4,
        impactScore: 75,
        createdAt: new Date('2024-01-09T10:00:00Z'),
      },
      {
        issueId: 'issue-001-c',
        issueKeyword: 'Memory Leak',
        occurrenceFrequency: 4,
        impactScore: 75,
        createdAt: new Date('2024-01-10T11:00:00Z'),
      },
    ];

    // 第1回目のレポート生成実行
    const reportInput1: WeeklyAnalysisReportInput = {
      aggregationStartDate: testAggregationStartDate,
      aggregationEndDate: testAggregationEndDate,
      extractedIssues: testExtractedIssuesWithSameScore,
      teamId: testTeamId,
    };

    const report1: WeeklyAnalysisReport = generateWeeklyAnalysisReport(reportInput1);

    // 第1回目のランキング順序を記録
    const firstRunRanking: string[] = report1.issueRanking.map(
      (issue: RankedIssue) => issue.issueKeyword
    );

    // 第2回目のレポート生成実行（同じ入力データで）
    const report2: WeeklyAnalysisReport = generateWeeklyAnalysisReport(reportInput1);

    // 第2回目のランキング順序を記録
    const secondRunRanking: string[] = report2.issueRanking.map(
      (issue: RankedIssue) => issue.issueKeyword
    );

    // 第3回目のレポート生成実行（同じ入力データで）
    const report3: WeeklyAnalysisReport = generateWeeklyAnalysisReport(reportInput1);

    // 第3回目のランキング順序を記録
    const thirdRunRanking: string[] = report3.issueRanking.map(
      (issue: RankedIssue) => issue.issueKeyword
    );

    // 期待結果: すべてのランキングが同一の順序を保つこと
    // 優先度スコアが同値なため、確定的な順序付けアルゴリズム（issueId昇順）が適用される
    expect(firstRunRanking).toEqual(['Database Connection', 'API Response Timeout', 'Memory Leak']);
    expect(secondRunRanking).toEqual(firstRunRanking);
    expect(thirdRunRanking).toEqual(firstRunRanking);

    // さらに、priorityScores内の優先度が正しく維持されていることを確認
    const firstPriorityScores = report1.priorityScores.map((ps) => ({
      issueId: ps.issueId,
      priorityScore: ps.priorityScore,
      priorityRank: ps.priorityRank,
    }));

    const secondPriorityScores = report2.priorityScores.map((ps) => ({
      issueId: ps.issueId,
      priorityScore: ps.priorityScore,
      priorityRank: ps.priorityRank,
    }));

    const thirdPriorityScores = report3.priorityScores.map((ps) => ({
      issueId: ps.issueId,
      priorityScore: ps.priorityScore,
      priorityRank: ps.priorityRank,
    }));

    // すべてのランが同じ優先度スコア配列を返すこと
    expect(firstPriorityScores).toEqual(secondPriorityScores);
    expect(secondPriorityScores).toEqual(thirdPriorityScores);

    // 各レポートのreportIdが異なること（新規生成ごとに一意のIDが付与される）
    expect(report1.reportId).not.toBe(report2.reportId);
    expect(report2.reportId).not.toBe(report3.reportId);

    // aggregationPeriodが正しく設定されていること
    expect(report1.aggregationPeriod.startDate).toBe(testAggregationStartDate);
    expect(report1.aggregationPeriod.endDate).toBe(testAggregationEndDate);
    expect(report2.aggregationPeriod.startDate).toBe(testAggregationStartDate);
    expect(report2.aggregationPeriod.endDate).toBe(testAggregationEndDate);
    expect(report3.aggregationPeriod.startDate).toBe(testAggregationStartDate);
    expect(report3.aggregationPeriod.endDate).toBe(testAggregationEndDate);

    // すべてのランキング結果に3つの課題が含まれていること
    expect(report1.issueRanking).toHaveLength(3);
    expect(report2.issueRanking).toHaveLength(3);
    expect(report3.issueRanking).toHaveLength(3);

    // すべてのランキング結果で同じ優先度スコアが保持されていること
    report1.issueRanking.forEach((issue: RankedIssue) => {
      expect(issue.occurrenceCount).toBe(4);
    });

    report2.issueRanking.forEach((issue: RankedIssue) => {
      expect(issue.occurrenceCount).toBe(4);
    });

    report3.issueRanking.forEach((issue: RankedIssue) => {
      expect(issue.occurrenceCount).toBe(4);
    });
  });
});