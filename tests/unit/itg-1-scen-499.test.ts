import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題抽出・優先度判定機能 - 浮動小数点演算オーバーフロー処理', () => {
  // SCEN-499
  test('優先度スコア計算で浮動小数点オーバーフロー発生時にエラーをthrowする', () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: '品質問題', frequency: 5 },
          { keyword: 'パフォーマンス低下', frequency: 3 },
        ],
      }),
      assessImpactScore: jest
        .fn()
        .mockResolvedValue(Number.MAX_VALUE * 2),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-dept-head',
    };

    expect(() =>
      extractAndRankIssueKeywords(input, mockTextAnalysisService)
    ).toThrow(/PriorityScoreCalculationError/);
  });
});