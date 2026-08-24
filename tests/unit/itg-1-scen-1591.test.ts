import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput, WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - Priority Scoring and Ranking', () => {
  test('SCEN-1591: top 3 issues ranked by highest priority score (100 points) are sorted and displayed at ranking head', () => {
    const extractedIssues = [
      {
        keyword: 'サーバーダウン',
        occurrenceCount: 5,
        impactScore: 100,
      },
      {
        keyword: 'ドキュメント未更新',
        occurrenceCount: 3,
        impactScore: 85,
      },
      {
        keyword: 'テスト漏れ',
        occurrenceCount: 4,
        impactScore: 100,
      },
      {
        keyword: 'コミュニケーション遅延',
        occurrenceCount: 2,
        impactScore: 60,
      },
      {
        keyword: 'デプロイ失敗',
        occurrenceCount: 5,
        impactScore: 100,
      },
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues,
      teamId: 'team-001',
    };

    const result: WeeklyAnalysisReport = generateWeeklyAnalysisReport(input);

    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^report-/);

    expect(result.aggregationPeriod.startDate).toBe('2024-01-08');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-14');

    expect(result.issueRanking).toBeDefined();
    expect(result.issueRanking.length).toBeGreaterThanOrEqual(3);

    const topThreeIssues = result.issueRanking.slice(0, 3);

    topThreeIssues.forEach((issue) => {
      expect(issue.priorityScore).toBe(100);
    });

    expect(topThreeIssues[0].rank).toBe(1);
    expect(topThreeIssues[1].rank).toBe(2);
    expect(topThreeIssues[2].rank).toBe(3);

    const topThreeKeywords = topThreeIssues.map((i) => i.issueKeyword);
    expect(
      topThreeKeywords.includes('サーバーダウン') &&
        topThreeKeywords.includes('テスト漏れ') &&
        topThreeKeywords.includes('デプロイ失敗')
    ).toBe(true);

    if (result.issueRanking.length > 3) {
      const belowTopThree = result.issueRanking.slice(3);
      belowTopThree.forEach((issue) => {
        expect(issue.priorityScore).toBeLessThanOrEqual(85);
      });
    }

    expect(result.priorityScores).toBeDefined();
    expect(result.priorityScores.length).toBeGreaterThanOrEqual(3);

    const topThreePriorityData = result.priorityScores.filter(
      (ps) =>
        topThreeKeywords.includes(
          result.issueRanking.find((ir) => ir.issueKeyword === ps.issueId)
            ?.issueKeyword || ''
        )
    );

    topThreePriorityData.forEach((priorityData) => {
      expect(priorityData.priorityScore).toBe(100);
      expect(priorityData.priorityRank).toBe('high');
    });

    expect(result.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(result.recommendedCountermeasures)).toBe(true);

    expect(result.generatedAt).toBeDefined();
    expect(typeof result.generatedAt).toBe('string');
    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});