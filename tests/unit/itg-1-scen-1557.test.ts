import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能 - 優先度スコア検証', () => {
  // SCEN-1557
  test('レポートに優先度スコアが必須項目として含まれて生成される', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn((text: string) => {
        return [
          { keyword: 'API遅延', frequency: 3 },
          { keyword: 'DB接続エラー', frequency: 2 },
          { keyword: 'メモリリーク', frequency: 1 },
        ];
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          'API遅延': 85,
          'DB接続エラー': 72,
          'メモリリーク': 45,
        };
        return scoreMap[keyword] || 50;
      }),
      classifyIssueSeverity: jest.fn((text: string) => {
        return 'high';
      }),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          keywordId: 'issue-1',
          keyword: 'API遅延',
          occurrenceCount: 3,
          impactScore: 85,
        },
        {
          keywordId: 'issue-2',
          keyword: 'DB接続エラー',
          occurrenceCount: 2,
          impactScore: 72,
        },
        {
          keywordId: 'issue-3',
          keyword: 'メモリリーク',
          occurrenceCount: 1,
          impactScore: 45,
        },
      ],
      teamId: 'team-001',
    };

    const report = generateWeeklyAnalysisReport(input, mockTextAnalysisServiceAdapter);

    expect(report).toBeDefined();
    expect(report.reportId).toBeDefined();
    expect(typeof report.reportId).toBe('string');

    expect(report.aggregationPeriod).toEqual({
      startDate: '2024-01-08',
      endDate: '2024-01-14',
    });

    expect(report.priorityScores).toBeDefined();
    expect(Array.isArray(report.priorityScores)).toBe(true);
    expect(report.priorityScores.length).toBe(3);

    report.priorityScores.forEach((priorityData) => {
      expect(priorityData.issueId).toBeDefined();
      expect(typeof priorityData.issueId).toBe('string');

      expect(priorityData.priorityScore).toBeDefined();
      expect(typeof priorityData.priorityScore).toBe('number');
      expect(priorityData.priorityScore).toBeGreaterThanOrEqual(0);
      expect(priorityData.priorityScore).toBeLessThanOrEqual(100);
      expect(Number.isInteger(priorityData.priorityScore)).toBe(true);

      expect(priorityData.priorityRank).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(priorityData.priorityRank);

      expect(priorityData.priorityScore).not.toBeNull();
      expect(priorityData.priorityScore).not.toBeUndefined();
    });

    const priorityScoresCheck = report.priorityScores.every(
      (ps) => ps.priorityScore !== null && ps.priorityScore !== undefined
    );
    expect(priorityScoresCheck).toBe(true);

    expect(report.priorityScores[0].priorityScore).toBe(85);
    expect(report.priorityScores[0].priorityRank).toBe('high');

    expect(report.priorityScores[1].priorityScore).toBe(72);
    expect(report.priorityScores[1].priorityRank).toBe('high');

    expect(report.priorityScores[2].priorityScore).toBe(45);
    expect(report.priorityScores[2].priorityRank).toBe('medium');

    expect(report.issueRanking).toBeDefined();
    expect(Array.isArray(report.issueRanking)).toBe(true);
    expect(report.issueRanking[0].issueKeyword).toBe('API遅延');
    expect(report.issueRanking[0].occurrenceCount).toBe(3);
    expect(report.issueRanking[0].rank).toBe(1);

    expect(report.issueRanking[1].issueKeyword).toBe('DB接続エラー');
    expect(report.issueRanking[1].occurrenceCount).toBe(2);
    expect(report.issueRanking[1].rank).toBe(2);

    expect(report.issueRanking[2].issueKeyword).toBe('メモリリーク');
    expect(report.issueRanking[2].occurrenceCount).toBe(1);
    expect(report.issueRanking[2].rank).toBe(3);

    expect(report.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(report.recommendedCountermeasures)).toBe(true);

    expect(report.generatedAt).toBeDefined();
    expect(typeof report.generatedAt).toBe('string');
    const generatedDate = new Date(report.generatedAt);
    expect(generatedDate instanceof Date && !isNaN(generatedDate.getTime())).toBe(
      true
    );
  });
});