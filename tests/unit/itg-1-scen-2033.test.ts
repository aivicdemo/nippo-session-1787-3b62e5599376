import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2033: [error] 対策案・実行計画の必須項目検証 - 実行計画の終了日時がnullのとき検証エラーになる
  test('実行計画の終了日時がnullの場合、バリデーションエラーを返す', () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-A',
      yesterdayAccomplishment: '前日は顧客A向けのAPI開発を完了し、テスト環境での動作確認を実施しました。',
      todayPlan: '本日は顧客B向けのUI実装に着手し、デザイン仕様との照合を行います。',
      challenges: 'データベースの性能問題により、クエリのチューニングが必要です。',
      reportDate: '2024-01-15',
    };

    const executionPlan = {
      planId: 'plan-001',
      actionId: 'action-001',
      description: 'データベースクエリのチューニング',
      startDateTime: '2024-01-15T14:00:00Z',
      endDateTime: null,
      assignee: 'user-002',
      status: 'pending',
    };

    expect(() => submitDailyReport(input, executionPlan)).toThrow(/実行計画の終了日時は必須項目です/);
  });
});