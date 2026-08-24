import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能', () => {
  // SCEN-2174
  test('TextAnalysisServiceAdapter の extractKeywords が失敗したとき、エラーハンドリングが実行される', async () => {
    const challengeText = 'サーバーのメモリ不足により処理が遅延している';
    const teamId = 'team-001';
    const requestUserId = 'user-001';
    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-14T23:59:59Z');

    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    };

    let callCount = 0;
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async () => {
        callCount++;
        if (callCount <= 3) {
          throw new Error('Network timeout: Failed to connect to text analysis service');
        }
        return {
          keywords: [
            { keyword: 'メモリ不足', frequency: 1 },
            { keyword: '処理遅延', frequency: 1 },
          ],
        };
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const result = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate: analysisStartDate,
        endDate: analysisEndDate,
        minFrequencyThreshold: 1,
        requestUserId,
        challengeTextInput: challengeText,
      },
      mockTextAnalysisServiceAdapter,
      mockLogger
    );

    expect(result.errorState).toEqual({
      hasError: true,
      displayMessage: '課題分析が一時的に利用できません。手動入力をご利用ください',
      fallbackMode: 'manual_keyword_input',
    });

    expect(result.keywords).toEqual([]);
    expect(result.totalKeywordCount).toBe(0);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(3);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('extractKeywords failed after 3 retries')
    );

    expect(result.cacheState).toEqual({
      isCached: false,
      cacheEnabled: false,
    });

    expect(result.manualInputModeActive).toBe(true);
  });
});