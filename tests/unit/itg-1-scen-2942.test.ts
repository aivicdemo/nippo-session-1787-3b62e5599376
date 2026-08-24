import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-2942
  test('should accurately separate issue keywords by month when report period spans month boundary', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn((text: string) => {
        const keywords: { [key: string]: number } = {};
        if (text.includes('システム障害')) {
          keywords['システム障害'] = (keywords['システム障害'] || 0) + 1;
        }
        if (text.includes('API遅延')) {
          keywords['API遅延'] = (keywords['API遅延'] || 0) + 1;
        }
        if (text.includes('メモリリーク')) {
          keywords['メモリリーク'] = (keywords['メモリリーク'] || 0) + 1;
        }
        return Promise.resolve(keywords);
      }),
      assessImpactScore: jest.fn(() => Promise.resolve(50)),
      classifyIssueSeverity: jest.fn(() => Promise.resolve('medium')),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-11-28T00:00:00Z'),
      endDate: new Date('2024-12-03T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const November28Report = {
      reportId: 'report-001',
      reportDate: new Date('2024-11-28T09:00:00Z'),
      content: 'システム障害が発生した。データベース接続がタイムアウト。',
    };

    const November29Report = {
      reportId: 'report-002',
      reportDate: new Date('2024-11-29T09:00:00Z'),
      content: 'システム障害の影響でAPI遅延が続いている。',
    };

    const November30Report = {
      reportId: 'report-003',
      reportDate: new Date('2024-11-30T09:00:00Z'),
      content: 'メモリリークを検出。システム障害の根本原因か。',
    };

    const December01Report = {
      reportId: 'report-004',
      reportDate: new Date('2024-12-01T09:00:00Z'),
      content: 'システム障害は解決した。API遅延も改善。',
    };

    const December02Report = {
      reportId: 'report-005',
      reportDate: new Date('2024-12-02T09:00:00Z'),
      content: 'メモリリークの修正が完了。本番環境へのデプロイ待ち。',
    };

    const reportDataset = [
      November28Report,
      November29Report,
      November30Report,
      December01Report,
      December02Report,
    ];

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter, reportDataset);

    expect(result).toBeDefined();
    expect(result.extractedAt).toBeDefined();
    expect(result.analysisperiodDays).toBe(6);
    expect(result.totalKeywordCount).toBeGreaterThan(0);

    const novemberKeywords = result.keywords.filter(
      (kw) => kw.keywordId.startsWith('nov-') || kw.rank <= 3
    );

    const decemberKeywords = result.keywords.filter(
      (kw) => kw.keywordId.startsWith('dec-') || kw.rank > 3
    );

    const systemFailureNov = result.keywords.find(
      (kw) => kw.keyword === 'システム障害' && new Date(kw.keywordId).getMonth() === 10
    );

    const systemFailureDec = result.keywords.find(
      (kw) => kw.keyword === 'システム障害' && new Date(kw.keywordId).getMonth() === 11
    );

    if (systemFailureNov) {
      expect(systemFailureNov.frequency).toBe(2);
    }

    if (systemFailureDec) {
      expect(systemFailureDec.frequency).toBe(1);
    }

    expect(result.keywords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'システム障害',
          frequency: expect.any(Number),
          rank: expect.any(Number),
        }),
      ])
    );

    const totalSystemFailureCount = result.keywords
      .filter((kw) => kw.keyword === 'システム障害')
      .reduce((sum, kw) => sum + kw.frequency, 0);

    expect(totalSystemFailureCount).toBe(3);

    const distinctMonths = new Set(
      result.keywords
        .filter((kw) => kw.keyword === 'システム障害')
        .map((kw) => new Date(kw.keywordId).getMonth())
    );

    expect(distinctMonths.size).toBe(2);
    expect(distinctMonths).toEqual(expect.arrayContaining([10, 11]));

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});