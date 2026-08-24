import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  // SCEN-2249
  test('影響度スコアが0-100の範囲外のときエラーになる', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['本番障害'],
        frequencies: [1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(-5),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const testReports = [
      {
        id: 'report-001',
        teamId: 'team-001',
        reportedAt: new Date('2024-01-05T09:00:00Z'),
        challenge: '重大な本番障害が発生',
      },
    ];

    expect(async () => {
      await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter, testReports);
    }).rejects.toThrow(/影響度スコア/);
  });
});