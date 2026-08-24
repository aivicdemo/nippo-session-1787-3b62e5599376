import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-1146: Duplicate keyword validation error detection
  test('should throw validation error when duplicate keywords are detected in extracted dataset', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'データベース接続エラー', frequency: 3 },
        { keyword: 'メモリリーク', frequency: 2 },
        { keyword: 'データベース接続エラー', frequency: 3 },
        { keyword: 'メモリリーク', frequency: 2 },
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisService)
    ).rejects.toThrow(/重複/);
  });
});