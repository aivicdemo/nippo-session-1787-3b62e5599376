import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue extraction and keyword ranking', () => {
  // SCEN-2378: [edge] 課題発生頻度の定量化 - 複数の日報に同一の課題キーワードが出現したとき、出現回数を正確にカウントする
  test('should accurately count keyword frequency across multiple reports', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Setup mock responses for each report's keyword extraction
    mockTextAnalysisService.extractKeywords
      .mockResolvedValueOnce({
        keywords: [
          { text: 'データベース', frequency: 1 },
          { text: 'エラー', frequency: 1 },
        ],
        reportId: 'report-001',
        reportDate: '2024-01-15',
      })
      .mockResolvedValueOnce({
        keywords: [
          { text: 'データベース', frequency: 1 },
          { text: 'タイムアウト', frequency: 1 },
        ],
        reportId: 'report-002',
        reportDate: '2024-01-15',
      })
      .mockResolvedValueOnce({
        keywords: [
          { text: 'データベース', frequency: 1 },
          { text: '実装', frequency: 1 },
        ],
        reportId: 'report-003',
        reportDate: '2024-01-15',
      });

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportData = [
      {
        reportId: 'report-001',
        reportDate: '2024-01-15',
        content: 'データベース接続エラーが発生。データベース関連の対応が必要',
      },
      {
        reportId: 'report-002',
        reportDate: '2024-01-15',
        content: 'APIのレスポンスタイムアウト。データベース接続テストを実施',
      },
      {
        reportId: 'report-003',
        reportDate: '2024-01-15',
        content: 'ユーザー認証機能の実装中。データベース設計を確認予定',
      },
    ];

    // Call the function with mock service
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService as any,
    );

    // Verify that keyword frequency aggregation is correct
    const databaseKeyword = result.keywords.find(
      (k) => k.keyword === 'データベース',
    );

    expect(databaseKeyword).toBeDefined();
    expect(databaseKeyword?.frequency).toBe(3);
    expect(databaseKeyword?.rank).toBe(1);
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(3);
    expect(result.analysisperiodDays).toBe(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.keywords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'データベース',
          frequency: 3,
          rank: 1,
        }),
      ]),
    );
  });
});