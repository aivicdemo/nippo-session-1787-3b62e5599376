import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2494: [error] 操作習熟度スコア計算機能 - 実習環境で実施されたことを示すフラグが欠落しているとき、エラーを返す
  test('実習環境フラグが欠落している場合、エラーを返す', () => {
    const input: SubmitDailyReportInput & { isTrainingEnvironment?: boolean } = {
      userId: 'eng-001',
      teamId: 'team-qa',
      yesterdayAccomplishment: 'データベースのインデックス最適化を実施し、クエリ実行時間を30%削減した',
      todayPlan: 'ユーザー認証機能のテスト実装とコードレビュー対応',
      challenges: 'フロントエンド側の状態管理が複雑になってきており、リファクタリングが必要',
      reportDate: '2024-01-15',
      // isTrainingEnvironment フラグを意図的に欠落させる
    };

    const result = submitDailyReport(input);

    // エラーが発生し、エラーコードと メッセージが正しく返されることを確認
    expect(result).toBeDefined();
    expect(result).toEqual({
      code: 'MISSING_TRAINING_ENVIRONMENT_FLAG',
      message: '実習環境フラグが指定されていません。スコア計算を中止します。',
    });
  });
});