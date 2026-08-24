import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('前日報告内容の取得・表示機能', () => {
  // SCEN-2679
  test('同じエンジニアのユーザーIDで2回連続して報告取得した場合、同じ結果が返される', async () => {
    const engineerId = 'eng_001';
    const targetDate = new Date('2024-01-15');
    const requestingUserId = 'eng_001';

    const expectedReport: DailyReport = {
      reportId: 'report_20240114_eng_001',
      engineerId: 'eng_001',
      reportDate: new Date('2024-01-14'),
      yesterdayAccomplishment: 'ユーザー認証機能の実装完了、テスト環境での動作確認実施',
      todayPlan: 'エラーハンドリング処理の追加実装、統合テストの実施',
      challenges: 'データベース接続タイムアウトの問題が発生中、解決方法を検討中',
      submittedAt: new Date('2024-01-14T09:30:00Z'),
    };

    const firstCallResult = await fetchYesterdayReport({
      engineerId,
      targetDate,
      requestingUserId,
    });

    const secondCallResult = await fetchYesterdayReport({
      engineerId,
      targetDate,
      requestingUserId,
    });

    expect(firstCallResult).toEqual(expectedReport);
    expect(secondCallResult).toEqual(expectedReport);
    expect(firstCallResult.reportId).toBe(secondCallResult.reportId);
    expect(firstCallResult.yesterdayAccomplishment).toBe(
      secondCallResult.yesterdayAccomplishment
    );
    expect(firstCallResult.todayPlan).toBe(secondCallResult.todayPlan);
    expect(firstCallResult.challenges).toBe(secondCallResult.challenges);
    expect(firstCallResult.submittedAt.getTime()).toBe(
      secondCallResult.submittedAt.getTime()
    );
  });
});

interface DailyReport {
  reportId: string;
  engineerId: string;
  reportDate: Date;
  yesterdayAccomplishment: string;
  todayPlan: string;
  challenges: string;
  submittedAt: Date;
}