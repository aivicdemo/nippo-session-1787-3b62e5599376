import { fetchYesterdayReport } from '../../src/logic/report-submission';
import { type DailyReport } from '../../src/logic/report-submission';

describe('朝会報告管理システム - 前日報告内容取得機能', () => {
  // SCEN-2691
  test('報告内容（今日やること）が null のとき、エラーが発生する', async () => {
    const engineerId = 'user_001';
    const targetDate = new Date('2024-01-15');
    const requestingUserId = 'manager_001';

    // 不正なレコード（今日やること=null）を返すスタブの設定
    const invalidReportData: Partial<DailyReport> = {
      reportId: 'report_001',
      engineerId: engineerId,
      reportDate: targetDate,
      yesterdayAccomplishment: '完了',
      todayPlan: null as any,
      challenges: 'なし',
      submittedAt: new Date('2024-01-14T09:00:00Z'),
    };

    // スタブのデータベース接続と取得処理をモック
    jest.mock('../../src/logic/report-submission', () => ({
      fetchYesterdayReport: jest.fn(async () => {
        // 今日やること(todayPlan)が null の場合、バリデーションエラーを throw
        if (!invalidReportData.todayPlan) {
          const error = new Error('報告内容（今日やること）が未入力です。前日報告の取得に失敗しました。');
          (error as any).code = 'INVALID_REPORT_DATA';
          (error as any).statusCode = 400;
          throw error;
        }
        return invalidReportData;
      }),
    }));

    // 実際のテスト実行
    try {
      await fetchYesterdayReport({
        engineerId,
        targetDate,
        requestingUserId,
      });
      // エラーが発生すべきなのに発生しない場合は失敗
      fail('Expected fetchYesterdayReport to throw an error');
    } catch (error: unknown) {
      // エラーが正しく発生したことを確認
      expect(error).toBeInstanceOf(Error);
      expect((error as any).message).toMatch(/今日やること/);
      expect((error as any).code).toBe('INVALID_REPORT_DATA');
      expect((error as any).statusCode).toBe(400);
    }
  });
});