import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  // SCEN-521: [normal] 課題自動抽出・優先度判定機能 - 10名のチームメンバーから集約された日報1件の場合、抽出された課題が発生頻度でランク付けされる
  test('should extract and rank issue keywords by frequency in descending order', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'manager-001';

    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keywordId: 'kw-001',
          keyword: '通信ロジックバグ',
          frequency: 8,
          confidence: 0.92,
        },
        {
          keywordId: 'kw-002',
          keyword: 'ドキュメント未整備',
          frequency: 5,
          confidence: 0.87,
        },
        {
          keywordId: 'kw-003',
          keyword: 'テスト環境構築遅延',
          frequency: 2,
          confidence: 0.78,
        },
      ]),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService
    );

    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0]).toEqual({
      keywordId: 'kw-001',
      keyword: '通信ロジックバグ',
      frequency: 8,
      rank: 1,
    });
    expect(result.keywords[1]).toEqual({
      keywordId: 'kw-002',
      keyword: 'ドキュメント未整備',
      frequency: 5,
      rank: 2,
    });
    expect(result.keywords[2]).toEqual({
      keywordId: 'kw-003',
      keyword: 'テスト環境構築遅延',
      frequency: 2,
      rank: 3,
    });
    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});