import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-766
  test('should return error when TextAnalysisServiceAdapter returns undefined keywords', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: undefined,
        frequency: [1, 2, 1],
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

    const reportText =
      'システム障害により顧客対応が遅延。データベース接続エラーが発生';

    let result: RankedIssueKeywordList | { code: string; message: string; statusCode: number } | null = null;
    let thrownError: Error | null = null;

    try {
      result = await extractAndRankIssueKeywords(
        input,
        reportText,
        mockTextAnalysisAdapter,
      );
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    const isErrorResponse = result &&
      typeof result === 'object' &&
      'code' in result &&
      result.code === 'UNDEFINED_KEYWORDS';

    const isExpectedException = thrownError &&
      thrownError.message.includes('キーワードが定義されていません');

    expect(
      isErrorResponse ||
        isExpectedException,
    ).toBe(true);

    if (isErrorResponse) {
      expect((result as any).code).toBe('UNDEFINED_KEYWORDS');
      expect((result as any).message).toContain('キーワード抽出に失敗');
      expect((result as any).statusCode).toBe(422);
    }

    if (isExpectedException) {
      expect(thrownError!.message).toMatch(/キーワードが定義されていません/);
    }
  });
});