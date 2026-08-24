import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信処理', () => {
  test('SCEN-2486: ログイン時刻が報告送信時刻より後の場合、エラーを返す', () => {
    const input: SubmitDailyReportInput = {
      userId: 'test-user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'テスト実施完了',
      todayPlan: 'テスト結果確認',
      challenges: 'テスト項目の漏れ検出',
      reportDate: '2026-08-20',
    };

    const loginTimestamp = new Date('2026-08-20T09:15:00Z');
    const submissionTimestamp = new Date('2026-08-20T09:10:00Z');

    const result = submitDailyReport(input, {
      currentTime: submissionTimestamp,
      userLoginTime: loginTimestamp,
    });

    expect(result).toHaveProperty('errorCode', 'INVALID_TIMESTAMP_ORDER');
    expect(result).toHaveProperty('message');
    expect(result.message).toMatch(/ログイン時刻/);
    expect(result).toHaveProperty('proficiencyScore', null);
  });
});