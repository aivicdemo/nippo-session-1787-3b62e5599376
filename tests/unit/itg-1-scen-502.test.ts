import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-502: [error] 課題自動抽出・優先度判定機能 - 日報報告日時が無効な日付形式のときエラーになる
  test('should throw error when reportingDate has invalid date format', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const invalidInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
      reportingDate: '2024-13-45', // Invalid month and day
    };

    expect(() =>
      extractAndRankIssueKeywords(invalidInput, mockTextAnalysisAdapter)
    ).toThrow(/日付形式/);

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});