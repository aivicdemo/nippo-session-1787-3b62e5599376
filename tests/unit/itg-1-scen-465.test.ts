import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import { type MonthlyAnalysisReportResult } from '../../src/logic/monthly-analysis-report';

describe('Monthly Analysis Report Generation', () => {
  test('SCEN-465: Generate monthly analysis report with time-series issue analysis, bottleneck progression, and team performance metrics', async () => {
    // Arrange: Create MonthlyReportGenerationRequest for December 2024
    const request = {
      targetMonth: '2024-12',
      projectManagerId: 'pm-001',
      includeExecutiveSummary: true,
      topChallengesCount: 5,
    };

    const beforeGeneration = new Date();

    // Act: Call generateMonthlyAnalysisReport
    const result: MonthlyAnalysisReportResult = await generateMonthlyAnalysisReport(request);

    const afterGeneration = new Date();

    // Assert: Verify result structure and values
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result.targetMonth).toBe('2024-12');

    expect(result.reportContent).toBeDefined();
    expect(result.reportContent).toHaveProperty('issueTrendAnalysis');
    expect(result.reportContent).toHaveProperty('bottleneckProgression');
    expect(result.reportContent).toHaveProperty('teamPerformanceMetrics');
    expect(result.reportContent).toHaveProperty('topPriorityChallenges');

    expect(Array.isArray(result.reportContent.issueTrendAnalysis)).toBe(true);
    expect(result.reportContent.issueTrendAnalysis.length).toBeGreaterThan(0);

    expect(result.reportContent.bottleneckProgression).toBeDefined();
    expect(Array.isArray(result.reportContent.bottleneckProgression.progressionPatterns)).toBe(true);

    expect(Array.isArray(result.reportContent.teamPerformanceMetrics)).toBe(true);
    expect(result.reportContent.teamPerformanceMetrics.length).toBeGreaterThan(0);

    const firstTeamMetric = result.reportContent.teamPerformanceMetrics[0];
    expect(firstTeamMetric).toHaveProperty('teamId');
    expect(firstTeamMetric).toHaveProperty('issueResolutionSpeedDays');
    expect(typeof firstTeamMetric.issueResolutionSpeedDays).toBe('number');
    expect(firstTeamMetric.issueResolutionSpeedDays).toBeGreaterThanOrEqual(0);
    expect(firstTeamMetric.issueResolutionSpeedDays).toBeLessThanOrEqual(999);

    expect(firstTeamMetric).toHaveProperty('reportSubmissionRate');
    expect(typeof firstTeamMetric.reportSubmissionRate).toBe('number');
    expect(firstTeamMetric.reportSubmissionRate).toBeGreaterThanOrEqual(0);
    expect(firstTeamMetric.reportSubmissionRate).toBeLessThanOrEqual(100);

    expect(firstTeamMetric).toHaveProperty('issueRecurrenceRate');
    expect(typeof firstTeamMetric.issueRecurrenceRate).toBe('number');
    expect(firstTeamMetric.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(firstTeamMetric.issueRecurrenceRate).toBeLessThanOrEqual(100);

    expect(firstTeamMetric).toHaveProperty('priorityScore');
    expect(typeof firstTeamMetric.priorityScore).toBe('number');
    expect(firstTeamMetric.priorityScore).toBeGreaterThanOrEqual(0);
    expect(firstTeamMetric.priorityScore).toBeLessThanOrEqual(100);

    expect(['high', 'medium', 'low']).toContain(firstTeamMetric.performanceRank);

    expect(Array.isArray(result.reportContent.topPriorityChallenges)).toBe(true);
    expect(result.reportContent.topPriorityChallenges.length).toBeLessThanOrEqual(5);
    if (result.reportContent.topPriorityChallenges.length > 0) {
      const firstChallenge = result.reportContent.topPriorityChallenges[0];
      expect(firstChallenge).toHaveProperty('challengeId');
      expect(firstChallenge).toHaveProperty('priorityScore');
      expect(typeof firstChallenge.priorityScore).toBe('number');
    }

    expect(['high', 'medium', 'low']).toContain(result.projectDelayRiskLevel);

    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(result.generatedAt.getTime()).toBeGreaterThanOrEqual(beforeGeneration.getTime());
    expect(result.generatedAt.getTime()).toBeLessThanOrEqual(afterGeneration.getTime() + 1000);
  });
});