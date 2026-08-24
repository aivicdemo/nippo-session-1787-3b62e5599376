import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1449
  test('[error] 前週日報データ集約機能 - 集約対象期間（前週月曜～日曜）の開始日がnullの場合にエラーになる', () => {
    const weekStartDate = null as any;
    const weekEndDate = new Date('2026-08-17T23:59:59Z');
    const teamIds = ['team-001', 'team-002'];
    const requestedByUserId = 'user-001';

    expect(() => {
      extractWeeklyReportData({
        weekStartDate,
        weekEndDate,
        teamIds,
        requestedByUserId,
      });
    }).toThrow(/集約対象期間の開始日/);
  });
});