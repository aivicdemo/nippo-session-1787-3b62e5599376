import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-323
  test('朝会報告入力フォーム検証 - 「昨日やったこと」項目が文字数制限を超過したときエラーが表示される', () => {
    const MAX_YESTERDAY_ACCOMPLISHMENT_LENGTH = 400;
    const EXCEEDED_TEXT = 'a'.repeat(500);
    const VALID_TEXT = 'a'.repeat(300);
    const VALID_TODAY_PLAN = 'b'.repeat(300);
    const VALID_CHALLENGES = 'c'.repeat(300);

    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: EXCEEDED_TEXT,
      todayPlan: VALID_TODAY_PLAN,
      challenges: VALID_CHALLENGES,
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/文字数/);
  });
});