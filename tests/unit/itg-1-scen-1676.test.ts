import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1676
  test('should generate weekly analysis report with correct impact scores when TextAnalysisServiceAdapter responds normally', () => {
    // Arrange: TextAnalysisServiceAdapter stub initialization
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム障害', 'データベース接続エラー'],
        frequencies: [3, 2],
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        if (keyword === 'システム障害') {
          return Promise.resolve(75);
        }
        if (keyword === 'データベース接続エラー') {
          return Promise.resolve(60);
        }
        return Promise.resolve(0);
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const reportInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          issueKeyword: 'システム障害',
          occurrenceCount: 3,
          impactScore: 0,
        },
        {
          issueKeyword: 'データベース接続エラー',
          occurrenceCount: 2,
          impactScore: 0,
        },
      ],
      teamId: 'team-001',
    };

    // Act: Execute weekly issue analysis report generation
    const report = generateWeeklyAnalysisReport(
      reportInput,
      mockTextAnalysisServiceAdapter
    );

    // Assert: Verify TextAnalysisServiceAdapter.assessImpactScore was called
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();

    // Assert: Verify generated report contains expected impact scores
    expect(report).toBeDefined();
    expect(report.reportId).toBeDefined();
    expect(report.aggregationPeriod.startDate).toBe('2024-01-08');
    expect(report.aggregationPeriod.endDate).toBe('2024-01-14');

    // Assert: Verify priority scores include exact impact scores
    expect(report.priorityScores).toHaveLength(2);

    const systemFailureScore = report.priorityScores.find(
      (ps) => ps.issueId === 'システム障害'
    );
    expect(systemFailureScore).toBeDefined();
    expect(systemFailureScore!.priorityScore).toBe(75);
    expect(systemFailureScore!.priorityRank).toBe('high');

    const dbConnectionScore = report.priorityScores.find(
      (ps) => ps.issueId === 'データベース接続エラー'
    );
    expect(dbConnectionScore).toBeDefined();
    expect(dbConnectionScore!.priorityScore).toBe(60);
    expect(dbConnectionScore!.priorityRank).toBe('medium');

    // Assert: Verify issue ranking is ordered by occurrence count
    expect(report.issueRanking).toHaveLength(2);
    expect(report.issueRanking[0].issueKeyword).toBe('システム障害');
    expect(report.issueRanking[0].occurrenceCount).toBe(3);
    expect(report.issueRanking[0].rank).toBe(1);
    expect(report.issueRanking[1].issueKeyword).toBe('データベース接続エラー');
    expect(report.issueRanking[1].occurrenceCount).toBe(2);
    expect(report.issueRanking[1].rank).toBe(2);

    // Assert: Verify report contains recommended countermeasures
    expect(report.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(report.recommendedCountermeasures)).toBe(true);

    // Assert: Verify impact determination status is complete
    expect(report.generatedAt).toBeDefined();
  });
});