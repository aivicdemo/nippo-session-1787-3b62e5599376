import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput, WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report - Impact Score Reflection', () => {
  // SCEN-1561
  test('should reflect impact scores from TextAnalysisServiceAdapter as priority scores in generated report', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Mock assessImpactScore to return specific impact scores for each issue
    mockTextAnalysisAdapter.assessImpactScore
      .mockResolvedValueOnce(75) // First issue: impact score 75
      .mockResolvedValueOnce(60) // Second issue: impact score 60
      .mockResolvedValueOnce(90); // Third issue: impact score 90

    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-14T23:59:59Z');

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          keyword: 'Database connection timeout',
          occurrenceCount: 3,
          impactLevel: 'high',
        },
        {
          keyword: 'API rate limiting',
          occurrenceCount: 2,
          impactLevel: 'medium',
        },
        {
          keyword: 'Memory leak in cache',
          occurrenceCount: 1,
          impactLevel: 'critical',
        },
      ],
      teamId: 'team-001',
    };

    const report: WeeklyAnalysisReport = await generateWeeklyAnalysisReport(
      input,
      mockTextAnalysisAdapter,
    );

    expect(report).toBeDefined();
    expect(report.aggregationPeriod).toEqual({
      startDate: '2024-01-08',
      endDate: '2024-01-14',
    });

    expect(report.priorityScores).toBeDefined();
    expect(Array.isArray(report.priorityScores)).toBe(true);
    expect(report.priorityScores.length).toBe(3);

    // Verify first issue priority score matches impact score 75
    const firstIssuePriority = report.priorityScores.find(
      (ps) => ps.issueId === 'issue-001' || ps.issueId === report.issueRanking[0].issueKeyword,
    );
    expect(firstIssuePriority?.priorityScore).toBe(75);

    // Verify second issue priority score matches impact score 60
    const secondIssuePriority = report.priorityScores.find(
      (ps) => ps.issueId === 'issue-002' || ps.issueId === report.issueRanking[1].issueKeyword,
    );
    expect(secondIssuePriority?.priorityScore).toBe(60);

    // Verify third issue priority score matches impact score 90
    const thirdIssuePriority = report.priorityScores.find(
      (ps) => ps.issueId === 'issue-003' || ps.issueId === report.issueRanking[2].issueKeyword,
    );
    expect(thirdIssuePriority?.priorityScore).toBe(90);

    // Verify all priority scores are within valid range (0-100)
    report.priorityScores.forEach((priorityData) => {
      expect(priorityData.priorityScore).toBeGreaterThanOrEqual(0);
      expect(priorityData.priorityScore).toBeLessThanOrEqual(100);
      expect(typeof priorityData.priorityScore).toBe('number');
    });

    // Verify priority ranks are assigned correctly based on scores
    const sortedByScore = [...report.priorityScores].sort(
      (a, b) => b.priorityScore - a.priorityScore,
    );
    expect(report.priorityScores[0].priorityScore).toBe(90); // Highest score
    expect(report.priorityScores[1].priorityScore).toBe(75); // Middle score
    expect(report.priorityScores[2].priorityScore).toBe(60); // Lowest score

    // Verify priority rank enums are properly set
    report.priorityScores.forEach((priorityData) => {
      expect(['high', 'medium', 'low']).toContain(priorityData.priorityRank);
    });

    // Verify assessImpactScore was called for each issue
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(3);

    // Verify report contains issue ranking
    expect(report.issueRanking).toBeDefined();
    expect(Array.isArray(report.issueRanking)).toBe(true);

    // Verify report generation timestamp
    expect(report.generatedAt).toBeDefined();
    const generatedAtDate = new Date(report.generatedAt);
    expect(generatedAtDate.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);

    // Verify recommended countermeasures exist
    expect(report.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(report.recommendedCountermeasures)).toBe(true);

    // Verify report structure contains all required fields
    expect(report.reportId).toBeDefined();
    expect(typeof report.reportId).toBe('string');
  });
});