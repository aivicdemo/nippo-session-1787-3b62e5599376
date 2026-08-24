import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Team Aggregation', () => {
  let mockTextAnalysisServiceAdapter: any;

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2150
  test('should aggregate issue keywords by team with correct frequency counts when same keyword is reported across multiple teams', async () => {
    const teamAStartDate = new Date('2024-01-08T00:00:00Z');
    const teamAEndDate = new Date('2024-01-14T23:59:59Z');
    const teamBStartDate = new Date('2024-01-08T00:00:00Z');
    const teamBEndDate = new Date('2024-01-14T23:59:59Z');

    // Setup mock responses for Team A reports
    mockTextAnalysisServiceAdapter.extractKeywords
      .mockResolvedValueOnce([
        { keyword: 'データベース接続エラー', frequency: 1 },
      ])
      .mockResolvedValueOnce([
        { keyword: 'タイムアウト', frequency: 1 },
      ])
      .mockResolvedValueOnce([
        { keyword: 'メモリ不足', frequency: 1 },
      ])
      // Setup mock responses for Team B reports
      .mockResolvedValueOnce([
        { keyword: 'データベース接続エラー', frequency: 1 },
        { keyword: 'ネットワーク遅延', frequency: 1 },
      ])
      .mockResolvedValueOnce([
        { keyword: 'ネットワーク遅延', frequency: 1 },
      ]);

    const inputTeamA: ExtractIssueKeywordsInput = {
      teamId: 'team-a-001',
      startDate: teamAStartDate,
      endDate: teamAEndDate,
      minFrequencyThreshold: 1,
      requestUserId: 'user-admin-001',
    };

    const inputTeamB: ExtractIssueKeywordsInput = {
      teamId: 'team-b-001',
      startDate: teamBStartDate,
      endDate: teamBEndDate,
      minFrequencyThreshold: 1,
      requestUserId: 'user-admin-001',
    };

    const resultTeamA: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      inputTeamA,
      mockTextAnalysisServiceAdapter,
    );

    const resultTeamB: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      inputTeamB,
      mockTextAnalysisServiceAdapter,
    );

    // Verify Team A results
    expect(resultTeamA.keywords).toHaveLength(3);
    expect(resultTeamA.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'データベース接続エラー',
      frequency: 1,
      rank: 1,
    });
    expect(resultTeamA.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'タイムアウト',
      frequency: 1,
      rank: 2,
    });
    expect(resultTeamA.keywords[2]).toEqual({
      keywordId: expect.any(String),
      keyword: 'メモリ不足',
      frequency: 1,
      rank: 3,
    });
    expect(resultTeamA.totalKeywordCount).toBe(3);

    // Verify Team B results
    expect(resultTeamB.keywords).toHaveLength(2);
    expect(resultTeamB.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'ネットワーク遅延',
      frequency: 2,
      rank: 1,
    });
    expect(resultTeamB.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'データベース接続エラー',
      frequency: 1,
      rank: 2,
    });
    expect(resultTeamB.totalKeywordCount).toBe(2);

    // Verify the shared keyword "データベース接続エラー" appears in both teams with separate frequencies
    const sharedKeywordInTeamA = resultTeamA.keywords.find(
      (k) => k.keyword === 'データベース接続エラー',
    );
    const sharedKeywordInTeamB = resultTeamB.keywords.find(
      (k) => k.keyword === 'データベース接続エラー',
    );

    expect(sharedKeywordInTeamA).toBeDefined();
    expect(sharedKeywordInTeamA!.frequency).toBe(1);
    expect(sharedKeywordInTeamB).toBeDefined();
    expect(sharedKeywordInTeamB!.frequency).toBe(1);

    // Verify analysis period calculation
    const expectedAnalysisDays = 7; // 8日から14日までの7日間
    expect(resultTeamA.analysisperiodDays).toBe(expectedAnalysisDays);
    expect(resultTeamB.analysisperiodDays).toBe(expectedAnalysisDays);

    // Verify extraction timestamps are recent
    expect(resultTeamA.extractedAt).toBeInstanceOf(Date);
    expect(resultTeamB.extractedAt).toBeInstanceOf(Date);

    // Verify TextAnalysisServiceAdapter was called for all reports
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(
      5,
    );
  });
});