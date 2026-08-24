import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  // SCEN-495
  test('抽出されたキーワードが null のときエラーになる', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue(null),
      assessImpactScore: jest.fn().mockResolvedValue(50),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportText = '昨日やったこと：A機能実装、今日やること：B機能テスト、課題：リソース不足';

    expect(() => {
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter, reportText);
    }).toThrow(/課題キーワード/);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('extractKeywords returned null'),
    );
  });
});