import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  test('SCEN-2029: 対策案の説明文がnullのとき検証エラーになる', () => {
    const input = {
      reportId: 'report-2024-001',
      userId: 'user-admin-001',
      submissionTimestamp: new Date('2024-01-15T09:30:00Z'),
      reportContent: {
        yesterdayAccomplishment: 'オンボーディング資料の作成完了、チームレビュー実施',
        todayPlan: '実装仕様書の作成、開発環境構築',
        challenges: 'APIレスポンスが遅延、キャッシング戦略を検討中'
      }
    };

    expect(() => submitDailyReport(input)).toThrow(/対策案の説明/);
  });
});