import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyExtractionRequest, WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('weekly-issue-analysis extractWeeklyReportData - same day aggregation', () => {
  // SCEN-1477
  test('should aggregate only reports from the single target date when start and end dates are identical', async () => {
    const targetDate = new Date('2026-08-19T00:00:00Z');
    const dayBefore = new Date('2026-08-18T00:00:00Z');
    const dayAfter = new Date('2026-08-20T00:00:00Z');

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        const keywords: Array<{ keyword: string; frequency: number }> = [];
        if (text.includes('システム障害')) {
          keywords.push({ keyword: 'システム障害', frequency: 1 });
        }
        if (text.includes('ネットワーク遅延')) {
          keywords.push({ keyword: 'ネットワーク遅延', frequency: 1 });
        }
        if (text.includes('ドキュメント不足')) {
          keywords.push({ keyword: 'ドキュメント不足', frequency: 1 });
        }
        return Promise.resolve(keywords);
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        return Promise.resolve(75);
      }),
      classifyIssueSeverity: jest.fn((text: string) => {
        return Promise.resolve('high' as const);
      }),
    };

    const mockReportRepository = {
      findByDateRange: jest.fn((startDate: Date, endDate: Date) => {
        const reports = [];

        if (
          (startDate <= dayBefore && dayBefore <= endDate) ||
          (startDate <= targetDate && targetDate <= endDate) ||
          (startDate <= dayAfter && dayAfter <= endDate)
        ) {
          if (startDate <= dayBefore && dayBefore <= endDate) {
            reports.push({
              id: 'report-day-before-1',
              reportDate: dayBefore,
              userId: 'user-d',
              yesterdayAccomplishment: 'Previous day task 1',
              todayPlan: 'Previous day plan 1',
              challengeItems: 'Previous challenge 1',
            });
            reports.push({
              id: 'report-day-before-2',
              reportDate: dayBefore,
              userId: 'user-e',
              yesterdayAccomplishment: 'Previous day task 2',
              todayPlan: 'Previous day plan 2',
              challengeItems: 'Previous challenge 2',
            });
          }

          if (startDate <= targetDate && targetDate <= endDate) {
            reports.push({
              id: 'report-target-1',
              reportDate: targetDate,
              userId: 'user-a',
              yesterdayAccomplishment: 'Task A completed',
              todayPlan: 'Plan A for today',
              challengeItems: 'システム障害が発生した',
            });
            reports.push({
              id: 'report-target-2',
              reportDate: targetDate,
              userId: 'user-b',
              yesterdayAccomplishment: 'Task B completed',
              todayPlan: 'Plan B for today',
              challengeItems: 'ネットワーク遅延が続いている',
            });
            reports.push({
              id: 'report-target-3',
              reportDate: targetDate,
              userId: 'user-c',
              yesterdayAccomplishment: 'Task C completed',
              todayPlan: 'Plan C for today',
              challengeItems: 'ドキュメント不足で困っている',
            });
          }

          if (startDate <= dayAfter && dayAfter <= endDate) {
            reports.push({
              id: 'report-day-after-1',
              reportDate: dayAfter,
              userId: 'user-f',
              yesterdayAccomplishment: 'Next day task 1',
              todayPlan: 'Next day plan 1',
              challengeItems: 'Next day challenge 1',
            });
            reports.push({
              id: 'report-day-after-2',
              reportDate: dayAfter,
              userId: 'user-g',
              yesterdayAccomplishment: 'Next day task 2',
              todayPlan: 'Next day plan 2',
              challengeItems: 'Next day challenge 2',
            });
          }
        }

        return Promise.resolve(reports);
      }),
    };

    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate: targetDate,
      weekEndDate: targetDate,
      teamIds: undefined,
      requestedByUserId: 'user-system',
    };

    const result = await extractWeeklyReportData(
      extractionRequest,
      mockTextAnalysisAdapter,
      mockReportRepository,
    );

    expect(result).toBeDefined();
    expect(result.totalReportsExtracted).toBe(3);

    expect(result.reportsByDate).toHaveLength(1);
    expect(result.reportsByDate[0].reportDate).toEqual(targetDate);
    expect(result.reportsByDate[0].reportCount).toBe(3);
    expect(result.reportsByDate[0].submittedByUserIds).toEqual(
      expect.arrayContaining(['user-a', 'user-b', 'user-c']),
    );

    expect(result.extractedChallenges).toBeDefined();
    expect(result.extractedChallenges.length).toBeGreaterThanOrEqual(3);

    const challengeKeywords = result.extractedChallenges
      .map((c) => c.keyword)
      .slice(0, 3);
    expect(challengeKeywords).toEqual(
      expect.arrayContaining([
        'システム障害',
        'ネットワーク遅延',
        'ドキュメント不足',
      ]),
    );

    expect(result.weekRange.startDate).toEqual(targetDate);
    expect(result.weekRange.endDate).toEqual(targetDate);

    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(mockReportRepository.findByDateRange).toHaveBeenCalledWith(
      targetDate,
      targetDate,
    );
  });
});