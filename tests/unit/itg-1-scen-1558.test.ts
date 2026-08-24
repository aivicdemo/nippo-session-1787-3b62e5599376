import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput, WeeklyAnalysisReport, CountermeasureRecommendation } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - generateWeeklyAnalysisReport', () => {
  // SCEN-1558
  test('generates report with recommendedCountermeasures as mandatory field containing issue patterns, frequency, impact scores, and severity levels', () => {
    const aggregationStartDate = '2024-01-01';
    const aggregationEndDate = '2024-01-28';
    const teamId = 'team-001';

    const extractedIssues = [
      {
        keyword: 'ネットワーク接続エラー',
        frequency: 2,
        impactScore: 75,
        occurrenceWeeks: [1, 3],
      },
      {
        keyword: 'データベース遅延',
        frequency: 1,
        impactScore: 60,
        occurrenceWeeks: [2],
      },
      {
        keyword: 'ビルドプロセス失敗',
        frequency: 1,
        impactScore: 70,
        occurrenceWeeks: [4],
      },
      {
        keyword: 'メモリリーク検出',
        frequency: 1,
        impactScore: 85,
        occurrenceWeeks: [1],
      },
      {
        keyword: 'APIタイムアウト',
        frequency: 1,
        impactScore: 65,
        occurrenceWeeks: [3],
      },
    ];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        if (text.includes('ネットワーク接続エラー')) {
          return { keyword: 'ネットワーク接続エラー', frequency: 2 };
        }
        return { keyword: text, frequency: 1 };
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          'ネットワーク接続エラー': 75,
          'データベース遅延': 60,
          'ビルドプロセス失敗': 70,
          'メモリリーク検出': 85,
          'APIタイムアウト': 65,
        };
        return scoreMap[keyword] || 50;
      }),
      classifyIssueSeverity: jest.fn((keyword: string) => {
        const severityMap: Record<string, 'high' | 'medium' | 'low'> = {
          'ネットワーク接続エラー': 'medium',
          'データベース遅延': 'low',
          'ビルドプロセス失敗': 'medium',
          'メモリリーク検出': 'high',
          'APIタイムアウト': 'medium',
        };
        return severityMap[keyword] || 'low';
      }),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate,
      aggregationEndDate,
      extractedIssues,
      teamId,
    };

    const report: WeeklyAnalysisReport = generateWeeklyAnalysisReport(
      input,
      mockTextAnalysisAdapter as any
    );

    expect(report).toBeDefined();
    expect(report.reportId).toBeDefined();
    expect(typeof report.reportId).toBe('string');
    expect(report.reportId.length).toBeGreaterThan(0);

    expect(report.aggregationPeriod).toBeDefined();
    expect(report.aggregationPeriod.startDate).toBe(aggregationStartDate);
    expect(report.aggregationPeriod.endDate).toBe(aggregationEndDate);

    expect(report.issueRanking).toBeDefined();
    expect(Array.isArray(report.issueRanking)).toBe(true);
    expect(report.issueRanking.length).toBeGreaterThan(0);

    expect(report.issueRanking[0].issueKeyword).toBe('ネットワーク接続エラー');
    expect(report.issueRanking[0].occurrenceCount).toBe(2);
    expect(report.issueRanking[0].rank).toBe(1);

    expect(report.priorityScores).toBeDefined();
    expect(Array.isArray(report.priorityScores)).toBe(true);
    expect(report.priorityScores.length).toBeGreaterThan(0);

    const networkErrorPriority = report.priorityScores.find(
      (p) => p.issueId === 'ネットワーク接続エラー'
    );
    expect(networkErrorPriority).toBeDefined();
    expect(networkErrorPriority!.priorityScore).toBe(75);
    expect(networkErrorPriority!.priorityRank).toBe('high');

    expect(report.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(report.recommendedCountermeasures)).toBe(true);
    expect(report.recommendedCountermeasures.length).toBeGreaterThan(0);

    const networkErrorCountermeasure = report.recommendedCountermeasures.find(
      (cm) => cm.issuePattern === 'ネットワーク接続エラー'
    );
    expect(networkErrorCountermeasure).toBeDefined();

    const cm = networkErrorCountermeasure!;
    expect(cm.issuePattern).toBe('ネットワーク接続エラー');
    expect(cm.frequency).toBe(2);
    expect(cm.impactScore).toBe(75);
    expect(typeof cm.suggestedAction).toBe('string');
    expect(cm.suggestedAction.length).toBeGreaterThan(0);
    expect(cm.severity).toBe('medium');

    expect(report.generatedAt).toBeDefined();
    expect(typeof report.generatedAt).toBe('string');
    const generatedDate = new Date(report.generatedAt);
    expect(generatedDate.getTime()).toBeGreaterThan(0);
  });
});