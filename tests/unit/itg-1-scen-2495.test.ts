import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2495: [error] 操作習熟度スコア計算機能 - 実習環境フラグがfalseのとき、エラーを返す
  test('実習環境フラグがfalseの場合、操作習熟度スコア計算エラーを返す', async () => {
    const submitInput = {
      userId: 'user-123',
      teamId: 'team-456',
      yesterdayAccomplishment: '前日のタスクを完了しました。',
      todayPlan: '本日は新機能の開発に取り組みます。',
      challenges: 'APIの仕様が不明確です。',
      reportDate: '2024-01-15',
      trainingEnvironmentFlag: false,
    };

    const result = await submitDailyReport(submitInput);

    expect(result).toEqual({
      code: 'TRAINING_ENVIRONMENT_FLAG_FALSE',
      message: '実習環境フラグがfalseの場合、操作習熟度スコア計算は実行できません',
      statusCode: 400,
    });
  });
});