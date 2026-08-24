import { describe, it, expect, beforeEach } from '@jest/globals';
import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('fetchYesterdayReport', () => {
  // SCEN-2707
  it('should return yesterday report with field order preserved as saved', async () => {
    const engineerId_A = 'engineer-user-a';
    const engineerId_B = 'engineer-user-b';
    const requestingUserId = 'admin-user';
    const targetDate = new Date('2024-01-15');

    // Mock data for User A - fields saved in order: yesterdayAccomplishment, todayPlan, challenges
    const userA_Report = {
      reportId: 'report-a-001',
      engineerId: engineerId_A,
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      challenges: 'リソース不足',
      submittedAt: new Date('2024-01-15T08:30:00Z'),
      fieldOrder: ['yesterdayAccomplishment', 'todayPlan', 'challenges']
    };

    // Mock data for User B - fields saved in order: challenges, yesterdayAccomplishment, todayPlan
    const userB_Report = {
      reportId: 'report-b-001',
      engineerId: engineerId_B,
      reportDate: new Date('2024-01-15'),
      challenges: '納期遅延',
      yesterdayAccomplishment: '会議出席',
      todayPlan: '資料作成',
      submittedAt: new Date('2024-01-15T09:00:00Z'),
      fieldOrder: ['challenges', 'yesterdayAccomplishment', 'todayPlan']
    };

    // Fetch User A's yesterday report
    const resultA = await fetchYesterdayReport({
      engineerId: engineerId_A,
      targetDate: targetDate,
      requestingUserId: requestingUserId
    });

    // Verify User A's report preserves field order from save time
    expect(resultA.reportId).toBe('report-a-001');
    expect(resultA.engineerId).toBe(engineerId_A);
    expect(resultA.reportDate).toEqual(new Date('2024-01-15'));
    expect(resultA.yesterdayAccomplishment).toBe('タスクA完了');
    expect(resultA.todayPlan).toBe('タスクB開始');
    expect(resultA.challenges).toBe('リソース不足');
    expect(resultA.submittedAt).toEqual(new Date('2024-01-15T08:30:00Z'));
    expect(resultA.fieldOrder).toEqual(['yesterdayAccomplishment', 'todayPlan', 'challenges']);

    // Fetch User B's yesterday report
    const resultB = await fetchYesterdayReport({
      engineerId: engineerId_B,
      targetDate: targetDate,
      requestingUserId: requestingUserId
    });

    // Verify User B's report preserves different field order from save time
    expect(resultB.reportId).toBe('report-b-001');
    expect(resultB.engineerId).toBe(engineerId_B);
    expect(resultB.reportDate).toEqual(new Date('2024-01-15'));
    expect(resultB.challenges).toBe('納期遅延');
    expect(resultB.yesterdayAccomplishment).toBe('会議出席');
    expect(resultB.todayPlan).toBe('資料作成');
    expect(resultB.submittedAt).toEqual(new Date('2024-01-15T09:00:00Z'));
    expect(resultB.fieldOrder).toEqual(['challenges', 'yesterdayAccomplishment', 'todayPlan']);
  });
});