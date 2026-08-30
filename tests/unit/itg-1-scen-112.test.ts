import { searchAndRetrieveReports, type ReportSearchCondition } from '../../src/logic/report-search-and-retrieval';

describe('朝会報告管理システム - 日報検索・抽出機能', () => {
  // SCEN-112: [error] 指定された日付範囲とキーワード条件で日報を検索・抽出し、発生頻度順にランク付けして表示用に整形する。 - 開始日が終了日より後、または日付範囲が30日を超える場合。のとき検索期間は終了日以前で、30日以内で指定してください。となる
  test('日付範囲の検証: 開始日が終了日より後の場合、期間超過エラーをスローする', () => {
    const condition: ReportSearchCondition = {
      startDate: new Date('2026-01-20T00:00:00Z'),
      endDate: new Date('2026-01-10T00:00:00Z'),
      keywordFilter: [],
      userId: 'user123',
    };

    expect(() => searchAndRetrieveReports(condition)).toThrow(/検索期間は終了日以前で、30日以内で指定してください/);
  });

  test('日付範囲の検証: 日付範囲が30日を超える場合、期間超過エラーをスローする', () => {
    const condition: ReportSearchCondition = {
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-02-01T00:00:00Z'),
      keywordFilter: [],
      userId: 'user123',
    };

    expect(() => searchAndRetrieveReports(condition)).toThrow(/検索期間は終了日以前で、30日以内で指定してください/);
  });

  test('日付範囲の検証: startDate と endDate が同一の場合は許可される', () => {
    const condition: ReportSearchCondition = {
      startDate: new Date('2026-01-15T00:00:00Z'),
      endDate: new Date('2026-01-15T00:00:00Z'),
      keywordFilter: [],
      userId: 'user123',
    };

    const result = searchAndRetrieveReports(condition);

    expect(result).toBeDefined();
    expect(result.totalCount).toBe(0);
    expect(result.issues).toEqual([]);
    expect(result.searchExecutedAt).toBeDefined();
    expect(result.deduplicationSummary).toBeDefined();
  });
});