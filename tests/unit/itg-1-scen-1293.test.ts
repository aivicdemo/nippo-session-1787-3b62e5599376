import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能', () => {
  test('SCEN-1293: 課題キーワードが1件の日報から1件の抽出結果が返される', () => {
    // Setup: TextAnalysisServiceAdapterのモック
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 1,
          },
        ],
        totalKeywordCount: 1,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Setup: 入力データ
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Setup: 日報テキスト（テスト用）
    const reportText = 'データベースの接続エラーが発生している';

    // Execute: extractKeywordsメソッドを呼び出す
    const result = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // Assert: extractKeywordsが呼び出されたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();

    // Assert: 戻り値が約束を返す場合はresolveを待つ
    return result.then((resolvedResult: RankedIssueKeywordList) => {
      // Assert: 戻り値の配列の長さが1であることを確認
      expect(resolvedResult.keywords.length).toBe(1);

      // Assert: 最初の要素がキーワード情報を含むオブジェクトであることを確認
      const firstKeyword = resolvedResult.keywords[0];
      expect(firstKeyword.keyword).toBe('データベース接続エラー');
      expect(firstKeyword.frequency).toBe(1);
      expect(firstKeyword.rank).toBe(1);

      // Assert: 抽出結果の全体統計を確認
      expect(resolvedResult.totalKeywordCount).toBe(1);
      expect(resolvedResult.analysisperiodDays).toBe(1);
      expect(resolvedResult.extractedAt).toBeInstanceOf(Date);
    });
  });
});