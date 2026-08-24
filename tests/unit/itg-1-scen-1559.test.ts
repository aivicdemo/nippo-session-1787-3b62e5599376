import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type {
  WeeklyAnalysisReportInput,
  WeeklyAnalysisReport,
  ExtractedIssueData,
} from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1559
  test('should generate identical report content on repeated execution with same input data', () => {
    // Arrange: Prepare test data for 5 days of the previous week (Monday-Friday)
    const aggregationStartDate = '2024-01-08';
    const aggregationEndDate = '2024-01-12';
    const teamId = 'team-001';

    // Mock extracted issues data with realistic frequency and impact scores
    const extractedIssuesInput: ExtractedIssueData[] = [
      {
        issueKeyword: 'database_performance',
        occurrenceCount: 3,
        impactScore: 85,
        affectedTeamMembers: ['user-001', 'user-002', 'user-003'],
      },
      {
        issueKeyword: 'api_timeout',
        occurrenceCount: 2,
        impactScore: 72,
        affectedTeamMembers: ['user-002', 'user-004'],
      },
      {
        issueKeyword: 'deployment_delay',
        occurrenceCount: 1,
        impactScore: 45,
        affectedTeamMembers: ['user-005'],
      },
    ];

    const reportInput: WeeklyAnalysisReportInput = {
      aggregationStartDate,
      aggregationEndDate,
      extractedIssues: extractedIssuesInput,
      teamId,
    };

    // Act: First execution
    const report1: WeeklyAnalysisReport = generateWeeklyAnalysisReport(reportInput);

    // Assert: Verify first report structure
    expect(report1.reportId).toBeDefined();
    expect(report1.aggregationPeriod.startDate).toBe(aggregationStartDate);
    expect(report1.aggregationPeriod.endDate).toBe(aggregationEndDate);
    expect(report1.issueRanking).toBeDefined();
    expect(report1.issueRanking.length).toBeGreaterThan(0);
    expect(report1.priorityScores).toBeDefined();
    expect(report1.recommendedCountermeasures).toBeDefined();
    expect(report1.generatedAt).toBeDefined();

    // Extract first report content for comparison
    const report1Keywords = report1.issueRanking.map((issue) => issue.issueKeyword).sort();
    const report1ScoresMap = new Map(
      report1.priorityScores.map((ps) => [ps.issueId, ps.priorityScore])
    );
    const report1RanksMap = new Map(
      report1.priorityScores.map((ps) => [ps.issueId, ps.priorityRank])
    );

    // Act: Second execution with identical input
    const report2: WeeklyAnalysisReport = generateWeeklyAnalysisReport(reportInput);

    // Extract second report content for comparison
    const report2Keywords = report2.issueRanking.map((issue) => issue.issueKeyword).sort();
    const report2ScoresMap = new Map(
      report2.priorityScores.map((ps) => [ps.issueId, ps.priorityScore])
    );
    const report2RanksMap = new Map(
      report2.priorityScores.map((ps) => [ps.issueId, ps.priorityRank])
    );

    // Assert: Content Comparison 1 - Issue Keywords
    expect(report1Keywords).toEqual(report2Keywords);
    expect(report1.issueRanking.length).toBe(report2.issueRanking.length);

    // Assert: Content Comparison 2 - Impact Scores
    report1.issueRanking.forEach((issue1, index) => {
      const issue2 = report2.issueRanking[index];
      expect(issue1.issueKeyword).toBe(issue2.issueKeyword);
      expect(issue1.occurrenceCount).toBe(issue2.occurrenceCount);
      expect(issue1.rank).toBe(issue2.rank);

      const score1 = report1.priorityScores.find((ps) => ps.issueId === issue1.issueKeyword);
      const score2 = report2.priorityScores.find((ps) => ps.issueId === issue2.issueKeyword);
      expect(score1?.priorityScore).toBe(score2?.priorityScore);
    });

    // Assert: Content Comparison 3 - Issue Classification (Priority Rank)
    expect(report1.priorityScores.length).toBe(report2.priorityScores.length);
    report1.priorityScores.forEach((priorityData1) => {
      const matchingData2 = report2.priorityScores.find(
        (ps) => ps.issueId === priorityData1.issueId
      );
      expect(matchingData2).toBeDefined();
      expect(matchingData2?.priorityScore).toBe(priorityData1.priorityScore);
      expect(matchingData2?.priorityRank).toBe(priorityData1.priorityRank);
    });

    // Assert: Verify deterministic output - JSON serialization should match
    const report1Json = JSON.stringify({
      aggregationPeriod: report1.aggregationPeriod,
      issueRanking: report1.issueRanking,
      priorityScores: report1.priorityScores,
    });
    const report2Json = JSON.stringify({
      aggregationPeriod: report2.aggregationPeriod,
      issueRanking: report2.issueRanking,
      priorityScores: report2.priorityScores,
    });
    expect(report1Json).toBe(report2Json);
  });
});