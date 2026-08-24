import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('部長向けダッシュボードのリアルタイム提出状況表示機能', () => {
  test('SCEN-259: 報告送信時刻が報告期限を超過している場合、送信処理を中断しエラーメッセージを表示', () => {
    const reportDeadline = new Date('2026-08-20T09:00:00Z');
    const submissionTimestamp = new Date('2026-08-20T09:30:00Z');

    const submitInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'データベース設計と初期実装を完了した',
      todayPlan: 'API開発とテスト実装を予定している',
      challenges: 'チーム間の連携が不足気味なので調整が必要',
      reportDate: '2026-08-20',
    };

    expect(() =>
      submitDailyReport(submitInput, submissionTimestamp, reportDeadline)
    ).toThrow(/報告期限/);
  });
});