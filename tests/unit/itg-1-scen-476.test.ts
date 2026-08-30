import { searchAndRetrieveReports } from '../../src/logic/report-search-and-retrieval';

describe('朝会報告管理システム - 日報検索・抽出', () => {
  // SCEN-476
  test('検索キーワードが空の配列の場合、1つ以上のキーワードを指定するエラーをスロー', () => {
    const searchCondition = {
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-15'),
      keywordFilter: [],
      userId: 'dev-manager-001',
    };

    expect(() => searchAndRetrieveReports(searchCondition)).toThrow(/キーワード/);
  });
});