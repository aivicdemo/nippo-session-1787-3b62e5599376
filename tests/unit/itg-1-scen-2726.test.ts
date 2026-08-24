import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2726: [error] 報告修正期限管理機能 - 朝会開始時刻と修正操作時刻が同一タイムゾーンでないとき修正禁止エラーが発生する
  test('should reject modification when timezone mismatch between morning meeting start time and modification operation time', () => {
    const morningMeetingStartTime = new Date('2026-08-20T09:00:00+09:00');
    const modificationOperationTime = new Date('2026-08-20T20:20:00-04:00');

    const input = {
      submittedAt: '2026-08-20T08:55:00+09:00',
      morningMeetingStartTime: '09:00',
      currentTimestamp: modificationOperationTime,
      morningMeetingStartTimeDate: morningMeetingStartTime,
    };

    expect(() => {
      validateReportModificationWindow(input);
    }).toThrow(/タイムゾーン/);
  });
});