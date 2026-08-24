import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2639
  test('報告者ユーザーIDが空のとき、バリデーションエラーが発生して送信が中止される', () => {
    const input = {
      userId: '',
      teamId: 'team-001',
      yesterdayAccomplishment: 'システムの基本設計を完了した',
      todayPlan: 'データベーススキーマの実装を開始する',
      challenges: 'API仕様の確定待ち',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/報告者ユーザーID/);
  });
});