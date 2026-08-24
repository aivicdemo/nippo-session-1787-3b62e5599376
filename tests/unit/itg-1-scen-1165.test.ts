import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  // SCEN-1165
  test('課題データが空の場合、有効性検証が正常に完了し空の結果を返す', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-dept-head-001',
    };

    const result = extractAndRankIssueKeywords(input);

    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBe(0);
    expect(result.totalKeywordCount).toBe(0);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
  });
});