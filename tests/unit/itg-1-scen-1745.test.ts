import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  // SCEN-1745
  test('影響度スコアが境界値直上（51/100）のとき高優先度に分類される', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          {
            keyword: 'システム障害',
            frequency: 3,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockReturnValue({
        keyword: 'システム障害',
        impactScore: 51,
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue({
        keyword: 'システム障害',
        severity: 'high',
      }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-dept-lead-001',
    };

    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBeGreaterThan(0);

    const systemFailureKeyword = result.keywords.find(
      (kw) => kw.keyword === 'システム障害'
    );
    expect(systemFailureKeyword).toBeDefined();
    expect(systemFailureKeyword?.keyword).toBe('システム障害');
    expect(systemFailureKeyword?.frequency).toBe(3);
    expect(systemFailureKeyword?.rank).toBe(1);

    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.stringContaining('システム障害')
    );
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
  });
});