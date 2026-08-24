import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  test('SCEN-1176: TextAnalysisServiceAdapter が正常応答した場合、抽出結果が発生頻度でランク付けされた一覧形式で返される', () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: '課題A', frequency: 5 },
        { keyword: '課題B', frequency: 3 },
        { keyword: '課題C', frequency: 1 }
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    const input_text = '昨日は〇〇を対応。今日は課題Aに取り組む。課題Aは継続中。課題Bも並行処理。課題Cが新規発生';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-001';

    // Act
    const result = extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold: 1,
        requestUserId
      },
      mockTextAnalysisServiceAdapter
    );

    // Assert
    // 返り値が Promise であることを確認
    expect(result).toBeInstanceOf(Promise);

    return result.then((rankedList) => {
      // keywords 配列が存在し、発生頻度の降順でソートされていることを確認
      expect(rankedList.keywords).toBeDefined();
      expect(rankedList.keywords).toHaveLength(3);

      // 1件目: 課題A (出現頻度 5)
      expect(rankedList.keywords[0]).toEqual({
        keywordId: expect.any(String),
        keyword: '課題A',
        frequency: 5,
        rank: 1
      });

      // 2件目: 課題B (出現頻度 3)
      expect(rankedList.keywords[1]).toEqual({
        keywordId: expect.any(String),
        keyword: '課題B',
        frequency: 3,
        rank: 2
      });

      // 3件目: 課題C (出現頻度 1)
      expect(rankedList.keywords[2]).toEqual({
        keywordId: expect.any(String),
        keyword: '課題C',
        frequency: 1,
        rank: 3
      });

      // 全キーワード数 (フィルタ前)
      expect(rankedList.totalKeywordCount).toBe(3);

      // 抽出実行日時が ISO 8601 形式の Date 型
      expect(rankedList.extractedAt).toBeInstanceOf(Date);

      // 分析対象期間の日数 (2024-01-08 から 2024-01-14 = 7日)
      expect(rankedList.analysisperiodDays).toBe(7);

      // TextAnalysisServiceAdapter.extractKeywords が呼び出されたことを確認
      expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(1);
    });
  });
});