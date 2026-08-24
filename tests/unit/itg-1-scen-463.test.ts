import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Priority Score Rounding', () => {
  // SCEN-463: [edge] 課題自動抽出・優先度判定機能 - 優先度スコア計算時に端数が発生した場合、指定の丸め規則に従って正確に丸められる
  test('should round priority scores to 2 decimal places using standard rounding rules', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'デバッグ', frequency: 5 },
          { keyword: 'パフォーマンス', frequency: 3 },
          { keyword: 'セキュリティ', frequency: 2 },
        ],
      }),
      assessImpactScore: jest
        .fn()
        .mockImplementation((keyword: string) => {
          if (keyword === 'デバッグ') {
            // Case 1: 42.567 should round to 42.57 (third decimal place below)
            return Promise.resolve(42.567);
          } else if (keyword === 'パフォーマンス') {
            // Case 2: 75.445 should round to 75.45 (boundary rounding)
            return Promise.resolve(75.445);
          } else if (keyword === 'セキュリティ') {
            // Case 3: 88.999 should round to 89.00 (rounding up required)
            return Promise.resolve(88.999);
          }
          return Promise.resolve(0);
        }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter as any
    );

    expect(result.keywords).toHaveLength(3);

    // Verify Case 1: 42.567 rounded to 42.57
    const case1Keyword = result.keywords.find((k) => k.keyword === 'デバッグ');
    expect(case1Keyword).toBeDefined();
    expect(case1Keyword?.priorityScore).toBe(42.57);

    // Verify Case 2: 75.445 rounded to 75.45
    const case2Keyword = result.keywords.find((k) => k.keyword === 'パフォーマンス');
    expect(case2Keyword).toBeDefined();
    expect(case2Keyword?.priorityScore).toBe(75.45);

    // Verify Case 3: 88.999 rounded to 89.00
    const case3Keyword = result.keywords.find((k) => k.keyword === 'セキュリティ');
    expect(case3Keyword).toBeDefined();
    expect(case3Keyword?.priorityScore).toBe(89.0);

    // Verify keywords are ranked by priority score in descending order
    expect(result.keywords[0].priorityScore).toBeGreaterThanOrEqual(
      result.keywords[1].priorityScore
    );
    expect(result.keywords[1].priorityScore).toBeGreaterThanOrEqual(
      result.keywords[2].priorityScore
    );

    // Verify rank assignment
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[1].rank).toBe(2);
    expect(result.keywords[2].rank).toBe(3);

    // Verify extraction metadata
    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});