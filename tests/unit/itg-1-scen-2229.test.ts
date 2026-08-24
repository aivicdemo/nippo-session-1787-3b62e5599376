import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2229: [normal] 課題の重複検出と正規化 - 複数メンバーから報告された課題が全て異なる場合、重複なしとして全件が正規化リストに含まれる
  test('should extract and rank three distinct issue keywords from multiple team members without duplication', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    mockTextAnalysisAdapter.extractKeywords
      .mockResolvedValueOnce({
        keywords: ['データベース接続タイムアウト'],
        frequency: 1,
      })
      .mockResolvedValueOnce({
        keywords: ['ユーザー認証エラー'],
        frequency: 1,
      })
      .mockResolvedValueOnce({
        keywords: ['レポート出力機能の遅延'],
        frequency: 1,
      });

    mockTextAnalysisAdapter.assessImpactScore
      .mockResolvedValueOnce({ impactScore: 75 })
      .mockResolvedValueOnce({ impactScore: 65 })
      .mockResolvedValueOnce({ impactScore: 55 });

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const mockReportingData = [
      {
        reportId: 'report-001',
        memberId: 'member-a',
        content: 'データベース接続タイムアウトが発生しています',
        reportedAt: new Date('2024-01-10T09:00:00Z'),
      },
      {
        reportId: 'report-002',
        memberId: 'member-b',
        content: 'ユーザー認証エラーが多発しています',
        reportedAt: new Date('2024-01-10T09:05:00Z'),
      },
      {
        reportId: 'report-003',
        memberId: 'member-c',
        content: 'レポート出力機能の遅延が確認されました',
        reportedAt: new Date('2024-01-10T09:10:00Z'),
      },
    ];

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockReportingData,
      mockTextAnalysisAdapter
    );

    expect(result.keywords).toHaveLength(3);
    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);

    const sortedKeywords = result.keywords.sort((a, b) => a.rank - b.rank);
    expect(sortedKeywords[0].keyword).toBe('データベース接続タイムアウト');
    expect(sortedKeywords[0].frequency).toBe(1);
    expect(sortedKeywords[0].rank).toBe(1);

    expect(sortedKeywords[1].keyword).toBe('ユーザー認証エラー');
    expect(sortedKeywords[1].frequency).toBe(1);
    expect(sortedKeywords[1].rank).toBe(2);

    expect(sortedKeywords[2].keyword).toBe('レポート出力機能の遅延');
    expect(sortedKeywords[2].frequency).toBe(1);
    expect(sortedKeywords[2].rank).toBe(3);

    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});