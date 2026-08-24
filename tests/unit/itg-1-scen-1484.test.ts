import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1484
  test('対象期間の日報データが空配列のとき、エラーを返す', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error('対象期間の日報データが見つかりません')
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const dailyReports: any[] = [];

    let result: RankedIssueKeywordList | { error: string; errorCode: string; errorMessage: string } | undefined;
    let thrownError: Error | undefined;

    try {
      result = await extractAndRankIssueKeywords(
        input,
        dailyReports,
        mockTextAnalysisServiceAdapter
      );
    } catch (err) {
      if (err instanceof Error) {
        thrownError = err;
      }
    }

    if (thrownError) {
      expect(thrownError.message).toMatch(/対象期間の日報データが見つかりません/);
    } else if (result && typeof result === 'object' && 'errorCode' in result) {
      expect(result.errorCode).toBe('EMPTY_DAILY_REPORTS');
      expect(result.errorMessage).toMatch(/対象期間の日報データが見つかりません/);
      expect((result as any).keywords || null).toBeNull();
    } else {
      throw new Error('Expected error handling but received valid result');
    }
  });
});