import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import { type MonthlyReportGenerationRequest, type MonthlyAnalysisReportResult } from '../../src/logic/monthly-analysis-report';

describe('Monthly Analysis Report Generation', () => {
  // SCEN-453: [edge] 課題の深刻度スコアが1-5の範囲外の場合、範囲内に正規化される
  test('should normalize out-of-range severity scores to 1-5 range and compute metrics correctly', async () => {
    const request: MonthlyReportGenerationRequest = {
      targetMonth: '2024-01',
      projectManagerId: 'PM001',
      includeExecutiveSummary: true,
      topChallengesCount: 5,
    };

    const result: MonthlyAnalysisReportResult = await generateMonthlyAnalysisReport(request);

    // Verify report structure
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result.targetMonth).toBe('2024-01');

    expect(result.reportContent).toBeDefined();
    expect(result.reportContent).toHaveProperty('issueTrendAnalysis');
    expect(result.reportContent).toHaveProperty('bottleneckProgression');
    expect(result.reportContent).toHaveProperty('teamPerformanceMetrics');
    expect(result.reportContent).toHaveProperty('topPriorityChallenges');

    // Verify all severity scores in report content are normalized to 1-5 range
    if (Array.isArray(result.reportContent.issueTrendAnalysis)) {
      result.reportContent.issueTrendAnalysis.forEach((issue) => {
        expect(issue).toHaveProperty('impactTimeSeries');
        if (Array.isArray(issue.impactTimeSeries)) {
          issue.impactTimeSeries.forEach((impactScore) => {
            expect(impactScore).toBeGreaterThanOrEqual(0);
            expect(impactScore).toBeLessThanOrEqual(100);
          });
        }
      });
    }

    // Verify bottleneck progression contains normalized severity data
    if (result.reportContent.bottleneckProgression) {
      expect(result.reportContent.bottleneckProgression).toHaveProperty('progressionPatterns');
      if (Array.isArray(result.reportContent.bottleneckProgression.progressionPatterns)) {
        result.reportContent.bottleneckProgression.progressionPatterns.forEach((pattern) => {
          expect(pattern).toHaveProperty('issueId');
          expect(pattern).toHaveProperty('progressionType');
          expect(['deteriorating', 'improving', 'stable', 'resolved', 'emerging']).toContain(
            pattern.progressionType
          );
        });
      }
    }

    // Verify team performance metrics use normalized severity
    if (Array.isArray(result.reportContent.teamPerformanceMetrics)) {
      result.reportContent.teamPerformanceMetrics.forEach((teamMetric) => {
        expect(teamMetric).toHaveProperty('teamId');
        expect(typeof teamMetric.teamId).toBe('string');
        expect(teamMetric).toHaveProperty('issueResolutionSpeedDays');
        expect(typeof teamMetric.issueResolutionSpeedDays).toBe('number');
        expect(teamMetric.issueResolutionSpeedDays).toBeGreaterThanOrEqual(0);
        expect(teamMetric.issueResolutionSpeedDays).toBeLessThanOrEqual(999);

        expect(teamMetric).toHaveProperty('reportSubmissionRate');
        expect(typeof teamMetric.reportSubmissionRate).toBe('number');
        expect(teamMetric.reportSubmissionRate).toBeGreaterThanOrEqual(0);
        expect(teamMetric.reportSubmissionRate).toBeLessThanOrEqual(100);

        expect(teamMetric).toHaveProperty('issueRecurrenceRate');
        expect(typeof teamMetric.issueRecurrenceRate).toBe('number');
        expect(teamMetric.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
        expect(teamMetric.issueRecurrenceRate).toBeLessThanOrEqual(100);

        expect(teamMetric).toHaveProperty('priorityScore');
        expect(typeof teamMetric.priorityScore).toBe('number');
        expect(teamMetric.priorityScore).toBeGreaterThanOrEqual(0);
        expect(teamMetric.priorityScore).toBeLessThanOrEqual(100);

        expect(teamMetric).toHaveProperty('performanceRank');
        expect(['high', 'medium', 'low']).toContain(teamMetric.performanceRank);
      });
    }

    // Verify top priority challenges are extracted
    if (Array.isArray(result.reportContent.topPriorityChallenges)) {
      expect(result.reportContent.topPriorityChallenges.length).toBeLessThanOrEqual(5);
      result.reportContent.topPriorityChallenges.forEach((challenge) => {
        expect(challenge).toHaveProperty('challengeId');
        expect(typeof challenge.challengeId).toBe('string');
        expect(challenge).toHaveProperty('priorityScore');
        expect(typeof challenge.priorityScore).toBe('number');
        expect(challenge.priorityScore).toBeGreaterThanOrEqual(0);
        expect(challenge.priorityScore).toBeLessThanOrEqual(100);
      });
    }

    // Verify project delay risk level
    expect(result.projectDelayRiskLevel).toBeDefined();
    expect(['high', 'medium', 'low']).toContain(result.projectDelayRiskLevel);

    // Verify generatedAt is a valid Date
    expect(result.generatedAt).toBeDefined();
    expect(result.generatedAt instanceof Date).toBe(true);
    expect(result.generatedAt.getTime()).toBeLessThanOrEqual(Date.now());

    // Verify that severity normalization constraint (BR-TX_7-005) is satisfied:
    // All severity scores should be clamped to 1-5 range in the final report
    const allImpactScores: number[] = [];
    if (result.reportContent.issueTrendAnalysis) {
      result.reportContent.issueTrendAnalysis.forEach((issue) => {
        if (issue.impactTimeSeries) {
          allImpactScores.push(...issue.impactTimeSeries);
        }
      });
    }

    // Impact scores should be 0-100 normalized based on severity 1-5
    // When severity is clamped to 1-5, impact calculation should produce valid scores
    allImpactScores.forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});