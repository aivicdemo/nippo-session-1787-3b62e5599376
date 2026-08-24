import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・発生頻度ランク付け機能', () => {
  // SCEN-2251: 正規化ルール定義が未設定のときエラーになる
  test('正規化ルール定義が未設定の場合、normalizationRulesエラーを返す', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'database connection', frequency: 3 },
        { keyword: 'db connection', frequency: 2 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const mockNormalizationRules = null;

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      mockNormalizationRules
    );

    expect(result).toHaveProperty('error');
    expect(result.error).toMatch(/normalizationRules/i);
  });
});