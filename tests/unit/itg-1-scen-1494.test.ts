import { describe, it, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1494
  it('TextAnalysisServiceAdapter の extractKeywords がエラーを返したとき、エラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        success: false,
        error: 'API_FAILURE',
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportTexts = ['システム障害が発生した。対応が必要'];

    const result = extractAndRankIssueKeywords(
      input,
      reportTexts,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toEqual({
      success: false,
      errorCode: 'TEXT_ANALYSIS_FAILED',
      message: 'キーワード抽出に失敗しました',
    });

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});