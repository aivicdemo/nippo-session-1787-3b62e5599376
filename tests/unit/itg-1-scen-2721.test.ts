import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 報告修正期限管理機能', () => {
  // SCEN-2721: [error] 報告修正期限管理機能 - 修正操作時刻が無効な日時フォーマットのとき修正禁止エラーが発生する
  test('修正操作時刻が無効な日時フォーマットのとき修正禁止エラーが発生する', () => {
    const invalidDateFormats = [
      '2024-13-45 25:99:99',
      'invalid-date',
      '2024/13/45',
      'not-a-date-string',
      '',
      '2024-01-01',
      '25:99:99',
      '2024-01-01 25:00:00',
      '2024-13-01 12:00:00',
      'Thu Jan 01 2024 12:00:00 GMT+0000',
    ];

    const validMorningMeetingStartTime = new Date('2024-01-15T09:00:00Z');

    invalidDateFormats.forEach((invalidFormat) => {
      expect(() => {
        validateReportModificationWindow({
          submittedAt: invalidFormat,
          morningMeetingStartTime: validMorningMeetingStartTime,
        });
      }).toThrow(/日時形式|日時|修正操作時刻/i);
    });
  });
});