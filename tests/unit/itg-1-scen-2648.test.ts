import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2648: [error] 初回テスト報告入力検証機能 - エンジニアロールが報告者に付与されていないとき不合格判定となる
  test('エンジニアロールが付与されていないユーザーが日報を送信しようとすると、バリデーションエラーが発生し日報は保存されない', () => {
    const userIdWithoutEngineerRole = 'user-no-engineer-role';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const yesterdayAccomplishment = 'タスクA完了';
    const todayPlan = 'タスクB開始';
    const challenges = '対応遅延';

    const submitDailyReportInput = {
      userId: userIdWithoutEngineerRole,
      teamId: teamId,
      yesterdayAccomplishment: yesterdayAccomplishment,
      todayPlan: todayPlan,
      challenges: challenges,
      reportDate: reportDate,
    };

    expect(() => submitDailyReport(submitDailyReportInput)).toThrow(/エンジニアロール/);
  });
});