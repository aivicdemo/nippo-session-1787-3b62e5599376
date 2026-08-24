import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度ランク付け機能', () => {
  // SCEN-1632
  test('抽出されたキーワードの出現頻度が負の値のとき、処理を中止しエラーを返す', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: 'データベース接続', frequency: -5 },
          { keyword: '機能A実装', frequency: 3 }
        ]
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    const reportText = '昨日は機能Aの実装を行った。今日は機能Bのテストを実施。課題：データベース接続が不安定';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-director-001';

    const result = extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold: 1,
        requestUserId
      },
      mockTextAnalysisAdapter
    );

    expect(result).toHaveProperty('error');
    expect(result.error).toEqual(
      expect.objectContaining({
        code: 'INVALID_KEYWORD_FREQUENCY',
        message: expect.stringMatching(/キーワード出現頻度が無効な値です/)
      })
    );
    expect(result).not.toHaveProperty('keywords');
    expect(result).not.toHaveProperty('totalKeywordCount');
  });
});