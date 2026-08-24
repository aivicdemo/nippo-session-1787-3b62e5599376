import { describe, it, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  it('SCEN-1009: extracts and ranks issue keywords by frequency in descending order', async () => {
    // Arrange
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-001';

    const mockReportedTexts = [
      'データベース接続エラーが発生した。',
      'データベース接続の問題は昨日も起きた。',
      'キャッシュの不具合でデータベース接続が遅い。',
    ];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'データベース接続', frequency: 3 },
        { keyword: 'エラー', frequency: 1 },
        { keyword: 'キャッシュ', frequency: 1 },
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // Act
    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    // Assert
    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBe(3);

    // Verify ranking by frequency (descending order)
    expect(result.keywords[0].keyword).toBe('データベース接続');
    expect(result.keywords[0].frequency).toBe(3);
    expect(result.keywords[0].rank).toBe(1);

    expect(result.keywords[1].keyword).toBe('エラー');
    expect(result.keywords[1].frequency).toBe(1);
    expect(result.keywords[1].rank).toBe(2);

    expect(result.keywords[2].keyword).toBe('キャッシュ');
    expect(result.keywords[2].frequency).toBe(1);
    expect(result.keywords[2].rank).toBe(3);

    // Verify output structure
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);

    // Verify that extractKeywords was called
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});