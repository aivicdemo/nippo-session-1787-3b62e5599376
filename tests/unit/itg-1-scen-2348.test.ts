import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - 課題抽出', () => {
  let logMessages: string[];

  beforeEach(() => {
    logMessages = [];
    const originalLog = console.log;
    jest.spyOn(console, 'log').mockImplementation((message: string) => {
      logMessages.push(message);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    logMessages = [];
  });

  // SCEN-2348: [normal] 朝会報告集約分析機能 - 指定期間内に0件の日報がある場合、空の課題リストを返す
  test('should return empty issue list when no reports exist in the specified period', () => {
    const analysisStartDate = new Date('2026-08-20T00:00:00Z');
    const analysisEndDate = new Date('2026-08-22T23:59:59Z');

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const emptyReportRecords: any[] = [];

    const result = extractMonthlyReportData(
      {
        targetYear: 2026,
        targetMonth: 8,
        requestedByUserId: 'user-001',
      },
      emptyReportRecords,
      mockTextAnalysisAdapter,
    );

    expect(result.reportsByTeam).toEqual([]);
    expect(result.totalReportCount).toBe(0);
    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(logMessages.some(msg => msg.includes('日報'))).toBe(true);
  });
});