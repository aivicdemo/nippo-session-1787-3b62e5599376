import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム集計機能', () => {
  // SCEN-412
  test('対象日付が不正なフォーマットのとき処理が中断されエラーを返す', () => {
    const invalidDateFormats = [
      '2024/13/45',
      '2024-13-45',
      'invalid-date',
      '',
      '2024-01',
      '2024',
      '01-01-2024',
      '2024-1-1',
      null as any,
      undefined as any,
    ];

    for (const invalidDate of invalidDateFormats) {
      const input = {
        teamId: 'team-001',
        reportDate: invalidDate,
        requestUserId: 'user-001',
        includeDelayedSubmissions: true,
      };

      expect(() => aggregateReportSubmissionStatus(input)).toThrow(/YYYY-MM-DD形式/);
    }
  });
});