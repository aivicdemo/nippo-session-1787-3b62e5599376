import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 報告修正期限管理機能', () => {
  test('SCEN-2719: 朝会開始時刻が無効な日時フォーマットのとき修正禁止エラーが発生する', () => {
    // 無効な日時フォーマットテストケース群
    const invalidDateTimeFormats = [
      '2024/13/45 25:99:99',
      'invalid-datetime',
      '2024-13-45 25:99:99',
      'abc-def-ghi jk:lm:no',
      '2024-01-01',
      '10:30:00',
      '',
      '   ',
      '2024-01-01T10:30:00Z25:99:99',
      'not a date',
    ];

    for (const invalidFormat of invalidDateTimeFormats) {
      const reportModificationInput = {
        submittedAt: '2024-01-15T08:00:00Z',
        morningMeetingStartTime: invalidFormat,
      };

      expect(() => {
        validateReportModificationWindow(reportModificationInput);
      }).toThrow(/朝会開始時刻.*有効な日時フォーマット/i);
    }
  });
});