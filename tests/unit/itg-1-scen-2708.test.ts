import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 報告内容修正受付判定', () => {
  // SCEN-2708: [normal] 報告内容修正受付判定機能 - 朝会開始時刻前に修正操作を行った場合、修正が受け付けられる
  test('朝会開始時刻の前に修正操作を行った場合、修正が受け付けられる', () => {
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const currentTimestamp = new Date('2024-01-15T08:57:00Z');

    const result = validateReportModificationWindow({
      submittedAt: new Date('2024-01-15T08:30:00Z'),
      currentTimestamp,
      morningMeetingStartTime,
    });

    expect(result.isModificationAllowed).toBe(true);
    expect(result.remainingMinutes).toBe(3);
    expect(result.modificationDeadline).toEqual(morningMeetingStartTime);
    expect(result.reason).toBeUndefined();
  });
});