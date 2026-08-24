import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題自動抽出・優先度判定機能 - 日報から課題キーワードを抽出し優先度付けして表示', () => {
  // SCEN-480
  test('[normal] 日報が1件の場合から課題が正常に抽出され優先度判定される', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['API障害', 'データ同期遅延'],
        frequencies: [3, 2],
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        if (keyword === 'API障害') {
          return Promise.resolve({ keyword: 'API障害', impactScore: 75 });
        }
        if (keyword === 'データ同期遅延') {
          return Promise.resolve({ keyword: 'データ同期遅延', impactScore: 45 });
        }
        return Promise.resolve({ keyword, impactScore: 0 });
      }),
      classifyIssueSeverity: jest.fn((keyword: string) => {
        if (keyword === 'API障害') {
          return Promise.resolve({ keyword: 'API障害', severity: 'high' });
        }
        if (keyword === 'データ同期遅延') {
          return Promise.resolve({ keyword: 'データ同期遅延', severity: 'medium' });
        }
        return Promise.resolve({ keyword, severity: 'low' });
      }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-dept-head',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
    );

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBe(2);

    expect(result.keywords[0].keyword).toBe('API障害');
    expect(result.keywords[0].frequency).toBe(3);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[0].impactScore).toBe(75);
    expect(result.keywords[0].severity).toBe('high');

    expect(result.keywords[1].keyword).toBe('データ同期遅延');
    expect(result.keywords[1].frequency).toBe(2);
    expect(result.keywords[1].rank).toBe(2);
    expect(result.keywords[1].impactScore).toBe(45);
    expect(result.keywords[1].severity).toBe('medium');

    expect(result.totalKeywordCount).toBe(2);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-001',
        startDate: input.startDate,
        endDate: input.endDate,
      }),
    );
  });
});