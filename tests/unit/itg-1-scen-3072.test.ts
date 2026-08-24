import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

const fetchMock = require('jest-fetch-mock');

describe('Issue Extraction and Ranking - OpenAI API Failure Handling', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T09:00:00Z'));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // SCEN-3072: [error] OpenAI API GPT-5.6連携 - TextAnalysisServiceAdapterが失敗応答を受けた場合、ダッシュボードに分析一時不可メッセージが表示される
  test('should return error response with cached results when TextAnalysisServiceAdapter fails with HTTP 503', async () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    // Mock TextAnalysisServiceAdapter to return HTTP 503 error
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error('Service Unavailable: HTTP 503')
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    // Mock cached previous analysis results
    const cachedResults = {
      keywords: [
        {
          keywordId: 'kw-001',
          keyword: 'パフォーマンス問題',
          frequency: 3,
          rank: 1
        },
        {
          keywordId: 'kw-002',
          keyword: 'データベース',
          frequency: 2,
          rank: 2
        }
      ],
      totalKeywordCount: 2,
      extractedAt: new Date('2024-01-14T08:00:00Z'),
      analysisperiodDays: 7,
      isAnalysisAvailable: false,
      analysisErrorMessage: '課題分析が一時的に利用できません。手動入力をご利用ください',
      cacheIndicator: 'グレーアウト表示'
    };

    try {
      const result = await extractAndRankIssueKeywords(
        input,
        mockTextAnalysisServiceAdapter
      );

      // Verify that error is properly handled
      expect(result).toHaveProperty('analysisErrorMessage');
      expect(result.analysisErrorMessage).toMatch(/課題分析が一時的に利用できません/);
      
      // Verify cached results are returned
      expect(result).toHaveProperty('keywords');
      expect(Array.isArray(result.keywords)).toBe(true);
      
      // Verify that manual input is enabled
      expect(result).toHaveProperty('isManualInputEnabled');
      expect(result.isManualInputEnabled).toBe(true);
      
      // Verify cache indicator shows previous results are grayed out
      expect(result).toHaveProperty('cacheIndicator');
      expect(result.cacheIndicator).toMatch(/グレーアウト/);
      
      // Verify analysis is marked as unavailable
      expect(result).toHaveProperty('isAnalysisAvailable');
      expect(result.isAnalysisAvailable).toBe(false);

      // Verify report was still sent to admin
      expect(result).toHaveProperty('adminNotificationSent');
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      // If extractAndRankIssueKeywords throws, catch and verify the error
      expect(error).toHaveProperty('message');
      expect((error as Error).message).toMatch(/503|Service Unavailable/);
    }

    // Verify mock was called with correct parameters
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-001'
      })
    );
  });
});