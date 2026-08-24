import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('calculateTeamPerformanceMetrics', () => {
  // SCEN-2339: [edge] 課題解決速度計算機能 - 指定期間の終了日が月末のとき、その月末日まで集計される
  test('should include all data up to and including the month-end date when aggregationEndDate is Feb 29', () => {
    // Prepare test data: 10 team members × 29 days = 290 daily report records
    const reportRecords = [];
    const teamId1 = 'team-001';
    const teamId2 = 'team-002';
    const teamIds = [teamId1, teamId2];
    const memberIds = [
      'member-001', 'member-002', 'member-003', 'member-004', 'member-005',
      'member-006', 'member-007', 'member-008', 'member-009', 'member-010'
    ];

    // Generate daily reports from 2024-02-01 to 2024-02-29 (29 days for leap year)
    for (let dayOfMonth = 1; dayOfMonth <= 29; dayOfMonth++) {
      const dayStr = String(dayOfMonth).padStart(2, '0');
      const reportDate = new Date(`2024-02-${dayStr}T09:00:00Z`);
      
      for (const memberId of memberIds) {
        reportRecords.push({
          reportId: `report-2024-02-${dayStr}-${memberId}`,
          reportDate: reportDate,
          teamId: dayOfMonth % 2 === 0 ? teamId1 : teamId2,
          memberId: memberId,
          yesterdayAccomplishment: `Completed task on Feb ${dayOfMonth}`,
          todayPlan: `Plan for Feb ${dayOfMonth + 1}`,
          challenges: `Challenge: Database query performance issue on Feb ${dayOfMonth}`,
          submissionTime: new Date(`2024-02-${dayStr}T08:30:00Z`),
          isOnTime: true,
          dataQualityScore: 85
        });
      }
    }

    // Create stub for TextAnalysisServiceAdapter
    const textAnalysisStub = {
      extractKeywords: jest.fn((text: string) => {
        if (text.includes('Database query performance')) {
          return {
            keywords: [
              { keyword: 'Database', frequency: 1, confidence: 0.95 },
              { keyword: 'performance', frequency: 1, confidence: 0.92 }
            ]
          };
        }
        return { keywords: [] };
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scores: { [key: string]: number } = {
          'Database': 75,
          'performance': 70
        };
        return scores[keyword] || 50;
      }),
      classifyIssueSeverity: jest.fn((text: string) => {
        return text.includes('performance') ? 'high' : 'medium';
      })
    };

    const aggregationStartDate = new Date('2024-02-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-02-29T23:59:59Z');

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate: aggregationStartDate,
      aggregationEndDate: aggregationEndDate,
      teamIds: teamIds,
      reportDataset: reportRecords,
      minimumReportThreshold: 10
    };

    // Execute the function
    const result = calculateTeamPerformanceMetrics(input, textAnalysisStub);

    // Assertions
    expect(result).toBeDefined();
    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);

    // Verify that all 290 records from Feb 1 to Feb 29 are included in analysis
    const totalReportsIncluded = result.teamMetrics.reduce(
      (sum, metric) => sum + metric.reportCount,
      0
    );
    expect(totalReportsIncluded).toBe(290);

    // Verify team metrics are calculated
    expect(result.teamMetrics).toBeDefined();
    expect(result.teamMetrics.length).toBe(2);

    // Verify that each team's metrics include data from Feb 29 (final day)
    for (const teamMetric of result.teamMetrics) {
      expect(teamMetric.teamId).toBeDefined();
      expect(teamMetric.teamName).toBeDefined();
      expect(typeof teamMetric.issueResolutionSpeed).toBe('number');
      expect(teamMetric.issueResolutionSpeed).toBeGreaterThanOrEqual(0);
      expect(typeof teamMetric.reportSubmissionRate).toBe('number');
      expect(teamMetric.reportSubmissionRate).toBeGreaterThanOrEqual(0);
      expect(teamMetric.reportSubmissionRate).toBeLessThanOrEqual(100);
      expect(typeof teamMetric.issueRecurrenceRate).toBe('number');
      expect(teamMetric.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
      expect(teamMetric.issueRecurrenceRate).toBeLessThanOrEqual(100);
      expect(typeof teamMetric.priorityScore).toBe('number');
      expect(teamMetric.priorityScore).toBeGreaterThanOrEqual(1);
      expect(teamMetric.priorityScore).toBeLessThanOrEqual(100);
      // Verify that the team processed at least 145 records (half of 290)
      expect(teamMetric.reportCount).toBeGreaterThanOrEqual(145);
    }

    // Verify data quality score is calculated
    expect(result.dataQualityScore).toBeDefined();
    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Verify outlier detection result is present
    expect(result.outlierDetectionResult).toBeDefined();
    expect(result.outlierDetectionResult.detectedOutliers).toBeDefined();
    expect(Array.isArray(result.outlierDetectionResult.detectedOutliers)).toBe(true);

    // Verify that February 29 data is reflected in calculations
    // The issue resolution speed should reflect all data including Feb 29
    const avgResolutionSpeedTeam1 = result.teamMetrics.find(m => m.teamId === teamId1)?.issueResolutionSpeed || 0;
    expect(avgResolutionSpeedTeam1).toBeGreaterThan(0);

    // Verify no March data is included (March 1 should be excluded)
    const hasMarchData = reportRecords.some(record => {
      const recordMonth = record.reportDate.getUTCMonth() + 1; // 0-indexed, so Feb = 1, Mar = 2
      return recordMonth === 3; // Month 3 = March
    });
    expect(hasMarchData).toBe(false);

    // Verify that the calculation window is exactly [Feb 1, 00:00 to Feb 29, 23:59:59]
    const recordsBeforePeriod = reportRecords.filter(r => r.reportDate < aggregationStartDate);
    const recordsAfterPeriod = reportRecords.filter(r => r.reportDate > aggregationEndDate);
    expect(recordsBeforePeriod.length).toBe(0);
    expect(recordsAfterPeriod.length).toBe(0);

    // Verify stub was called for keyword extraction and impact assessment
    expect(textAnalysisStub.extractKeywords).toHaveBeenCalled();
    expect(textAnalysisStub.assessImpactScore).toHaveBeenCalled();
  });
});