import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題自動抽出・優先度判定機能 - 同じ優先度スコアを持つ複数の課題の順序付け', () => {
  // SCEN-466
  test('同じ優先度スコアを持つ複数の課題が、出現頻度の降順で順序付けされること', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'Issue A',
          frequency: 3,
          impactScore: 75,
        },
        {
          keyword: 'Issue B',
          frequency: 5,
          impactScore: 75,
        },
        {
          keyword: 'Issue C',
          frequency: 2,
          impactScore: 75,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportTexts = [
      'Issue A に関する報告です。Issue B と Issue C も含まれます。',
      'Issue B に関する追加報告。Issue A も同時に発生。',
      'Issue A、Issue B、Issue C の3つの課題が報告されました。',
      'Issue B に関する報告。',
      'Issue B が再度発生しました。',
    ];

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService
    );

    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0].keyword).toBe('Issue B');
    expect(result.keywords[0].frequency).toBe(5);
    expect(result.keywords[0].rank).toBe(1);

    expect(result.keywords[1].keyword).toBe('Issue A');
    expect(result.keywords[1].frequency).toBe(3);
    expect(result.keywords[1].rank).toBe(2);

    expect(result.keywords[2].keyword).toBe('Issue C');
    expect(result.keywords[2].frequency).toBe(2);
    expect(result.keywords[2].rank).toBe(3);

    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
  });
});