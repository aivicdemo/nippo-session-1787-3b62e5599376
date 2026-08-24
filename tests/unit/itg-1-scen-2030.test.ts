import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2030: [error] 対策案・実行計画の必須項目検証 - 実行計画の開始日時が空のとき検証エラーになる
  test('実行計画の開始日時が空の場合、バリデーションエラーが発生し日報が送信されない', () => {
    const submitInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'テスト実施',
      todayPlan: 'テスト報告',
      challenges: 'システム検証',
      reportDate: '2026-08-24',
      countermeasure: '検証環境の拡充',
      executionPlan: {
        startDateTime: '', // 開始日時が空
        endDateTime: '2026-08-25T17:00:00Z',
        responsiblePerson: '田中太郎',
      },
    };

    expect(() => submitDailyReport(submitInput)).toThrow(/開始日時/);
  });
});