import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('報告内容修正期限判定機能', () => {
  // SCEN-2733: [edge] 報告内容修正期限判定機能 - 朝会開始時刻ちょうどの時点で修正禁止となる
  test('朝会開始時刻ちょうどの時点で修正禁止となる', () => {
    const submittedAt = new Date('2025-01-20T08:50:00Z');
    const morningMeetingStartTime = new Date('2025-01-20T09:00:00Z');
    const currentTimestamp = new Date('2025-01-20T09:00:00Z');

    const result = validateReportModificationWindow({
      submittedAt,
      currentTimestamp,
      morningMeetingStartTime,
    });

    expect(result.isModificationAllowed).toBe(false);
    expect(result.remainingMinutes).toBe(0);
    expect(result.modificationDeadline).toEqual(morningMeetingStartTime);
    expect(result.reason).toMatch(/朝会開始時刻/);
  });
});