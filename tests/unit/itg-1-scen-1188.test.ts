import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

// Mock TextAnalysisServiceAdapter
const mockTextAnalysisServiceAdapter = {
  extractKeywords: jest.fn(),
  assessImpactScore: jest.fn(),
  classifyIssueSeverity: jest.fn(),
};

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1188
  test('信頼度スコアが -1 以下のとき処理がエラーになる', () => {
    // Arrange
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-manager-001';
    const minFrequencyThreshold = 1;

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // Mock assessImpactScore to return invalid confidence score of -1.5
    mockTextAnalysisServiceAdapter.assessImpactScore.mockReturnValue(-1.5);

    // Act & Assert
    expect(() => {
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/信頼度スコア/);
  });
});