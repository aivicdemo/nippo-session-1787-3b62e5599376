import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-1713
  test('should return identical extraction results and priority scores when executed twice with the same input data', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'DBスキーマ性能検証', frequency: 3 },
          { keyword: '仕様書レビュー', frequency: 2 },
          { keyword: '要件定義ドキュメント', frequency: 1 },
        ],
      }),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce(75.0)
        .mockResolvedValueOnce(75.0)
        .mockResolvedValueOnce(52.5)
        .mockResolvedValueOnce(52.5)
        .mockResolvedValueOnce(40.0)
        .mockResolvedValueOnce(40.0),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const firstExecution = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
    const secondExecution = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    expect(firstExecution.keywords).toHaveLength(3);
    expect(secondExecution.keywords).toHaveLength(3);

    expect(firstExecution.keywords[0].keyword).toBe('DBスキーマ性能検証');
    expect(secondExecution.keywords[0].keyword).toBe('DBスキーマ性能検証');
    expect(firstExecution.keywords[0].frequency).toBe(3);
    expect(secondExecution.keywords[0].frequency).toBe(3);
    expect(firstExecution.keywords[0].rank).toBe(1);
    expect(secondExecution.keywords[0].rank).toBe(1);

    expect(firstExecution.keywords[1].keyword).toBe('仕様書レビュー');
    expect(secondExecution.keywords[1].keyword).toBe('仕様書レビュー');
    expect(firstExecution.keywords[1].frequency).toBe(2);
    expect(secondExecution.keywords[1].frequency).toBe(2);
    expect(firstExecution.keywords[1].rank).toBe(2);
    expect(secondExecution.keywords[1].rank).toBe(2);

    expect(firstExecution.keywords[2].keyword).toBe('要件定義ドキュメント');
    expect(secondExecution.keywords[2].keyword).toBe('要件定義ドキュメント');
    expect(firstExecution.keywords[2].frequency).toBe(1);
    expect(secondExecution.keywords[2].frequency).toBe(1);
    expect(firstExecution.keywords[2].rank).toBe(3);
    expect(secondExecution.keywords[2].rank).toBe(3);

    expect(firstExecution.totalKeywordCount).toBe(3);
    expect(secondExecution.totalKeywordCount).toBe(3);

    expect(firstExecution.analysisperiodDays).toBe(7);
    expect(secondExecution.analysisperiodDays).toBe(7);

    expect(firstExecution.keywords).toEqual(secondExecution.keywords);
    expect(firstExecution.totalKeywordCount).toBe(secondExecution.totalKeywordCount);
    expect(firstExecution.analysisperiodDays).toBe(secondExecution.analysisperiodDays);
  });
});