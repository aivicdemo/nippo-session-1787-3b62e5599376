import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  test('SCEN-2487: [error] 操作習熟度スコア計算機能 - ログイン時刻と報告送信時刻が同一のとき、エラーを返す', () => {
    const userId = 'user_001';
    const teamId = 'team_001';
    const loginTime = new Date('2026-08-19T09:00:00Z');
    const submissionTime = new Date('2026-08-19T09:00:00Z');
    const reportDate = '2026-08-19';

    const input = {
      userId: userId,
      teamId: teamId,
      yesterdayAccomplishment: 'テスト項目1',
      todayPlan: 'テスト項目2',
      challenges: 'テスト項目3',
      reportDate: reportDate,
      submissionTimestamp: submissionTime,
      loginTimestamp: loginTime,
    };

    const result = submitDailyReport(input);

    expect(result).toEqual({
      code: 'INVALID_SUBMISSION_TIME',
      message: 'ログイン時刻と報告送信時刻が同一です。報告には最小1秒以上の入力時間が必要です。',
      submissionTimeError: true,
    });
    expect(result.code).toBe('INVALID_SUBMISSION_TIME');
    expect(result.submissionTimeError).toBe(true);
  });
});