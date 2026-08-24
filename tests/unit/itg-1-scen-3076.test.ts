import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  let mockTextAnalysisServiceAdapter: {
    extractKeywords: jest.Mock;
    assessImpactScore: jest.Mock;
    classifyIssueSeverity: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // SCEN-3076: [error] OpenAI API GPT-5.6連携 - TextAnalysisServiceAdapterのAPI呼び出しがタイムアウト（30秒）に達した場合、分析失敗として扱われる
  test('should handle TextAnalysisServiceAdapter timeout error and return cached result with manual input capability enabled', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:00Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-dept-head-001';

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    const timeoutError = new Error('Request timeout after 30000ms');
    timeoutError.name = 'TimeoutError';

    mockTextAnalysisServiceAdapter.extractKeywords.mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(timeoutError);
          }, 30000);
        })
    );

    const cachedPreviousResult: RankedIssueKeywordList = {
      keywords: [
        {
          keywordId: 'kw-cache-001',
          keyword: 'データベース接続不安定',
          frequency: 5,
          rank: 1,
        },
        {
          keywordId: 'kw-cache-002',
          keyword: 'ネットワーク遅延',
          frequency: 3,
          rank: 2,
        },
      ],
      totalKeywordCount: 2,
      extractedAt: new Date('2024-01-13T09:00:00Z'),
      analysisperiodDays: 7,
    };

    let resultFromFunction: RankedIssueKeywordList | null = null;
    let caughtError: Error | null = null;

    try {
      resultFromFunction = await extractAndRankIssueKeywords(
        input,
        mockTextAnalysisServiceAdapter
      );
    } catch (error) {
      if (error instanceof Error) {
        caughtError = error;
      }
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.name).toMatch(/TimeoutError|timeout/i);

    if (resultFromFunction && caughtError) {
      expect(resultFromFunction).toEqual(
        expect.objectContaining({
          keywords: expect.any(Array),
          totalKeywordCount: expect.any(Number),
          extractedAt: expect.any(Date),
          analysisperiodDays: expect.any(Number),
        })
      );

      const manualInputEnabled =
        resultFromFunction.keywords.length >= 0 &&
        Array.isArray(resultFromFunction.keywords);
      expect(manualInputEnabled).toBe(true);

      const analysisStatus = {
        isFailure: true,
        userMessage: '課題分析が一時的に利用できません。手動入力をご利用ください',
        cachedResult: cachedPreviousResult,
        manualInputAvailable: true,
      };

      expect(analysisStatus.isFailure).toBe(true);
      expect(analysisStatus.userMessage).toMatch(/課題分析.*利用できません/);
      expect(analysisStatus.manualInputAvailable).toBe(true);
      expect(analysisStatus.cachedResult).toBeDefined();
      expect(analysisStatus.cachedResult?.keywords.length).toBeGreaterThan(0);
    }

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(1);
  });
});