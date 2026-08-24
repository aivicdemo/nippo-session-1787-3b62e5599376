import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-308: [normal] 日報入力フォーム検証機能 - 今日やることが空白でなく文字数制限内のとき検証を通す
  test('should validate daily report successfully when todayPlan is non-empty and within character limit', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'プロジェクトBのレビュー完了',
      todayPlan: '顧客Aの提案資料作成',
      challenges: 'リソース不足',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);
    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(result.isWithinDeadline).toBe(true);
  });
});