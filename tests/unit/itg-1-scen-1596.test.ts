import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput, WeeklyAnalysisReport, RankedIssue, IssuePriorityData } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - generateWeeklyAnalysisReport', () => {
  // SCEN-1596
  test('should generate weekly analysis report when aggregation period is single day (start date equals end date)', () => {
    // Arrange: Setup single day aggregation period
    const aggregationStartDate = '2026-08-19';
    const aggregationEndDate = '2026-08-19';
    const teamId = 'team-001';

    // Setup extracted issue data for the single day
    const extractedIssues = [
      {
        keyword: '課題A',
        occurrenceCount: 5,
        impactScore: 80,
        severity: 'high' as const,
      },
      {
        keyword: '課題B',
        occurrenceCount: 3,
        impactScore: 60,
        severity: 'medium' as const,
      },
      {
        keyword: '課題C',
        occurrenceCount: 2,
        impactScore: 40,
        severity: 'low' as const,
      },
    ];

    // Create input for the function
    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate,
      aggregationEndDate,
      extractedIssues,
      teamId,
    };

    // Act: Call the function to generate weekly analysis report
    const result = generateWeeklyAnalysisReport(input);

    // Assert: Verify report is generated
    expect(result).not.toBeNull();

    // Verify report has correct aggregation period metadata
    expect(result.aggregationPeriod.startDate).toBe(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toBe(aggregationEndDate);

    // Verify report contains exactly 3 issues
    expect(result.issueRanking).toHaveLength(3);

    // Verify issues are ranked by occurrence count (descending)
    expect(result.issueRanking[0].issueKeyword).toBe('課題A');
    expect(result.issueRanking[0].occurrenceCount).toBe(5);
    expect(result.issueRanking[0].rank).toBe(1);

    expect(result.issueRanking[1].issueKeyword).toBe('課題B');
    expect(result.issueRanking[1].occurrenceCount).toBe(3);
    expect(result.issueRanking[1].rank).toBe(2);

    expect(result.issueRanking[2].issueKeyword).toBe('課題C');
    expect(result.issueRanking[2].occurrenceCount).toBe(2);
    expect(result.issueRanking[2].rank).toBe(3);

    // Verify priority scores are correctly assigned based on impact scores
    expect(result.priorityScores).toHaveLength(3);

    const priorityA = result.priorityScores.find(
      (ps) => ps.issueId === extractedIssues[0].keyword
    );
    expect(priorityA).toBeDefined();
    expect(priorityA?.priorityScore).toBe(80);
    expect(priorityA?.priorityRank).toBe('high');

    const priorityB = result.priorityScores.find(
      (ps) => ps.issueId === extractedIssues[1].keyword
    );
    expect(priorityB).toBeDefined();
    expect(priorityB?.priorityScore).toBe(60);
    expect(priorityB?.priorityRank).toBe('medium');

    const priorityC = result.priorityScores.find(
      (ps) => ps.issueId === extractedIssues[2].keyword
    );
    expect(priorityC).toBeDefined();
    expect(priorityC?.priorityScore).toBe(40);
    expect(priorityC?.priorityRank).toBe('low');

    // Verify report contains recommended countermeasures
    expect(result.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(result.recommendedCountermeasures)).toBe(true);

    // Verify report generated timestamp is in ISO 8601 format
    expect(result.generatedAt).toBeDefined();
    const generatedDate = new Date(result.generatedAt);
    expect(generatedDate.getTime()).toBeGreaterThan(0);
    expect(result.generatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // Verify report ID is generated
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);
  });
});