import { describe, it, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  it('SCEN-2943: duplicate keywords are deduplicated and counted as single frequency', async () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'データベース接続エラー', frequency: 1 },
        { keyword: 'データベース接続エラー', frequency: 1 },
        { keyword: 'データベース接続エラー', frequency: 1 },
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
    };

    const reportTexts = [
      'データベース接続エラーが発生した。データベース接続エラーにより処理が停止。データベース接続エラーの対応が必要',
    ];

    // Act
    const result = await extractAndRankIssueKeywords(
      input,
      reportTexts,
      mockTextAnalysisServiceAdapter
    );

    // Assert
    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0].keyword).toBe('データベース接続エラー');
    expect(result.keywords[0].frequency).toBe(1);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.totalKeywordCount).toBe(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
  });
});

interface ExtractIssueKeywordsInput {
  teamId: string;
  startDate: Date;
  endDate: Date;
  minFrequencyThreshold?: number;
  requestUserId: string;
}