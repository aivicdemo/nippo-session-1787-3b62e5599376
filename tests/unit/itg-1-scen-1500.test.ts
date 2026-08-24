import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1500
  test('キーワードの発生頻度が負数のとき、エラーを返す', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース障害', frequency: -5 },
          { keyword: 'パフォーマンス問題', frequency: 3 }
        ]
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001'
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter)
    ).rejects.toThrow(/frequency|出現頻度|負数/i);
  });
});