import { submitDailyReport } from '../../src/logic/report-submission';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2018
  test('対策案の必須項目検証 - 対策案登録時に必須項目がすべて入力されている場合、検証が完了する', () => {
    const engineerId = 'user-001';
    const yesterdayAccomplishment = '顧客A社の要件定義完了';
    const todayPlan = '開発環境構築';
    const currentChallenges = 'データベース接続テスト';

    const input = {
      engineerId,
      yesterdayAccomplishment,
      todayPlan,
      currentChallenges,
    };

    const result = submitDailyReport(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.isWithinDeadline).toBeDefined();
    expect(typeof result.isWithinDeadline).toBe('boolean');
  });
});