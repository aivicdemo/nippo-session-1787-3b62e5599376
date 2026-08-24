import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput, WeeklyAnalysisReport, RankedIssue, IssuePriorityData } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1554
  test('should generate unified format weekly analysis report with multiple extracted issues from prior week reports', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        const keywordMap: { [key: string]: { keyword: string; frequency: number }[] } = {
          'APIレスポンス遅延': [{ keyword: 'APIレスポンス遅延', frequency: 2 }],
          'テストデータ不足': [{ keyword: 'テストデータ不足', frequency: 2 }],
          'ドキュメント未更新': [{ keyword: 'ドキュメント未更新', frequency: 1 }],
        };
        for (const [key, value] of Object.entries(keywordMap)) {
          if (text.includes(key)) {
            return value;
          }
        }
        return [];
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: { [key: string]: number } = {
          'APIレスポンス遅延': 75,
          'テストデータ不足': 45,
          'ドキュメント未更新': 30,
        };
        return scoreMap[keyword] ?? 0;
      }),
      classifyIssueSeverity: jest.fn((keyword: string) => {
        const severityMap: { [key: string]: 'high' | 'medium' | 'low' } = {
          'APIレスポンス遅延': 'high',
          'テストデータ不足': 'medium',
          'ドキュメント未更新': 'low',
        };
        return severityMap[keyword] ?? 'low';
      }),
    };

    const extractedIssueData = [
      {
        issueKeyword: 'APIレスポンス遅延',
        occurrenceCount: 2,
        impactScore: 75,
      },
      {
        issueKeyword: 'テストデータ不足',
        occurrenceCount: 2,
        impactScore: 45,
      },
      {
        issueKeyword: 'ドキュメント未更新',
        occurrenceCount: 1,
        impactScore: 30,
      },
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-15',
      aggregationEndDate: '2024-01-21',
      extractedIssues: extractedIssueData,
      teamId: 'team-001',
    };

    const report = generateWeeklyAnalysisReport(input, mockTextAnalysisAdapter);

    expect(report).toBeDefined();
    expect(report.reportId).toBeDefined();
    expect(typeof report.reportId).toBe('string');

    expect(report.aggregationPeriod.startDate).toBe('2024-01-15');
    expect(report.aggregationPeriod.endDate).toBe('2024-01-21');

    expect(Array.isArray(report.issueRanking)).toBe(true);
    expect(report.issueRanking.length).toBe(3);

    expect(report.issueRanking[0].issueKeyword).toBe('APIレスポンス遅延');
    expect(report.issueRanking[0].occurrenceCount).toBe(2);
    expect(report.issueRanking[0].rank).toBe(1);

    expect(report.issueRanking[1].issueKeyword).toBe('テストデータ不足');
    expect(report.issueRanking[1].occurrenceCount).toBe(2);
    expect(report.issueRanking[1].rank).toBe(2);

    expect(report.issueRanking[2].issueKeyword).toBe('ドキュメント未更新');
    expect(report.issueRanking[2].occurrenceCount).toBe(1);
    expect(report.issueRanking[2].rank).toBe(3);

    expect(Array.isArray(report.priorityScores)).toBe(true);
    expect(report.priorityScores.length).toBe(3);

    const priorityScoreForIssueA = report.priorityScores.find(
      (ps) => ps.issueId === 'APIレスポンス遅延'
    );
    expect(priorityScoreForIssueA).toBeDefined();
    expect(priorityScoreForIssueA?.priorityScore).toBe(75);
    expect(priorityScoreForIssueA?.priorityRank).toBe('high');

    const priorityScoreForIssueB = report.priorityScores.find(
      (ps) => ps.issueId === 'テストデータ不足'
    );
    expect(priorityScoreForIssueB).toBeDefined();
    expect(priorityScoreForIssueB?.priorityScore).toBe(45);
    expect(priorityScoreForIssueB?.priorityRank).toBe('medium');

    const priorityScoreForIssueC = report.priorityScores.find(
      (ps) => ps.issueId === 'ドキュメント未更新'
    );
    expect(priorityScoreForIssueC).toBeDefined();
    expect(priorityScoreForIssueC?.priorityScore).toBe(30);
    expect(priorityScoreForIssueC?.priorityRank).toBe('low');

    expect(Array.isArray(report.recommendedCountermeasures)).toBe(true);

    expect(report.generatedAt).toBeDefined();
    const generatedDate = new Date(report.generatedAt);
    expect(generatedDate.toString()).not.toBe('Invalid Date');
  });
});