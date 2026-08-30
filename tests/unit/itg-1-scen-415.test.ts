import { searchAndRetrieveReports } from '../../src/logic/report-search-and-retrieval';

describe('朝会報告管理システム - レポート検索・抽出', () => {
  test('SCEN-415: 過去日数が0以下の場合はエラーをスローする', () => {
    const searchInput = {
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      },
      keywords: ['バグ', '遅延'],
      teamIds: ['team-001'],
      reporterIds: ['reporter-001'],
    };

    const invalidLookbackDays = 0;

    expect(() => {
      searchAndRetrieveReports(searchInput, invalidLookbackDays);
    }).toThrow(/過去日数/);
  });
});