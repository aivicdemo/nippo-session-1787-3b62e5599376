import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  test('SCEN-1163: 複数抽出課題を優先度スコア順に並び替える時に、スコア逆順（降順）で正しく並べ替えられる', () => {
    // テスト対象のシナリオ：複数の課題を優先度スコアで降順にソートして返す
    const input: Parameters<typeof extractAndRankIssueKeywords>[0] = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // モック用のTextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keywordId: 'kw-a', keyword: '課題A', frequency: 3 },
          { keywordId: 'kw-b', keyword: '課題B', frequency: 5 },
          { keywordId: 'kw-c', keyword: '課題C', frequency: 2 },
          { keywordId: 'kw-d', keyword: '課題D', frequency: 4 },
        ],
      }),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce(45) // 課題A
        .mockResolvedValueOnce(89) // 課題B
        .mockResolvedValueOnce(23) // 課題C
        .mockResolvedValueOnce(67), // 課題D
      classifyIssueSeverity: jest.fn(),
    };

    // 関数を呼び出す（モックアダプターを依存注入）
    const result = extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    // 結果が Promise を返す場合、awaitする
    return result.then((rankedList) => {
      // 期待結果の検証：降順（スコア値が高い順）に並べ替えられていること
      expect(rankedList.keywords).toHaveLength(4);
      
      // スコア値と順序を検証
      expect(rankedList.keywords[0]).toMatchObject({
        keywordId: 'kw-b',
        keyword: '課題B',
        frequency: 5,
        rank: 1,
      });
      
      expect(rankedList.keywords[1]).toMatchObject({
        keywordId: 'kw-d',
        keyword: '課題D',
        frequency: 4,
        rank: 2,
      });
      
      expect(rankedList.keywords[2]).toMatchObject({
        keywordId: 'kw-a',
        keyword: '課題A',
        frequency: 3,
        rank: 3,
      });
      
      expect(rankedList.keywords[3]).toMatchObject({
        keywordId: 'kw-c',
        keyword: '課題C',
        frequency: 2,
        rank: 4,
      });

      // 全体の統計情報を検証
      expect(rankedList.totalKeywordCount).toBe(4);
      expect(rankedList.analysisperiodDays).toBe(31);
      expect(rankedList.extractedAt).toBeInstanceOf(Date);
    });
  });
});