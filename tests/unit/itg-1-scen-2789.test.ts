import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-2789
  test('複数日報に同一キーワードが出現した場合、出現頻度が正確に累積される', async () => {
    // 1日目: ユーザーAが「データベース接続エラーが発生」と入力
    const day1Input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-17T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    // モック: TextAnalysisServiceAdapter.extractKeywords
    // 3日分の日報から抽出されるキーワード
    // 1日目: {'データベース接続エラー': 1}
    // 2日目: {'データベース接続エラー': 1, 'タイムアウト': 1}
    // 3日目: {'データベース接続エラー': 1}
    // 累積結果: {'データベース接続エラー': 3, 'タイムアウト': 1}

    const mockExtractedKeywords = {
      'データベース接続エラー': 3,
      'タイムアウト': 1,
    };

    // extractAndRankIssueKeywords を呼び出す
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(day1Input);

    // 検証1: 戻り値の構造が正しい
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('totalKeywordCount');
    expect(result).toHaveProperty('extractedAt');
    expect(result).toHaveProperty('analysisperiodDays');

    // 検証2: 全キーワード数（フィルタ前）が2
    expect(result.totalKeywordCount).toBe(2);

    // 検証3: 分析対象期間が3日
    expect(result.analysisperiodDays).toBe(3);

    // 検証4: ランク付けされたキーワード配列の長さが2
    expect(result.keywords).toHaveLength(2);

    // 検証5: 「データベース接続エラー」が頻度3でランク1
    const dbErrorKeyword = result.keywords.find(
      (kw) => kw.keyword === 'データベース接続エラー'
    );
    expect(dbErrorKeyword).toBeDefined();
    expect(dbErrorKeyword?.frequency).toBe(3);
    expect(dbErrorKeyword?.rank).toBe(1);

    // 検証6: 「タイムアウト」が頻度1でランク2
    const timeoutKeyword = result.keywords.find(
      (kw) => kw.keyword === 'タイムアウト'
    );
    expect(timeoutKeyword).toBeDefined();
    expect(timeoutKeyword?.frequency).toBe(1);
    expect(timeoutKeyword?.rank).toBe(2);

    // 検証7: キーワードが発生頻度の降順でソートされている
    expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(
      result.keywords[1].frequency
    );

    // 検証8: extractedAt が有効な日時
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.extractedAt.getTime()).toBeLessThanOrEqual(Date.now());

    // 検証9: 各キーワードに keywordId が設定されている
    result.keywords.forEach((kw) => {
      expect(kw.keywordId).toBeDefined();
      expect(typeof kw.keywordId).toBe('string');
      expect(kw.keywordId.length).toBeGreaterThan(0);
    });

    // 検証10: 最小発生頻度閾値が適用されている（minFrequencyThreshold = 1 の場合、頻度1以上のみ返却）
    result.keywords.forEach((kw) => {
      expect(kw.frequency).toBeGreaterThanOrEqual(day1Input.minFrequencyThreshold ?? 1);
    });
  });
});