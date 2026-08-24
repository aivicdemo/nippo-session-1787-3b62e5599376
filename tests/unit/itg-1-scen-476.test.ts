import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  test('SCEN-476: [normal] 課題自動抽出・優先度判定機能 - 抽出されたキーワードに対してチーム波及度スコア（0-100）が算出される', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続エラー', frequency: 3 },
          { keyword: 'API レスポンス遅延', frequency: 2 }
        ]
      }),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce({ keyword: 'データベース接続エラー', impactScore: 72 })
        .mockResolvedValueOnce({ keyword: 'API レスポンス遅延', impactScore: 58 })
    };

    const input = {
      challengeText: 'DBがたまに繋がらなくなる。API呼び出しが遅い',
      teamId: 'team-001',
      analysisTimestamp: new Date('2024-01-15T10:30:00Z')
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    expect(result).toBeDefined();
    expect(result.rankedKeywords).toHaveLength(2);

    expect(result.rankedKeywords[0]).toEqual({
      keyword: 'データベース接続エラー',
      impactScore: 72,
      frequency: 3,
      rank: 1
    });

    expect(result.rankedKeywords[1]).toEqual({
      keyword: 'API レスポンス遅延',
      impactScore: 58,
      frequency: 2,
      rank: 2
    });

    expect(result.keywordDictionary).toContainEqual({
      keyword: 'データベース接続エラー',
      impactScore: 72
    });

    expect(result.keywordDictionary).toContainEqual({
      keyword: 'API レスポンス遅延',
      impactScore: 58
    });

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        challengeText: 'DBがたまに繋がらなくなる。API呼び出しが遅い',
        teamId: 'team-001'
      })
    );

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(2);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ keyword: 'データベース接続エラー' })
    );
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ keyword: 'API レスポンス遅延' })
    );
  });
});