import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能 - 年をまたぐ集計期間', () => {
  test('SCEN-1595: 集計期間が年をまたぐ場合（12月27日～1月2日）でレポート生成される', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        if (text.includes('再発')) {
          return { keywords: [{ keyword: '再発', frequency: 2 }], confidence: 0.95 };
        } else if (text.includes('対応遅延')) {
          return { keywords: [{ keyword: '対応遅延', frequency: 2 }], confidence: 0.88 };
        } else if (text.includes('システム不具合')) {
          return { keywords: [{ keyword: 'システム不具合', frequency: 1 }], confidence: 0.92 };
        }
        return { keywords: [], confidence: 0 };
      }),
      assessImpactScore: jest.fn(() => ({ impactScore: 75 })),
      classifyIssueSeverity: jest.fn((text: string) => {
        if (text.includes('再発')) {
          return { severity: 'high' };
        } else if (text.includes('対応遅延')) {
          return { severity: 'medium' };
        } else if (text.includes('システム不具合')) {
          return { severity: 'high' };
        }
        return { severity: 'low' };
      }),
    };

    const extractedIssuesData = [
      {
        issueId: 'issue_001',
        keyword: '再発',
        occurrenceCount: 2,
        reportDate: '2024-12-27',
        description: '再発したバグが報告されました。',
      },
      {
        issueId: 'issue_002',
        keyword: '対応遅延',
        occurrenceCount: 2,
        reportDate: '2024-12-27',
        description: '対応遅延が発生しています。',
      },
      {
        issueId: 'issue_003',
        keyword: '対応遅延',
        occurrenceCount: 1,
        reportDate: '2024-12-28',
        description: '別の対応遅延が報告されました。',
      },
      {
        issueId: 'issue_004',
        keyword: 'システム不具合',
        occurrenceCount: 1,
        reportDate: '2025-01-01',
        description: 'システム不具合が確認されました。',
      },
      {
        issueId: 'issue_005',
        keyword: '再発',
        occurrenceCount: 1,
        reportDate: '2025-01-02',
        description: '別の再発が報告されました。',
      },
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-12-27',
      aggregationEndDate: '2025-01-02',
      extractedIssues: extractedIssuesData,
      teamId: 'team_001',
    };

    const report = generateWeeklyAnalysisReport(input, mockTextAnalysisAdapter);

    expect(report).toBeDefined();
    expect(report.reportId).toBeTruthy();
    expect(report.aggregationPeriod.startDate).toBe('2024-12-27');
    expect(report.aggregationPeriod.endDate).toBe('2025-01-02');

    expect(report.issueRanking).toBeDefined();
    expect(Array.isArray(report.issueRanking)).toBe(true);
    expect(report.issueRanking.length).toBeGreaterThan(0);

    const keywordSet = new Set(report.issueRanking.map((r) => r.issueKeyword));
    expect(keywordSet.has('再発')).toBe(true);
    expect(keywordSet.has('対応遅延')).toBe(true);
    expect(keywordSet.has('システム不具合')).toBe(true);

    const reoccurrenceRanked = report.issueRanking.find((r) => r.issueKeyword === '再発');
    expect(reoccurrenceRanked).toBeDefined();
    expect(reoccurrenceRanked!.occurrenceCount).toBe(3);
    expect(typeof reoccurrenceRanked!.rank).toBe('number');
    expect(reoccurrenceRanked!.rank).toBeGreaterThan(0);

    const delayRanked = report.issueRanking.find((r) => r.issueKeyword === '対応遅延');
    expect(delayRanked).toBeDefined();
    expect(delayRanked!.occurrenceCount).toBe(3);

    const bugRanked = report.issueRanking.find((r) => r.issueKeyword === 'システム不具合');
    expect(bugRanked).toBeDefined();
    expect(bugRanked!.occurrenceCount).toBe(1);

    expect(report.priorityScores).toBeDefined();
    expect(Array.isArray(report.priorityScores)).toBe(true);
    expect(report.priorityScores.length).toBeGreaterThan(0);

    const priorityScoresWithHighSeverity = report.priorityScores.filter(
      (ps) => ps.priorityRank === 'high'
    );
    expect(priorityScoresWithHighSeverity.length).toBeGreaterThan(0);

    report.priorityScores.forEach((ps) => {
      expect(ps.issueId).toBeTruthy();
      expect(typeof ps.priorityScore).toBe('number');
      expect(ps.priorityScore).toBeGreaterThanOrEqual(0);
      expect(ps.priorityScore).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low']).toContain(ps.priorityRank);
    });

    expect(report.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(report.recommendedCountermeasures)).toBe(true);

    report.recommendedCountermeasures.forEach((cm) => {
      expect(cm).toBeTruthy();
      expect(typeof cm).toBe('object');
    });

    expect(report.generatedAt).toBeTruthy();
    const generatedDate = new Date(report.generatedAt);
    expect(generatedDate instanceof Date && !isNaN(generatedDate.getTime())).toBe(true);

    const sortedByRank = report.issueRanking
      .slice()
      .sort((a, b) => a.rank - b.rank);
    expect(sortedByRank[0].rank).toBeLessThanOrEqual(sortedByRank[sortedByRank.length - 1].rank);
  });
});