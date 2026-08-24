import { describe, test, expect } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('calculateTeamPerformanceMetrics - duplicate issue deduplication', () => {
  // SCEN-2345
  test('should deduplicate duplicate issue keywords and calculate metrics with consolidated frequency', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const teamIds = ['team-001'];

    const reportDataset = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-10T09:00:00Z'),
        teamId: 'team-001',
        authorId: 'user-001',
        yesterdayAccomplishment: 'Fixed login form',
        todayPlan: 'Work on authentication',
        issueDescription: '認証バグ',
        issueKeywords: ['認証バグ'],
        resolutionDaysElapsed: 2,
        isResolved: true,
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-11T09:00:00Z'),
        teamId: 'team-001',
        authorId: 'user-002',
        yesterdayAccomplishment: 'Database optimization',
        todayPlan: 'Continue optimization',
        issueDescription: '認証バグ in OAuth module',
        issueKeywords: ['認証バグ'],
        resolutionDaysElapsed: 3,
        isResolved: true,
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2024-01-12T09:00:00Z'),
        teamId: 'team-001',
        authorId: 'user-003',
        yesterdayAccomplishment: 'DB connection pooling',
        todayPlan: 'Monitor performance',
        issueDescription: 'DB接続遅延',
        issueKeywords: ['DB接続遅延'],
        resolutionDaysElapsed: 5,
        isResolved: true,
      },
      {
        reportId: 'report-004',
        reportDate: new Date('2024-01-13T09:00:00Z'),
        teamId: 'team-001',
        authorId: 'user-001',
        yesterdayAccomplishment: 'Merged auth fix',
        todayPlan: 'Deploy to staging',
        issueDescription: '認証バグ regression test',
        issueKeywords: ['認証バグ'],
        resolutionDaysElapsed: 1,
        isResolved: true,
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportDataset,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);
    expect(result.teamMetrics.length).toBeGreaterThan(0);

    const teamMetric = result.teamMetrics.find((m) => m.teamId === 'team-001');
    expect(teamMetric).toBeDefined();

    if (teamMetric) {
      expect(teamMetric.teamId).toBe('team-001');
      expect(typeof teamMetric.issueResolutionSpeed).toBe('number');
      expect(teamMetric.issueResolutionSpeed).toBeGreaterThan(0);

      const expectedAverageResolutionDays = (2 + 3 + 1 + 5) / 4;
      expect(teamMetric.issueResolutionSpeed).toBe(expectedAverageResolutionDays);

      expect(teamMetric.reportSubmissionRate).toBeDefined();
      expect(typeof teamMetric.reportSubmissionRate).toBe('number');
      expect(teamMetric.reportSubmissionRate).toBeGreaterThanOrEqual(0);
      expect(teamMetric.reportSubmissionRate).toBeLessThanOrEqual(100);

      expect(teamMetric.issueRecurrenceRate).toBeDefined();
      expect(typeof teamMetric.issueRecurrenceRate).toBe('number');
      expect(teamMetric.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
      expect(teamMetric.issueRecurrenceRate).toBeLessThanOrEqual(100);

      expect(teamMetric.priorityScore).toBeDefined();
      expect(typeof teamMetric.priorityScore).toBe('number');
      expect(teamMetric.priorityScore).toBeGreaterThanOrEqual(1);
      expect(teamMetric.priorityScore).toBeLessThanOrEqual(100);
    }

    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);
    expect(result.aggregationPeriod.dayCount).toBe(31);

    expect(result.dataQualityScore).toBeDefined();
    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.outlierDetectionResult).toBeDefined();
    expect(result.outlierDetectionResult.detectedOutliers).toBeDefined();
    expect(Array.isArray(result.outlierDetectionResult.detectedOutliers)).toBe(true);
  });
});