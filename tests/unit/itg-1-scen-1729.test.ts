import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Impact Score Assessment Retry Failure', () => {
  // SCEN-1729: [error] 課題キーワード自動抽出・優先度スコア算出機能 - TextAnalysisServiceAdapter の assessImpactScore が呼び出し失敗時、リトライ後も失敗のとき例外になる
  it('should throw RetryExhaustedException when assessImpactScore fails after 3 retries', async () => {
    // Setup mock TextAnalysisServiceAdapter that fails on all retries
    const failingTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'ネットワーク障害', frequency: 5 },
          { keyword: 'サーバーダウン', frequency: 3 },
        ],
        confidence: 0.95,
      }),
      assessImpactScore: jest.fn()
        .mockRejectedValueOnce(new Error('API Connection Timeout'))
        .mockRejectedValueOnce(new Error('API Connection Timeout'))
        .mockRejectedValueOnce(new Error('API Connection Timeout')),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        confidence: 0.92,
      }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-11-18T00:00:00Z'),
      endDate: new Date('2024-11-24T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-dept-head-001',
    };

    // Verify that the function throws an error when all retries are exhausted
    await expect(
      extractAndRankIssueKeywords(input, failingTextAnalysisAdapter)
    ).rejects.toThrow(/RetryExhausted|API.*failed|Assessment.*unavailable/i);

    // Verify that assessImpactScore was called exactly 3 times (initial + 2 retries)
    expect(failingTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(3);

    // Verify extractKeywords was called at least once
    expect(failingTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});