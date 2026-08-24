import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking - Happy Path', () => {
  let mockTextAnalysisServiceAdapter: any;

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  // SCEN-550: [edge] 課題キーワード自動抽出・優先度判定機能 - チームメンバー10名すべてから日報が提出されている状態で課題一覧が生成される
  test('should extract and rank issue keywords from 10 team members reports with full submission', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-manager-001';

    // Prepare 10 team members' reports with extracted keywords
    const report1Keywords = [
      { keyword: 'データベース接続エラー', frequency: 1 },
      { keyword: 'ネットワークタイムアウト', frequency: 1 },
    ];
    const report2Keywords = [
      { keyword: 'データベース接続エラー', frequency: 1 },
      { keyword: 'メモリリーク', frequency: 1 },
    ];
    const report3Keywords = [
      { keyword: 'データベース接続エラー', frequency: 1 },
    ];
    const report4Keywords = [
      { keyword: 'データベース接続エラー', frequency: 1 },
      { keyword: 'APIレート制限', frequency: 1 },
    ];
    const report5Keywords = [
      { keyword: 'データベース接続エラー', frequency: 1 },
    ];
    const report6Keywords = [
      { keyword: 'メモリリーク', frequency: 1 },
      { keyword: 'パフォーマンス低下', frequency: 1 },
    ];
    const report7Keywords = [
      { keyword: 'APIレート制限', frequency: 1 },
    ];
    const report8Keywords = [
      { keyword: 'ネットワークタイムアウト', frequency: 1 },
      { keyword: 'パフォーマンス低下', frequency: 1 },
    ];
    const report9Keywords = [
      { keyword: 'データベース接続エラー', frequency: 1 },
    ];
    const report10Keywords = [
      { keyword: 'メモリリーク', frequency: 1 },
    ];

    // Mock extractKeywords to return keywords for each report
    mockTextAnalysisServiceAdapter.extractKeywords
      .mockResolvedValueOnce(report1Keywords)
      .mockResolvedValueOnce(report2Keywords)
      .mockResolvedValueOnce(report3Keywords)
      .mockResolvedValueOnce(report4Keywords)
      .mockResolvedValueOnce(report5Keywords)
      .mockResolvedValueOnce(report6Keywords)
      .mockResolvedValueOnce(report7Keywords)
      .mockResolvedValueOnce(report8Keywords)
      .mockResolvedValueOnce(report9Keywords)
      .mockResolvedValueOnce(report10Keywords);

    // Mock assessImpactScore for each unique keyword
    // "データベース接続エラー" appears in 5 reports -> high impact
    mockTextAnalysisServiceAdapter.assessImpactScore
      .mockResolvedValueOnce(85) // データベース接続エラー
      .mockResolvedValueOnce(60) // ネットワークタイムアウト
      .mockResolvedValueOnce(70) // メモリリーク
      .mockResolvedValueOnce(50) // APIレート制限
      .mockResolvedValueOnce(75); // パフォーマンス低下

    // Mock classifyIssueSeverity for each unique keyword
    mockTextAnalysisServiceAdapter.classifyIssueSeverity
      .mockResolvedValueOnce('高')   // データベース接続エラー
      .mockResolvedValueOnce('中')   // ネットワークタイムアウト
      .mockResolvedValueOnce('中')   // メモリリーク
      .mockResolvedValueOnce('低')   // APIレート制限
      .mockResolvedValueOnce('中');  // パフォーマンス低下

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // Execute the function with mocked adapter
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    // Verify the result structure
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('totalKeywordCount');
    expect(result).toHaveProperty('extractedAt');
    expect(result).toHaveProperty('analysisperiodDays');

    // Verify analysis period is 7 days (Jan 8 to Jan 14 inclusive)
    expect(result.analysisperiodDays).toBe(7);

    // Verify that keywords are sorted by frequency in descending order
    expect(result.keywords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'データベース接続エラー',
          frequency: 5,
          rank: 1,
        }),
        expect.objectContaining({
          keyword: 'メモリリーク',
          frequency: 3,
          rank: 2,
        }),
        expect.objectContaining({
          keyword: 'パフォーマンス低下',
          frequency: 2,
          rank: 3,
        }),
        expect.objectContaining({
          keyword: 'ネットワークタイムアウト',
          frequency: 2,
          rank: 4,
        }),
        expect.objectContaining({
          keyword: 'APIレート制限',
          frequency: 2,
          rank: 5,
        }),
      ])
    );

    // Verify total keyword count before filtering
    expect(result.totalKeywordCount).toBe(5);

    // Verify extractedAt is a valid Date
    expect(result.extractedAt).toBeInstanceOf(Date);

    // Verify that the function called extractKeywords 10 times (once per team member report)
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(10);

    // Verify that the function called assessImpactScore for each unique keyword
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();

    // Verify that the function called classifyIssueSeverity for each unique keyword
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalled();
  });
});