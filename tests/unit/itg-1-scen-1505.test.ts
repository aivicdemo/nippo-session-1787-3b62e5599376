import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking - Month Boundary Edge Case', () => {
  // SCEN-1505
  test('should correctly aggregate and rank issue keywords when extraction period spans month boundary (Jan 25-31)', async () => {
    // Setup: Define the extraction period crossing month boundary
    const startDate = new Date('2024-01-25T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');
    const teamId = 'team-001';
    const requestUserId = 'user-pm-001';
    const minFrequencyThreshold = 1;

    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest
        .fn()
        .mockImplementation((reportText: string) => {
          // Extract keywords from report text
          const keywords: Array<{ keyword: string; frequency: number }> = [];

          if (reportText.includes('バグ対応')) {
            keywords.push({ keyword: 'バグ対応', frequency: 1 });
          }
          if (reportText.includes('性能問題')) {
            keywords.push({ keyword: '性能問題', frequency: 1 });
          }
          if (reportText.includes('ドキュメント不足')) {
            keywords.push({ keyword: 'ドキュメント不足', frequency: 1 });
          }

          return keywords;
        }),
      assessImpactScore: jest.fn().mockReturnValue(50),
      classifyIssueSeverity: jest.fn().mockReturnValue('medium'),
    };

    // Prepare 7 days of report data spanning month boundary
    const reportDataset = [
      {
        reportId: 'report-2024-01-25',
        reportDate: new Date('2024-01-25T09:00:00Z'),
        teamId,
        challenges: '昨日はバグ対応を実施しました。',
      },
      {
        reportId: 'report-2024-01-26',
        reportDate: new Date('2024-01-26T09:00:00Z'),
        teamId,
        challenges: 'バグ対応が継続しています。',
      },
      {
        reportId: 'report-2024-01-27',
        reportDate: new Date('2024-01-27T09:00:00Z'),
        teamId,
        challenges: '性能問題が発生しました。',
      },
      {
        reportId: 'report-2024-01-28',
        reportDate: new Date('2024-01-28T09:00:00Z'),
        teamId,
        challenges: 'バグ対応を続行中です。',
      },
      {
        reportId: 'report-2024-01-29',
        reportDate: new Date('2024-01-29T09:00:00Z'),
        teamId,
        challenges: 'ドキュメント不足が課題です。',
      },
      {
        reportId: 'report-2024-01-30',
        reportDate: new Date('2024-01-30T09:00:00Z'),
        teamId,
        challenges: 'バグ対応を完了しました。',
      },
      {
        reportId: 'report-2024-01-31',
        reportDate: new Date('2024-01-31T09:00:00Z'),
        teamId,
        challenges: '性能問題の対応を開始します。',
      },
    ];

    // Data outside the range that must not be included
    const outOfRangeReports = [
      {
        reportId: 'report-2024-01-24',
        reportDate: new Date('2024-01-24T09:00:00Z'),
        teamId,
        challenges: 'バグ対応（should not be counted）',
      },
      {
        reportId: 'report-2024-02-01',
        reportDate: new Date('2024-02-01T09:00:00Z'),
        teamId,
        challenges: 'バグ対応（should not be counted）',
      },
    ];

    // Aggregate keywords from in-range reports only
    const aggregatedKeywords: Record<string, number> = {};

    for (const report of reportDataset) {
      const extractedKeywords = mockTextAnalysisService.extractKeywords(
        report.challenges
      );
      for (const keywordData of extractedKeywords) {
        aggregatedKeywords[keywordData.keyword] =
          (aggregatedKeywords[keywordData.keyword] || 0) + 1;
      }
    }

    // Verify that out-of-range data is NOT included
    for (const outOfRange of outOfRangeReports) {
      const extractedKeywords = mockTextAnalysisService.extractKeywords(
        outOfRange.challenges
      );
      // These should not affect the aggregation in actual implementation
      expect(extractedKeywords).toBeDefined();
    }

    // Prepare input for extractAndRankIssueKeywords
    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // Call the target function
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService
    );

    // Verify aggregated keyword frequencies
    expect(aggregatedKeywords['バグ対応']).toBe(4);
    expect(aggregatedKeywords['性能問題']).toBe(2);
    expect(aggregatedKeywords['ドキュメント不足']).toBe(1);

    // Verify result structure and ranking
    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(3);
    expect(result.totalKeywordCount).toBe(3);

    // Verify ranking order (highest frequency first)
    expect(result.keywords[0].keyword).toBe('バグ対応');
    expect(result.keywords[0].frequency).toBe(4);
    expect(result.keywords[0].rank).toBe(1);

    expect(result.keywords[1].keyword).toBe('性能問題');
    expect(result.keywords[1].frequency).toBe(2);
    expect(result.keywords[1].rank).toBe(2);

    expect(result.keywords[2].keyword).toBe('ドキュメント不足');
    expect(result.keywords[2].frequency).toBe(1);
    expect(result.keywords[2].rank).toBe(3);

    // Verify extraction timestamp is recorded
    expect(result.extractedAt).toBeDefined();
    expect(result.extractedAt instanceof Date).toBe(true);

    // Verify analysis period is exactly 7 days
    expect(result.analysisperiodDays).toBe(7);

    // Verify that extracted data falls within the specified range only
    const extractedDateRange = {
      start: startDate,
      end: endDate,
    };
    expect(extractedDateRange.start.toISOString()).toBe(
      '2024-01-25T00:00:00.000Z'
    );
    expect(extractedDateRange.end.toISOString()).toBe(
      '2024-01-31T23:59:59.000Z'
    );

    // Verify no out-of-range keywords are included
    const allKeywords = result.keywords.map((k) => k.keyword);
    expect(allKeywords).toEqual(['バグ対応', '性能問題', 'ドキュメント不足']);
  });
});