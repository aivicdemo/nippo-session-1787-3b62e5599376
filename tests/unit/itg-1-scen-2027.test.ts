import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - submitDailyReport', () => {
  // SCEN-2027: [error] 対策案・実行計画の必須項目検証 - 対策案タイトルがnullのとき検証エラーになる
  test('should reject submission when countermeasure title is null', () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '昨日のタスク完了',
      todayPlan: '今日のタスク予定',
      challenges: '現在の課題内容',
      reportDate: '2024-01-15',
      countermeasureTitle: null,
      executionPlan: '実行予定内容',
    };

    expect(() => submitDailyReport(input)).toThrow(/対策案タイトル/);
  });
});