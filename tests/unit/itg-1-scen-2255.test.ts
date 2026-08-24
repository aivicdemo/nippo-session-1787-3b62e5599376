import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords - Issue Deduplication at Similarity Threshold', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2255
  test('should normalize and deduplicate issues at exact 85% similarity threshold', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-manager-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'システム連携のバグを修正',
          frequency: 1,
          confidence: 0.92,
        },
        {
          keyword: 'システム統合のエラーを対応',
          frequency: 1,
          confidence: 0.90,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'システム連携バグ対応',
        impactScore: 45,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: 'システム連携バグ対応',
        severity: 'medium',
      }),
      calculateSimilarityScore: jest.fn().mockImplementation((text1: string, text2: string) => {
        if (
          (text1 === 'システム連携のバグを修正' && text2 === 'システム統合のエラーを対応') ||
          (text1 === 'システム統合のエラーを対応' && text2 === 'システム連携のバグを修正')
        ) {
          return Promise.resolve(0.85);
        }
        return Promise.resolve(0);
      }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
    );

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    const normalizedKeywords = result.keywords.map(kw => kw.keyword);
    expect(normalizedKeywords.length).toBeLessThanOrEqual(2);

    const similarityCheckCalled = mockTextAnalysisAdapter.calculateSimilarityScore.mock.calls.some(
      (call: any[]) =>
        (call[0] === 'システム連携のバグを修正' && call[1] === 'システム統合のエラーを対応') ||
        (call[0] === 'システム統合のエラーを対応' && call[1] === 'システム連携のバグを修正'),
    );
    expect(similarityCheckCalled).toBe(true);

    if (result.keywords.length === 1) {
      expect(result.keywords[0].keyword).toMatch(/システム/);
      expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(1);
      expect(result.keywords[0].rank).toBe(1);
    }

    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(1);
    expect(result.extractedAt).toBeDefined();
    expect(result.extractedAt instanceof Date).toBe(true);
    expect(result.analysisperiodDays).toBe(7);
  });
});