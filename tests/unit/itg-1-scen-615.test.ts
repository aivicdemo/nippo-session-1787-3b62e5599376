import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  // SCEN-615
  test('should extract and rank multiple issue keywords by frequency in descending order', () => {
    // Arrange
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: ['データベース接続エラー', 'レスポンス遅延', 'メモリリーク'],
        frequencies: [5, 3, 2],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportText =
      'データベース接続エラーが発生しており、レスポンス遅延につながっている。メモリリークの可能性も調査中';

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act
    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      [reportText],
      input,
      mockTextAnalysisService
    );

    // Assert
    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0].keyword).toBe('データベース接続エラー');
    expect(result.keywords[0].frequency).toBe(5);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[1].keyword).toBe('レスポンス遅延');
    expect(result.keywords[1].frequency).toBe(3);
    expect(result.keywords[1].rank).toBe(2);
    expect(result.keywords[2].keyword).toBe('メモリリーク');
    expect(result.keywords[2].frequency).toBe(2);
    expect(result.keywords[2].rank).toBe(3);
    expect(result.totalKeywordCount).toBe(3);
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledTimes(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
  });
});