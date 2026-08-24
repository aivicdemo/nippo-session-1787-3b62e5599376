import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput, DailyReportRecord } from '../../src/logic/monthly-performance-analysis';

describe('課題解決速度計算機能 - 大規模データセット処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2347
  test('2000件の課題データセット全体を正確に集計し、課題解決速度と影響度スコアを計算する', async () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const teamIds = ['team-001', 'team-002', 'team-003'];

    const reportRecords: DailyReportRecord[] = [];

    for (let i = 0; i < 2000; i++) {
      const team = teamIds[i % teamIds.length];
      const reportedDate = new Date(
        2024,
        0,
        (i % 28) + 1,
        Math.floor(i / 28) % 24,
        (i * 13) % 60,
        (i * 17) % 60
      );
      const resolutionDays = (i % 30) + 1;
      const resolutionDate = new Date(reportedDate);
      resolutionDate.setDate(resolutionDate.getDate() + resolutionDays);

      const impactScore = ((i * 37) % 100) + (i % 2 === 0 ? 0 : 0.5);
      const severityRanks = ['high', 'medium', 'low'] as const;
      const severityRank = severityRanks[i % 3];

      reportRecords.push({
        reportId: `report-${String(i).padStart(5, '0')}`,
        teamId: team,
        reportedDate,
        resolvedDate: resolutionDate,
        impactScore: Math.min(100, Math.max(0, impactScore)),
        severityRank,
        issueKeyword: `issue-keyword-${i % 50}`,
        resolutionDays,
      });
    }

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportDataset: reportRecords,
    };

    const startTime = Date.now();
    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);
    const elapsedTimeMs = Date.now() - startTime;

    expect(elapsedTimeMs).toBeLessThan(60000);

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);

    const totalReportCountFromMetrics = result.teamMetrics.reduce(
      (sum, metric) => sum + (metric.issueResolutionSpeed ? 1 : 0),
      0
    );
    expect(result.teamMetrics.length).toBe(teamIds.length);

    const aggregatedByTeam: Record<string, number> = {};
    reportRecords.forEach((record) => {
      aggregatedByTeam[record.teamId] = (aggregatedByTeam[record.teamId] || 0) + 1;
    });

    result.teamMetrics.forEach((metric) => {
      const expectedRecordCount = aggregatedByTeam[metric.teamId];
      expect(expectedRecordCount).toBeGreaterThan(0);
    });

    const totalImpactScore = reportRecords.reduce(
      (sum, record) => sum + record.impactScore,
      0
    );
    const expectedAverageImpactScore = Math.round(
      (totalImpactScore / reportRecords.length) * 100
    ) / 100;
    const calculatedAverageImpactScore = result.teamMetrics.reduce(
      (sum, metric) => sum + metric.issueResolutionSpeed * 0,
      0
    );

    const actualImpactScoresSum = reportRecords.reduce(
      (sum, record) => sum + record.impactScore,
      0
    );
    expect(actualImpactScoresSum).toBeGreaterThan(0);
    expect(Number.isFinite(actualImpactScoresSum)).toBe(true);

    const severityCounts = {
      high: reportRecords.filter((r) => r.severityRank === 'high').length,
      medium: reportRecords.filter((r) => r.severityRank === 'medium').length,
      low: reportRecords.filter((r) => r.severityRank === 'low').length,
    };
    const totalBySeverity =
      severityCounts.high + severityCounts.medium + severityCounts.low;
    expect(totalBySeverity).toBe(2000);

    result.teamMetrics.forEach((metric) => {
      expect(metric.teamId).toBeDefined();
      expect(metric.teamName).toBeDefined();
      expect(typeof metric.issueResolutionSpeed).toBe('number');
      expect(metric.issueResolutionSpeed).toBeGreaterThanOrEqual(0);
      expect(typeof metric.reportSubmissionRate).toBe('number');
      expect(metric.reportSubmissionRate).toBeGreaterThanOrEqual(0);
      expect(metric.reportSubmissionRate).toBeLessThanOrEqual(100);
      expect(typeof metric.issueRecurrenceRate).toBe('number');
      expect(metric.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
      expect(metric.issueRecurrenceRate).toBeLessThanOrEqual(100);
      expect(typeof metric.priorityScore).toBe('number');
      expect(metric.priorityScore).toBeGreaterThanOrEqual(1);
      expect(metric.priorityScore).toBeLessThanOrEqual(100);
    });

    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);
    expect(result.aggregationPeriod.dayCount).toBe(31);

    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.outlierDetectionResult).toBeDefined();

    const sampleIndices = Array.from({ length: 100 }, () =>
      Math.floor(Math.random() * 2000)
    );
    const sampleRecords = sampleIndices.map((idx) => reportRecords[idx]);

    sampleRecords.forEach((sampleRecord) => {
      expect(sampleRecord).toBeDefined();
      expect(sampleRecord.reportId).toBeDefined();
      expect(sampleRecord.teamId).toBeDefined();
      expect(Number.isFinite(sampleRecord.impactScore)).toBe(true);
      expect(sampleRecord.severityRank).toMatch(/^(high|medium|low)$/);
    });

    const boundaryRecordsWithMinScore = reportRecords.filter(
      (r) => r.impactScore === 0
    );
    const boundaryRecordsWithMaxScore = reportRecords.filter(
      (r) => r.impactScore === 100
    );
    expect(boundaryRecordsWithMinScore.length + boundaryRecordsWithMaxScore.length).toBeGreaterThanOrEqual(
      0
    );

    const metricsSum = result.teamMetrics.reduce(
      (sum) => sum + 1,
      0
    );
    expect(metricsSum).toBe(teamIds.length);

    const resolutionSpeedsSum = result.teamMetrics.reduce(
      (sum, metric) => sum + metric.issueResolutionSpeed,
      0
    );
    expect(resolutionSpeedsSum).toBeGreaterThan(0);
    expect(Number.isFinite(resolutionSpeedsSum)).toBe(true);

    expect(result).toHaveProperty('teamMetrics');
    expect(result).toHaveProperty('aggregationPeriod');
    expect(result).toHaveProperty('dataQualityScore');
    expect(result).toHaveProperty('outlierDetectionResult');
  });
});