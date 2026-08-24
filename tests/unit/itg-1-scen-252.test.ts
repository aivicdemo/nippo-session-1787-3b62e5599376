import { describe, test, expect } from '@jest/globals';
import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Submit Daily Report', () => {
  // SCEN-252: [normal] 報告遅延判定機能 - 同じ報告を 2 回実行しても遅延判定結果が変わらない
  test('should return identical delay judgment result when same report is submitted twice', () => {
    const userId = 'user-A';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const yesterdayAccomplishment = 'バグ修正';
    const todayPlan = '機能実装';
    const challenges = '納期短縮';
    
    const firstSubmissionTimestamp = new Date('2024-01-15T08:30:00Z');
    const secondSubmissionTimestamp = new Date('2024-01-15T08:35:00Z');
    
    const firstSubmitInput = {
      userId,
      teamId,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      reportDate,
    };

    const firstResult = submitDailyReport(firstSubmitInput, firstSubmissionTimestamp);
    
    expect(firstResult).toBeDefined();
    expect(firstResult.reportId).toBeDefined();
    expect(typeof firstResult.reportId).toBe('string');
    expect(firstResult.submissionTimestamp).toBe(firstSubmissionTimestamp.toISOString());
    expect(firstResult.isWithinDeadline).toBe(true);
    
    const firstReportId = firstResult.reportId;
    const firstIsWithinDeadline = firstResult.isWithinDeadline;
    const firstSubmissionTime = firstResult.submissionTimestamp;

    const secondResult = submitDailyReport(firstSubmitInput, secondSubmissionTimestamp);
    
    expect(secondResult).toBeDefined();
    expect(secondResult.reportId).toBeDefined();
    
    expect(secondResult.isWithinDeadline).toBe(firstIsWithinDeadline);
    expect(secondResult.submissionTimestamp).toBe(firstSubmissionTime);
  });
});