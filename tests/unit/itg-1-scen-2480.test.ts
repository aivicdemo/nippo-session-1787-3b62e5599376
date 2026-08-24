import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2480: [error] 操作習熟度スコア計算機能 - ログイン完了時刻が欠落しているとき、エラーを返す
  test('ログイン完了時刻が欠落している場合、MISSING_LOGIN_TIMESTAMPエラーを返す', () => {
    const input = {
      reportId: 'report-001',
      userId: 'user-123',
      submissionTimestamp: new Date('2024-01-15T09:30:00Z'),
      reportContent: {
        yesterdayAccomplishment: 'システム設計ドキュメント作成',
        todayPlan: '実装フェーズ開始',
        challenges: 'API仕様の調整が必要',
      },
    };

    const result = submitDailyReport(input, null);

    expect(result).toHaveProperty('errorCode', 'MISSING_LOGIN_TIMESTAMP');
    expect(result).toHaveProperty('message');
    expect(result.message).toMatch(/ログイン完了時刻/);
    expect(result).toHaveProperty('operationalSkillScore', null);
  });
});