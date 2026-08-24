import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import type {
  BottleneckAnalysisInput,
  IssueTimeSeriesRecord,
  BottleneckTrendAnalysisResult,
} from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-2282: [normal] 改善施策推奨機能 - 課題解決速度が遅い部門が1件の場合、その部門に対する改善施策が推奨される
  test('should recommend improvement strategy for department with slowest issue resolution speed', () => {
    // Setup: Create time series data for 3 departments over 30 days
    // Department A (slow): average 5 days to resolve
    // Department B (medium): average 3 days to resolve
    // Department C (fast): average 2 days to resolve

    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-30T23:59:59Z');

    // Generate time series records for Department A (slow resolution)
    const departmentARecords: IssueTimeSeriesRecord[] = [
      {
        issueId: 'issue-a-001',
        recordDate: new Date('2024-01-05T00:00:00Z'),
        occurrenceCount: 2,
        impactScore: 65,
        resolutionDaysElapsed: 5,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-a-002',
        recordDate: new Date('2024-01-10T00:00:00Z'),
        occurrenceCount: 3,
        impactScore: 72,
        resolutionDaysElapsed: 5,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-a-003',
        recordDate: new Date('2024-01-15T00:00:00Z'),
        occurrenceCount: 2,
        impactScore: 68,
        resolutionDaysElapsed: 5,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-a-004',
        recordDate: new Date('2024-01-20T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 70,
        resolutionDaysElapsed: 5,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-a-005',
        recordDate: new Date('2024-01-25T00:00:00Z'),
        occurrenceCount: 2,
        impactScore: 66,
        resolutionDaysElapsed: 5,
        resolutionStatus: 'resolved',
      },
    ];

    // Generate time series records for Department B (medium resolution)
    const departmentBRecords: IssueTimeSeriesRecord[] = [
      {
        issueId: 'issue-b-001',
        recordDate: new Date('2024-01-05T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 55,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-b-002',
        recordDate: new Date('2024-01-10T00:00:00Z'),
        occurrenceCount: 2,
        impactScore: 58,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-b-003',
        recordDate: new Date('2024-01-15T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 60,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-b-004',
        recordDate: new Date('2024-01-20T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 57,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-b-005',
        recordDate: new Date('2024-01-25T00:00:00Z'),
        occurrenceCount: 2,
        impactScore: 59,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'resolved',
      },
    ];

    // Generate time series records for Department C (fast resolution)
    const departmentCRecords: IssueTimeSeriesRecord[] = [
      {
        issueId: 'issue-c-001',
        recordDate: new Date('2024-01-05T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 45,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-c-002',
        recordDate: new Date('2024-01-10T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 48,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-c-003',
        recordDate: new Date('2024-01-15T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 50,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-c-004',
        recordDate: new Date('2024-01-20T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 46,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-c-005',
        recordDate: new Date('2024-01-25T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 47,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'resolved',
      },
    ];

    // Combine all records
    const allIssueTimeSeriesData = [
      ...departmentARecords,
      ...departmentBRecords,
      ...departmentCRecords,
    ];

    // Create input for bottleneck analysis
    const input: BottleneckAnalysisInput = {
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData: allIssueTimeSeriesData,
      minimumDataPointsThreshold: 7,
      outlierDetectionEnabled: true,
    };

    // Execute the analysis function
    const result = analyzeBottleneckTrendWithTimeSeries(input);

    // Verify result structure
    expect(result).toBeDefined();
    expect(result).toHaveProperty('issueId');
    expect(result).toHaveProperty('bottleneckSeverityRank');
    expect(result).toHaveProperty('bottleneckSeverityScore');
    expect(result).toHaveProperty('improvementTrend');
    expect(result).toHaveProperty('averageResolutionDays');
    expect(result).toHaveProperty('peakOccurrenceDate');
    expect(result).toHaveProperty('timeSeriesTrendData');

    // Verify that Department A (slowest resolution) is identified
    // Expected: Department A average = 5 days
    expect(result.averageResolutionDays).toBe(5);

    // Verify bottleneck severity score is high for slow resolution speed
    // Expected: High severity score indicating critical bottleneck
    expect(result.bottleneckSeverityScore).toBeGreaterThanOrEqual(70);

    // Verify bottleneck severity rank
    expect(['critical', 'high']).toContain(result.bottleneckSeverityRank);

    // Verify time series trend data is populated
    expect(Array.isArray(result.timeSeriesTrendData)).toBe(true);
    expect(result.timeSeriesTrendData.length).toBeGreaterThan(0);

    // Verify each daily trend point has required fields
    result.timeSeriesTrendData.forEach((trendPoint) => {
      expect(trendPoint).toHaveProperty('date');
      expect(trendPoint).toHaveProperty('occurrenceCount');
      expect(trendPoint.occurrenceCount).toBeGreaterThanOrEqual(0);
      expect(trendPoint).toHaveProperty('impactScore');
      expect(trendPoint.impactScore).toBeGreaterThanOrEqual(0);
      expect(trendPoint.impactScore).toBeLessThanOrEqual(100);
      expect(trendPoint).toHaveProperty('resolutionRate');
      expect(trendPoint.resolutionRate).toBeGreaterThanOrEqual(0);
      expect(trendPoint.resolutionRate).toBeLessThanOrEqual(100);
    });

    // Verify peak occurrence date is within analysis period
    expect(result.peakOccurrenceDate.getTime()).toBeGreaterThanOrEqual(
      analysisStartDate.getTime(),
    );
    expect(result.peakOccurrenceDate.getTime()).toBeLessThanOrEqual(
      analysisEndDate.getTime(),
    );

    // Verify improvement trend indicates current status
    expect(['improving', 'stable', 'deteriorating']).toContain(
      result.improvementTrend,
    );
  });
});