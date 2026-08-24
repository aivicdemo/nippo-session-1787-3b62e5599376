import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2645: [error] 初回テスト報告入力検証機能 - 課題重要度分類が実行されていないとき不合格判定となる
  test('課題の重要度分類が未分類のとき送信に失敗し、エラーメッセージを表示する', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'サーバー接続エラー', frequency: 1 }
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue(null)
    };

    const submitDailyReportInput: SubmitDailyReportInput = {
      userId: 'test-user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'APIサーバーの動作確認を完了',
      todayPlan: 'バッチ処理の最適化を進める',
      challenges: 'サーバー接続エラーが多発',
      reportDate: '2024-01-15'
    };

    await expect(
      submitDailyReport(submitDailyReportInput, mockTextAnalysisServiceAdapter)
    ).rejects.toThrow(/課題の重要度分類/);
  });
});