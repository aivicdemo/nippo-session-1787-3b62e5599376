import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度付け表示機能', () => {
  // SCEN-756: [error] 課題自動抽出・優先度判定機能 - 影響度スコアが100を超えるとき、エラーを返す
  test('影響度スコアが100を超えるときはINVALID_IMPACT_SCORE_RANGEエラーを返す', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'データベース接続エラー',
          frequency: 5,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(101),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
    );

    expect(result).toHaveProperty('error');
    expect(result.error).toHaveProperty('code', 'INVALID_IMPACT_SCORE_RANGE');
    expect(result.error).toHaveProperty(
      'message',
      expect.stringContaining('影響度スコアは0～100の範囲で指定してください'),
    );
  });
});