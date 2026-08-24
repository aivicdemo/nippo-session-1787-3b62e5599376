import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2043: [error] 対策案・実行計画の必須項目検証 - 対策案タイトルが最大文字数を超えるとき検証エラーになる
  test('対策案タイトルが101文字以上のとき、検証エラーを発生させる', () => {
    const counterMeasureTitleOver100Chars = 'a'.repeat(101);

    const submitInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Database optimization completed',
      todayPlan: 'API testing and documentation',
      challenges: 'Performance bottleneck in query',
      reportDate: '2024-01-15',
      counterMeasureTitle: counterMeasureTitleOver100Chars,
      challengeKeyword: 'database-performance',
      challengeDescription: 'Slow query response time',
    };

    expect(() => submitDailyReport(submitInput)).toThrow(/対策案タイトル|100文字/);
  });
});