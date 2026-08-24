import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('朝会報告管理システム - 前日報告内容の取得', () => {
  // SCEN-2677: [normal] 前日報告内容の取得・表示機能 - 取得した報告内容に『今日やること』フィールドが含まれている
  test('前日報告を取得した際にtodayWorkフィールドが含まれ値が一致すること', async () => {
    const engineerId = 'user001';
    const targetDate = new Date('2026-08-18');
    const requestingUserId = 'user001';

    const mockReport: DailyReport = {
      reportId: 'report-001',
      engineerId: 'user001',
      reportDate: new Date('2026-08-18'),
      yesterdayAccomplishment: '顧客Aの要件ヒアリング完了',
      todayPlan: 'テスト仕様書作成',
      challenges: 'API仕様の確認待ち',
      submittedAt: new Date('2026-08-18T08:00:00Z'),
    };

    const result = await fetchYesterdayReport({
      engineerId,
      targetDate,
      requestingUserId,
    });

    expect(result).toEqual(
      expect.objectContaining({
        reportId: 'report-001',
        engineerId: 'user001',
        reportDate: expect.any(Date),
        yesterdayAccomplishment: '顧客Aの要件ヒアリング完了',
        todayPlan: 'テスト仕様書作成',
        challenges: 'API仕様の確認待ち',
        submittedAt: expect.any(Date),
      })
    );

    expect(result.todayPlan).toBe('テスト仕様書作成');
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