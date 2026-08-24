import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type TextAnalysisServiceAdapter } from '../../src/adapters/text-analysis-service-adapter';

describe('課題抽出・優先度付け機能', () => {
  // SCEN-1894
  test('TextAnalysisServiceAdapterのextractKeywordsがタイムアウト時、タイムアウトエラーを返す', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-001';

    const timeoutError = new Error('Request timeout');
    (timeoutError as any).code = 'ETIMEDOUT';

    const stubTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockRejectedValueOnce(timeoutError),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const result = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold,
        requestUserId,
      },
      stubTextAnalysisAdapter
    );

    expect(result).toEqual({
      errorCode: 'TIMEOUT_ERROR',
      errorMessage: '課題分析が一時的に利用できません。手動入力をご利用ください',
      statusCode: 408,
      keywords: [],
      totalKeywordCount: 0,
      extractedAt: expect.any(Date),
      analysisPeriodDays: 31,
      shouldFallbackToManualInput: true,
    });

    expect(result.errorCode).toBe('TIMEOUT_ERROR');
    expect(result.statusCode).toBe(408);
    expect(result.shouldFallbackToManualInput).toBe(true);
  });
});