import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-2151
  test('should aggregate issue keywords from multiple projects and rank by frequency', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'データベース接続エラー', frequency: 1 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(65),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const mockExtractedReports = [
      {
        reportId: 'report-A-001',
        projectId: 'projectA',
        content: 'データベース接続エラーが発生しました',
        timestamp: new Date('2024-01-10T09:00:00Z'),
      },
      {
        reportId: 'report-B-001',
        projectId: 'projectB',
        content: 'データベース接続エラーとAPI遅延が確認されました',
        timestamp: new Date('2024-01-11T09:00:00Z'),
      },
      {
        reportId: 'report-A-002',
        projectId: 'projectA',
        content: 'データベース接続エラーが再度発生しました',
        timestamp: new Date('2024-01-12T09:00:00Z'),
      },
    ];

    const mockNormalizedKeywords = [
      {
        normalizedKeyword: 'データベース接続エラー',
        originalKeywords: ['データベース接続エラー'],
        mergedFrequency: 3,
        projectOccurrences: [
          { projectId: 'projectA', frequency: 2 },
          { projectId: 'projectB', frequency: 1 },
        ],
      },
      {
        normalizedKeyword: 'API遅延',
        originalKeywords: ['API遅延'],
        mergedFrequency: 1,
        projectOccurrences: [{ projectId: 'projectB', frequency: 1 }],
      },
    ];

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      mockExtractedReports,
      mockNormalizedKeywords
    );

    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0].keyword).toBe('データベース接続エラー');
    expect(result.keywords[0].frequency).toBe(3);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[1].keyword).toBe('API遅延');
    expect(result.keywords[1].frequency).toBe(1);
    expect(result.keywords[1].rank).toBe(2);
    expect(result.totalKeywordCount).toBe(2);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});