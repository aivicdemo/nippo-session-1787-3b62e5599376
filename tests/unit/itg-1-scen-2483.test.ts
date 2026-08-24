import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  test('SCEN-2483: 報告送信完了時刻が無効な日時形式のとき、エラーを返す', () => {
    const invalidDatetimeFormats = [
      '2024-13-45T25:70:90',
      'invalid-date',
      '2024/13/45',
      '2024-01-01',
      '2024-01-01T10:00:00',
      'not-a-timestamp',
      '2024-13-32T23:59:59.999Z',
      '',
    ];

    for (const invalidDatetime of invalidDatetimeFormats) {
      const input = {
        reportId: 'report-001',
        userId: 'user-123',
        submissionTimestamp: invalidDatetime as any,
        reportContent: {
          yesterdayAccomplishment: 'completed task A',
          todayPlan: 'plan task B',
          challenges: 'challenge C',
        },
      };

      expect(() => submitDailyReport(input)).toThrow(/日時形式/);
    }
  });
});