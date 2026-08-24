import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1436
  test('前週7日間（月曜～日曜）の日報が0件のとき、空の課題データが返される', () => {
    // Arrange: 前週月曜日から日曜日までの期間を指定
    const weekStartDate = new Date('2024-01-01T00:00:00Z'); // 月曜日
    const weekEndDate = new Date('2024-01-07T23:59:59Z');   // 日曜日
    const teamIds = ['team-001'];
    const requestedByUserId = 'user-001';

    // Act: 前週日報データ集約機能を呼び出す
    const result = extractWeeklyReportData({
      weekStartDate,
      weekEndDate,
      teamIds,
      requestedByUserId,
    });

    // Assert: 返却されたレスポンスを検証
    expect(result.extractedChallenges).toEqual([]);
    expect(result.totalReportsExtracted).toBe(0);
    expect(result.reportsByDate).toEqual([]);
    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);
    expect(result.dataQualityScore).toBe(0);
  });
});