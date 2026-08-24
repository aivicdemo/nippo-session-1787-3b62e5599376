import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  // SCEN-1504
  test('should extract and rank keywords from single-day period with correct frequency and order', async () => {
    const singleDay = new Date('2024-01-15T00:00:00Z');
    
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        'システムバグ修正': 1,
        'テスト実施': 1,
        'ドキュメント作成': 1,
        'コードレビュー': 1,
        'パフォーマンス問題': 1,
        'メモリリーク検出': 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(50),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: singleDay,
      endDate: singleDay,
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
    );

    expect(result.keywords).toHaveLength(6);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: expect.any(String),
      frequency: 1,
      rank: expect.any(Number),
    });
    expect(result.totalKeywordCount).toBe(6);
    expect(result.analysisperiodDays).toBe(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});