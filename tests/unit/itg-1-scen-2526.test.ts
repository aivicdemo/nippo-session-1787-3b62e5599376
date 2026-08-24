import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 初回テスト報告入力検証', () => {
  // SCEN-2526: [error] 初回テスト報告の入力検証 - 課題の重要度レベルが許可された値の範囲外のとき入力検証エラーが返される
  test('重要度レベルが許可された範囲外の値のとき入力検証エラーが返される', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '前日のタスクを完了した',
      todayPlan: '本日のタスク予定を実施する',
      challenges: '課題の説明',
      challengeSeverity: '超高' as any,
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/重要度レベル/);
  });
});