import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2032: [error] 対策案・実行計画の必須項目検証 - 実行計画の終了日時が空のとき検証エラーになる
  test('実行計画の終了日時が空のとき、バリデーションエラーを返す', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      challenges: 'リソース不足',
      reportDate: '2026-08-20',
      countermeasure: '人員追加要望',
      executionPlanStartTime: '2026-08-20T09:00:00',
      executionPlanEndTime: '',
    };

    expect(() => submitDailyReport(input)).toThrow(/終了日時/);
  });
});