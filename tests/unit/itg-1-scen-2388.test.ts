import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport, type TextAnalysisServiceAdapter } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-2388
  test('should sort issues by impact score in ascending order when input list is in reverse order', () => {
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: '課題B', frequency: 5 },
          { keyword: '課題C', frequency: 3 },
          { keyword: '課題A', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          '課題A': 30,
          '課題B': 85,
          '課題C': 55,
        };
        return scoreMap[keyword] || 0;
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue('medium'),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          keyword: '課題B',
          occurrenceCount: 5,
          impactScore: 85,
        },
        {
          keyword: '課題C',
          occurrenceCount: 3,
          impactScore: 55,
        },
        {
          keyword: '課題A',
          occurrenceCount: 2,
          impactScore: 30,
        },
      ],
      teamId: 'team-001',
    };

    const result: WeeklyAnalysisReport = generateWeeklyAnalysisReport(
      input,
      mockTextAnalysisAdapter,
    );

    expect(result.aggregationPeriod.startDate).toBe('2024-01-08');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-14');
    expect(result.issueRanking.length).toBe(3);

    expect(result.issueRanking[0].issueKeyword).toBe('課題A');
    expect(result.issueRanking[0].occurrenceCount).toBe(2);
    expect(result.issueRanking[0].rank).toBe(1);

    expect(result.issueRanking[1].issueKeyword).toBe('課題C');
    expect(result.issueRanking[1].occurrenceCount).toBe(3);
    expect(result.issueRanking[1].rank).toBe(2);

    expect(result.issueRanking[2].issueKeyword).toBe('課題B');
    expect(result.issueRanking[2].occurrenceCount).toBe(5);
    expect(result.issueRanking[2].rank).toBe(3);

    expect(result.priorityScores.length).toBe(3);

    expect(result.priorityScores[0].priorityScore).toBe(30);
    expect(result.priorityScores[0].priorityRank).toBe('low');

    expect(result.priorityScores[1].priorityScore).toBe(55);
    expect(result.priorityScores[1].priorityRank).toBe('medium');

    expect(result.priorityScores[2].priorityScore).toBe(85);
    expect(result.priorityScores[2].priorityRank).toBe('high');

    expect(result.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(result.recommendedCountermeasures)).toBe(true);
    expect(result.generatedAt).toBeDefined();
  });
});