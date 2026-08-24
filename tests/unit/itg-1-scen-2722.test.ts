import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 報告修正期限管理機能', () => {
  // SCEN-2722
  test('修正操作時刻が朝会開始時刻を超過しているとき修正禁止エラーが発生する', () => {
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const currentTimestamp = new Date('2024-01-15T09:00:01Z');
    const submittedAt = new Date('2024-01-15T08:30:00Z');

    const modificationWindowConfig = {
      modificationDeadlineOffsetMinutes: 0,
      warningThresholdMinutes: 5,
    };

    const result = validateReportModificationWindow(
      {
        submittedAt: submittedAt.toISOString(),
        morningMeetingStartTime: morningMeetingStartTime.toISOString(),
      },
      modificationWindowConfig,
      currentTimestamp
    );

    expect(result.isModificationAllowed).toBe(false);
    expect(result.remainingMinutes).toBe(-1);
    expect(result.modificationDeadline).toEqual(morningMeetingStartTime);
    expect(result.reason).toMatch(/朝会開始時刻/);
  });
});