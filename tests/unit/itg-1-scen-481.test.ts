import { searchAndRetrieveReports } from '../../src/logic/report-search-and-retrieval';

describe('朝会報告管理システム', () => {
  // SCEN-481: 類似度閾値が0未満のときはエラーを throw する
  test('should throw error when similarityThreshold is less than 0', () => {
    const dateRange = {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    };
    const keywords = ['データベース', '接続'];
    const teamIds = ['team1'];
    const reporterIds = ['user1'];

    expect(() =>
      searchAndRetrieveReports({
        dateRange,
        keywords,
        teamIds,
        reporterIds
      })
    ).toThrow(/類似度閾値/);
  });
});