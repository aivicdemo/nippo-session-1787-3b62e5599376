import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('生産性指標計算機能 - 同日集約', () => {
  // SCEN-2294
  test('集約期間の開始日と終了日が同日の場合、1日分の課題発生頻度が正しく集計される', () => {
    const aggregationDate = new Date('2026-08-19T00:00:00Z');
    const aggregationEndDate = new Date('2026-08-19T23:59:59Z');

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        if (text.includes('API連携遅延')) {
          return {
            keywords: [
              {
                keyword: 'API連携遅延',
                frequency: 1,
                confidence: 0.95,
              },
            ],
          };
        }
        return { keywords: [] };
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        return keyword === 'API連携遅延' ? 65 : 0;
      }),
      classifyIssueSeverity: jest.fn((text: string) => {
        return 'medium';
      }),
    };

    const dailyReportRecord1 = {
      reportId: 'report-001',
      reportDate: aggregationDate,
      teamId: 'team-alpha',
      userId: 'user-001',
      yesterdayAccomplishment: 'API integration work completed',
      todayPlan: 'Testing and validation',
      challengingIssue: 'API連携遅延 encountered during integration',
      submissionTime: aggregationDate,
      isLateSubmission: false,
    };

    const dailyReportRecord2 = {
      reportId: 'report-002',
      reportDate: aggregationDate,
      teamId: 'team-alpha',
      userId: 'user-002',
      yesterdayAccomplishment: 'Database schema design',
      todayPlan: 'Implementation phase',
      challengingIssue: 'API連携遅延 affecting timeline',
      submissionTime: aggregationDate,
      isLateSubmission: false,
    };

    const dailyReportRecord3 = {
      reportId: 'report-003',
      reportDate: aggregationDate,
      teamId: 'team-alpha',
      userId: 'user-003',
      yesterdayAccomplishment: 'Unit tests written',
      todayPlan: 'Integration tests',
      challengingIssue: 'API連携遅延 slowing down progress',
      submissionTime: aggregationDate,
      isLateSubmission: false,
    };

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate: aggregationDate,
      aggregationEndDate: aggregationEndDate,
      teamIds: ['team-alpha'],
      reportDataset: [dailyReportRecord1, dailyReportRecord2, dailyReportRecord3],
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(
      input,
      mockTextAnalysisAdapter as any,
    );

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(result.teamMetrics.length).toBe(1);

    const teamMetric = result.teamMetrics[0];
    expect(teamMetric.teamId).toBe('team-alpha');

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();

    const extractedChallenges = [
      dailyReportRecord1.challengingIssue,
      dailyReportRecord2.challengingIssue,
      dailyReportRecord3.challengingIssue,
    ];

    let apiDelayKeywordCount = 0;
    extractedChallenges.forEach((challenge) => {
      if (challenge.includes('API連携遅延')) {
        apiDelayKeywordCount += 1;
      }
    });

    expect(apiDelayKeywordCount).toBe(3);

    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);
    expect(result.aggregationPeriod.dayCount).toBe(1);

    expect(teamMetric.reportSubmissionRate).toBeGreaterThan(0);
    expect(teamMetric.reportSubmissionRate).toBeLessThanOrEqual(100);

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});