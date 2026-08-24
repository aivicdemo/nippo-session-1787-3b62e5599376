import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type {
  TeamPerformanceMetricsInput,
  TeamPerformanceMetricsOutput,
  DailyReportRecord,
} from '../../src/logic/monthly-performance-analysis';

describe('Team Performance Metrics - Maximum Scale Aggregation', () => {
  const MAX_TEAMS = 50;
  const MEMBERS_PER_TEAM = 10;
  const DAYS_IN_PERIOD = 30;
  const EXECUTION_TIME_LIMIT_MS = 30000;

  let startTime: number;

  beforeEach(() => {
    startTime = Date.now();
  });

  afterEach(() => {
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    expect(executionTime).toBeLessThan(EXECUTION_TIME_LIMIT_MS);
  });

  // SCEN-1830
  test('should accurately aggregate performance metrics for maximum scale team configuration', () => {
    const teamIds: string[] = Array.from({ length: MAX_TEAMS }, (_, i) =>
      `team-${String(i + 1).padStart(3, '0')}`
    );

    const generateDailyReports = (teamId: string, memberCount: number): DailyReportRecord[] => {
      const reports: DailyReportRecord[] = [];

      for (let day = 1; day <= DAYS_IN_PERIOD; day++) {
        for (let member = 1; member <= memberCount; member++) {
          const submissionDate = new Date(2024, 0, day);
          submissionDate.setHours(9, 0, 0, 0);

          reports.push({
            reportId: `${teamId}-day-${day}-member-${member}`,
            teamId: teamId,
            memberId: `${teamId}-member-${member}`,
            submissionDate: submissionDate.toISOString(),
            yesterdayAccomplishment: `Completed task ${day}-${member}`,
            todayPlan: `Plan for today ${day}-${member}`,
            issues: [`Issue keyword A`, `Issue keyword B`, `Issue keyword C`],
            issueImpactScores: [45, 60, 35],
          });
        }
      }

      return reports;
    };

    const allReports: DailyReportRecord[] = [];
    const expectedSubmissionRatesPerTeam: Record<string, number> = {};
    const expectedIssueFrequencies: Record<string, number> = {};
    let totalExpectedIssueCount = 0;
    let accumulatedImpactScores = 0;
    let totalImpactScoreCount = 0;

    for (let teamIndex = 0; teamIndex < MAX_TEAMS; teamIndex++) {
      const teamId = teamIds[teamIndex];
      const membersForTeam = MEMBERS_PER_TEAM;
      const reportsForTeam = generateDailyReports(teamId, membersForTeam);

      allReports.push(...reportsForTeam);

      const expectedSubmissions = membersForTeam * DAYS_IN_PERIOD;
      const submissionRate = (reportsForTeam.length / expectedSubmissions) * 100;
      expectedSubmissionRatesPerTeam[teamId] = submissionRate;

      reportsForTeam.forEach((report) => {
        report.issues.forEach((issue, idx) => {
          expectedIssueFrequencies[issue] = (expectedIssueFrequencies[issue] || 0) + 1;
          totalExpectedIssueCount += 1;
          accumulatedImpactScores += report.issueImpactScores[idx];
          totalImpactScoreCount += 1;
        });
      });
    }

    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-30T23:59:59Z');

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate: aggregationStartDate,
      aggregationEndDate: aggregationEndDate,
      teamIds: teamIds,
      reportDataset: allReports,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(result.teamMetrics.length).toBe(MAX_TEAMS);
    expect(result.aggregationPeriod).toBeDefined();
    expect(result.dataQualityScore).toBeDefined();
    expect(result.outlierDetectionResult).toBeDefined();

    const averageSubmissionRate =
      result.teamMetrics.reduce((sum, tm) => sum + tm.reportSubmissionRate, 0) / MAX_TEAMS;
    const expectedAverageSubmissionRate =
      Object.values(expectedSubmissionRatesPerTeam).reduce((sum, rate) => sum + rate, 0) /
      MAX_TEAMS;
    expect(Math.abs(averageSubmissionRate - expectedAverageSubmissionRate)).toBeLessThanOrEqual(
      0.01
    );

    const actualTotalIssueCount = result.teamMetrics.reduce(
      (sum, tm) => sum + (tm.issueRecurrenceRate > 0 ? Math.ceil(tm.issueRecurrenceRate) : 0),
      0
    );
    expect(actualTotalIssueCount).toBeGreaterThan(0);

    const weightedImpactAverage =
      result.teamMetrics.reduce((sum, tm) => sum + tm.priorityScore, 0) / MAX_TEAMS;
    expect(weightedImpactAverage).toBeGreaterThan(0);
    expect(weightedImpactAverage).toBeLessThanOrEqual(100);

    const eachTeamMetric = result.teamMetrics[0];
    expect(eachTeamMetric.teamId).toBeDefined();
    expect(eachTeamMetric.teamName).toBeDefined();
    expect(typeof eachTeamMetric.issueResolutionSpeed).toBe('number');
    expect(typeof eachTeamMetric.reportSubmissionRate).toBe('number');
    expect(typeof eachTeamMetric.issueRecurrenceRate).toBe('number');
    expect(typeof eachTeamMetric.priorityScore).toBe('number');

    expect(eachTeamMetric.reportSubmissionRate).toBeGreaterThanOrEqual(0);
    expect(eachTeamMetric.reportSubmissionRate).toBeLessThanOrEqual(100);
    expect(eachTeamMetric.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(eachTeamMetric.issueRecurrenceRate).toBeLessThanOrEqual(100);
    expect(eachTeamMetric.priorityScore).toBeGreaterThanOrEqual(1);
    expect(eachTeamMetric.priorityScore).toBeLessThanOrEqual(100);

    const sumSubmissionRates = result.teamMetrics.reduce(
      (sum, tm) => sum + tm.reportSubmissionRate,
      0
    );
    const sumPriorityScores = result.teamMetrics.reduce((sum, tm) => sum + tm.priorityScore, 0);
    const sumIssueRecurrenceRates = result.teamMetrics.reduce(
      (sum, tm) => sum + tm.issueRecurrenceRate,
      0
    );

    expect(sumSubmissionRates).toBeGreaterThan(0);
    expect(sumPriorityScores).toBeGreaterThan(0);

    const expectedAggregationPeriodDays =
      (aggregationEndDate.getTime() - aggregationStartDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);
    expect(result.aggregationPeriod.days).toBe(Math.ceil(expectedAggregationPeriodDays));

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.outlierDetectionResult).toBeDefined();
    expect(result.outlierDetectionResult.hasOutliers).toBeDefined();
    expect(typeof result.outlierDetectionResult.hasOutliers).toBe('boolean');
    expect(Array.isArray(result.outlierDetectionResult.outlierMetrics)).toBe(true);
    expect(result.outlierDetectionResult.normalRange).toBeDefined();

    const allTeamIdsInResult = result.teamMetrics.map((tm) => tm.teamId);
    for (const expectedTeamId of teamIds) {
      expect(allTeamIdsInResult).toContain(expectedTeamId);
    }

    for (const teamMetric of result.teamMetrics) {
      const expectedSubmissionRate = expectedSubmissionRatesPerTeam[teamMetric.teamId];
      if (expectedSubmissionRate !== undefined) {
        expect(
          Math.abs(teamMetric.reportSubmissionRate - expectedSubmissionRate)
        ).toBeLessThanOrEqual(0.01);
      }
    }

    const roundingErrorThreshold = 0.01;
    for (const teamMetric of result.teamMetrics) {
      expect(teamMetric.reportSubmissionRate).toBeLessThanOrEqual(100 + roundingErrorThreshold);
      expect(teamMetric.issueRecurrenceRate).toBeLessThanOrEqual(100 + roundingErrorThreshold);
      expect(teamMetric.issueResolutionSpeed).toBeGreaterThanOrEqual(0);
    }
  });
});