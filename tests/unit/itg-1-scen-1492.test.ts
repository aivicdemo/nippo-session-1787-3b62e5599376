import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords, type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Extract and Rank Issue Keywords', () => {
  // SCEN-1492: [error] 課題キーワード自動抽出・頻度ランク付け機能 - 開始日が終了日より後の期間が指定されたとき、エラーを返す
  test('should throw error when startDate is after endDate', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2026-08-20'),
      endDate: new Date('2026-08-19'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
    };

    expect(() =>
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/開始日は終了日以前の日付を指定してください|日付の範囲が無効です|開始日.*終了日/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});