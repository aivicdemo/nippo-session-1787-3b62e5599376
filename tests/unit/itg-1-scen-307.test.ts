import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-307: [normal] 日報入力フォーム検証機能 - 昨日やったことが空白でなく文字数制限内のとき検証を通す
  test('should pass validation when yesterdayAccomplishment is non-empty and within character limit', () => {
    const validInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '既存システムのバグ修正、テスト設計書作成',
      todayPlan: '今日のタスク進行、チーム会議参加',
      challenges: '外部APIの遅延問題対応',
      reportDate: '2024-01-15'
    };

    const result = submitDailyReport(validInput);

    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(result.isWithinDeadline).toBe(true);
  });
});