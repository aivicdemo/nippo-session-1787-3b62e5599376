import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1451
  test('前週日報データ集約機能 - 開始日が終了日より後の日付である場合にエラーになる', () => {
    const weekStartDate = new Date('2026-08-25T00:00:00Z');
    const weekEndDate = new Date('2026-08-20T23:59:59Z');
    const teamIds = ['team-001'];
    const requestedByUserId = 'user-001';

    expect(() => {
      extractWeeklyReportData({
        weekStartDate,
        weekEndDate,
        teamIds,
        requestedByUserId,
      });
    }).toThrow(/開始日/);
  });
});