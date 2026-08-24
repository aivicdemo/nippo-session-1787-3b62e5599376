import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-617
  test('TextAnalysisServiceAdapterが正常応答した場合、キーワードが正しく抽出されてランク付けされる', () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを作成
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { term: '顧客対応', frequency: 3 },
          { term: 'API連携', frequency: 2 },
          { term: 'バグ修正', frequency: 1 }
        ],
        status: 'success'
      })
    };

    const challengeText = '顧客対応に関する問い合わせが3件発生。API連携のテストで問題が見つかった。バグ修正が必要。';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');
    const minFrequencyThreshold = 1;

    // Act: extractAndRankIssueKeywordsを呼び出す
    const result = extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold,
        requestUserId: 'user-001'
      },
      mockTextAnalysisServiceAdapter
    );

    // Assert: 結果が Promise であることを確認してから検証
    return result.then((rankedKeywordList) => {
      // キーワードが出現頻度順に正しくランク付けされていることを検証
      expect(rankedKeywordList.keywords).toHaveLength(3);
      
      expect(rankedKeywordList.keywords[0]).toEqual({
        keywordId: expect.any(String),
        keyword: '顧客対応',
        frequency: 3,
        rank: 1
      });
      
      expect(rankedKeywordList.keywords[1]).toEqual({
        keywordId: expect.any(String),
        keyword: 'API連携',
        frequency: 2,
        rank: 2
      });
      
      expect(rankedKeywordList.keywords[2]).toEqual({
        keywordId: expect.any(String),
        keyword: 'バグ修正',
        frequency: 1,
        rank: 3
      });

      // 全キーワード数の検証
      expect(rankedKeywordList.totalKeywordCount).toBe(3);

      // 抽出日時が記録されていることを検証
      expect(rankedKeywordList.extractedAt).toBeInstanceOf(Date);

      // 分析対象期間の日数を検証（1月1日から1月31日までの31日間）
      expect(rankedKeywordList.analysisperiodDays).toBe(31);

      // TextAnalysisServiceAdapterのextractKeywordsメソッドが呼び出されたことを検証
      expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId,
          startDate,
          endDate,
          minFrequencyThreshold
        })
      );
    });
  });
});