import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords - 日報0件時の課題抽出', () => {
  let mockTextAnalysisAdapter: {
    extractKeywords: jest.Mock;
    assessImpactScore: jest.Mock;
    classifyIssueSeverity: jest.Mock;
  };

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  // SCEN-479: [normal] 課題自動抽出・優先度判定機能 - 日報が0件（全員未提出）の場合は空の課題一覧が返される
  test('should return empty keyword list when no reports are submitted', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const emptyReports: Array<{
      reportId: string;
      content: string;
      challengeSection: string;
    }> = [];

    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      emptyReports,
      mockTextAnalysisAdapter
    );

    expect(result.keywords).toEqual([]);
    expect(result.keywords.length).toBe(0);
    expect(result.totalKeywordCount).toBe(0);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});