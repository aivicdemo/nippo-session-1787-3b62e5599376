import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization', () => {
  // SCEN-1709: [normal] 課題キーワード自動抽出・優先度スコア算出機能 - 同一キーワードが複数の日報に出現するとき、発生頻度が累積計算される
  test('should accumulate keyword frequency across multiple reports', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn()
        .mockResolvedValueOnce([{ keyword: 'ログイン機能の不具合', frequency: 1 }])
        .mockResolvedValueOnce([{ keyword: 'ログイン機能の不具合', frequency: 1 }])
        .mockResolvedValueOnce([{ keyword: 'ログイン機能の不具合', frequency: 1 }]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportContentA = 'ログイン機能の不具合が発生しており、ユーザーがアクセスできない状況が続いています。';
    const reportContentB = 'ログイン機能の不具合により本日の作業が中断しました。対応が必要です。';
    const reportContentC = 'ログイン機能の不具合が再発。前回と同じ症状です。';

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
    );

    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(1);
    
    const loginIssueKeyword = result.keywords[0];
    expect(loginIssueKeyword.keyword).toBe('ログイン機能の不具合');
    expect(loginIssueKeyword.frequency).toBe(3);
    expect(loginIssueKeyword.rank).toBe(1);
    
    expect(result.totalKeywordCount).toBe(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(1);
    
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(reportContentA);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(reportContentB);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(reportContentC);
  });
});