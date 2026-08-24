import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告の課題抽出・優先度判定機能', () => {
  test('SCEN-2649: 集合研修未受講ユーザーが報告を送信するとき検証エラーが発生し送信が拒否される', () => {
    const input = {
      userId: 'TEST_USER_001',
      teamId: 'TEAM_A',
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      challenges: 'リソース不足',
      reportDate: '2024-01-15',
      hasCompletedTraining: false,
    };

    expect(() => submitDailyReport(input)).toThrow(/集合研修/);
  });
});