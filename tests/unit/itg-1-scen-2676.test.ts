import { fetchYesterdayReport } from '../../src/logic/report-submission';
import { type DailyReport } from '../../src/logic/report-submission';

describe('朝会報告管理システム - 前日報告内容の取得・表示機能', () => {
  // SCEN-2676
  test('取得した報告内容に「やったこと」フィールドが含まれている', async () => {
    // 入力パラメータ
    const engineerId = 'user001';
    const targetDate = new Date('2026-08-18');
    const requestingUserId = 'user001';

    // テストデータベースに登録された前日報告レコード
    // ユーザーID='user001'、報告日='2026-08-18'
    // 『やったこと』='昨日はシステムAの不具合対応を行いました'
    // 『今日やること』='テスト環境の構築'
    // 『抱えている課題』='データベース接続タイムアウト'

    const report: DailyReport = await fetchYesterdayReport({
      engineerId,
      targetDate,
      requestingUserId,
    });

    // 期待結果：取得した報告内容が以下の内容を含むことを検証
    // - 『やったこと』フィールドが存在し、値が『昨日はシステムAの不具合対応を行いました』と一致
    // - 『今日やること』フィールドが存在し、値が『テスト環境の構築』
    // - 『抱えている課題』フィールドが存在し、値が『データベース接続タイムアウト』

    expect(report).toEqual(
      expect.objectContaining({
        reportId: expect.any(String),
        engineerId: 'user001',
        reportDate: new Date('2026-08-18'),
        yesterdayAccomplishment: '昨日はシステムAの不具合対応を行いました',
        todayPlan: 'テスト環境の構築',
        challenges: 'データベース接続タイムアウト',
        submittedAt: expect.any(Date),
      })
    );

    // 『やったこと』フィールド（yesterdayAccomplishment）の検証
    expect(report.yesterdayAccomplishment).toBe(
      '昨日はシステムAの不具合対応を行いました'
    );

    // 『今日やること』フィールド（todayPlan）の検証
    expect(report.todayPlan).toBe('テスト環境の構築');

    // 『抱えている課題』フィールド（challenges）の検証
    expect(report.challenges).toBe('データベース接続タイムアウト');

    // 報告IDとユーザーIDの検証
    expect(report.reportId).toBeDefined();
    expect(report.engineerId).toBe('user001');

    // 報告日付の検証
    expect(report.reportDate).toEqual(new Date('2026-08-18'));

    // 提出日時の検証（存在することを確認）
    expect(report.submittedAt).toBeInstanceOf(Date);
  });
});