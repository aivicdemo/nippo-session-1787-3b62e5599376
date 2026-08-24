import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput, type ValidationError } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2211: [error] 朝会報告の入力検証機能 - 昨日やったことが最大文字数上限を超えるとき入力エラーが返される
  test('昨日やったことが2000文字を超えるとき、バリデーションエラーが返される', () => {
    const yesterdayAccomplishmentOverLimit = 'a'.repeat(2001);
    const validTodayPlan = '本日の有効な予定（100文字以内）';
    const validChallenges = '抱えている課題（100文字以内）';

    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: yesterdayAccomplishmentOverLimit,
      todayPlan: validTodayPlan,
      challenges: validChallenges,
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/文字数上限|最大文字数|2000文字/);
  });
});