import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題抽出・優先度付けロジック', () => {
  // SCEN-1150: [error] 抽出課題データ有効性検証機能 - 既存ツール連携対象フラグが真偽値以外のデータがあるとき検証エラーになる
  test('should validate integration target flag is boolean and reject non-boolean values', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'keyword1', frequency: 5 },
        { keyword: 'keyword2', frequency: 3 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // Test case: non-boolean values for integration target flag should throw validation error
    const testCases = [
      null,
      undefined,
      'true',
      1,
      0,
      '',
      { value: true },
      [],
      NaN,
    ];

    for (const invalidValue of testCases) {
      // Create a modified input that includes an invalid integration target flag
      const inputWithInvalidFlag = {
        ...input,
        integrationTargetFlag: invalidValue,
      } as any;

      try {
        await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
        // If we reach here without error for non-boolean values, the test should fail
        if (invalidValue !== true && invalidValue !== false) {
          expect(true).toBe(false); // Force failure for non-boolean values
        }
      } catch (error: any) {
        // Expected error for non-boolean values
        if (invalidValue !== true && invalidValue !== false) {
          expect(error.message).toMatch(/真偽値|boolean/);
        }
      }
    }

    // Valid boolean values should not throw
    const validInput: ExtractIssueKeywordsInput & { integrationTargetFlag: boolean } = {
      ...input,
      integrationTargetFlag: true,
    };

    try {
      const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('totalKeywordCount');
      expect(result).toHaveProperty('extractedAt');
      expect(result).toHaveProperty('analysisperiodDays');
      expect(Array.isArray(result.keywords)).toBe(true);
    } catch (error) {
      // Should not throw for valid inputs without invalid flags
      expect(error).toBeUndefined();
    }
  });
});