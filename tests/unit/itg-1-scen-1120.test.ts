import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  // SCEN-1120: [normal] 抽出課題データの不完全性検出機能 - 必須属性（課題テキスト、発生日時）が欠落している課題が不完全として判定される
  test('should extract and rank issue keywords from reports with complete required attributes', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(input);

    expect(result).toHaveProperty('keywords');
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result).toHaveProperty('totalKeywordCount');
    expect(typeof result.totalKeywordCount).toBe('number');
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(0);
    expect(result).toHaveProperty('extractedAt');
    expect(result.extractedAt instanceof Date).toBe(true);
    expect(result).toHaveProperty('analysisperiodDays');
    expect(result.analysisperiodDays).toBe(7);

    result.keywords.forEach((keyword) => {
      expect(keyword).toHaveProperty('keywordId');
      expect(typeof keyword.keywordId).toBe('string');
      expect(keyword.keywordId.length).toBeGreaterThan(0);
      expect(keyword).toHaveProperty('keyword');
      expect(typeof keyword.keyword).toBe('string');
      expect(keyword.keyword.length).toBeGreaterThan(0);
      expect(keyword).toHaveProperty('frequency');
      expect(typeof keyword.frequency).toBe('number');
      expect(keyword.frequency).toBeGreaterThanOrEqual(1);
      expect(keyword).toHaveProperty('rank');
      expect(typeof keyword.rank).toBe('number');
      expect(keyword.rank).toBeGreaterThanOrEqual(1);
    });

    if (result.keywords.length > 1) {
      for (let i = 0; i < result.keywords.length - 1; i++) {
        expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(
          result.keywords[i + 1].frequency
        );
        expect(result.keywords[i].rank).toBeLessThan(result.keywords[i + 1].rank);
      }
    }
  });
});