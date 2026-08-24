import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - extractAndRankIssueKeywords', () => {
  // SCEN-522: [normal] 課題自動抽出・優先度判定機能 - 10名のチームメンバーから集約された日報複数件の場合、抽出された全課題が発生頻度でランク付けされる
  test('should rank extracted issue keywords by frequency in descending order when processing reports from 10 team members', async () => {
    // Arrange: テスト用の日報データを準備
    const teamId = 'team-001';
    const requestUserId = 'admin-user-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;

    // モック化されたTextAnalysisServiceAdapter を作成
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(async (reportContent: string) => {
        // 日報内容に応じてキーワードを抽出（モック実装）
        const keywords: Array<{ keyword: string; frequency: number }> = [];

        if (reportContent.includes('データベース接続エラー')) {
          keywords.push({ keyword: 'データベース接続エラー', frequency: 1 });
        }
        if (reportContent.includes('デプロイ遅延')) {
          keywords.push({ keyword: 'デプロイ遅延', frequency: 1 });
        }
        if (reportContent.includes('ドキュメント不備')) {
          keywords.push({ keyword: 'ドキュメント不備', frequency: 1 });
        }

        return keywords;
      }),
      assessImpactScore: jest.fn(async () => 50),
      classifyIssueSeverity: jest.fn(async () => 'medium'),
    };

    // テスト用の集約日報データ
    const aggregatedReports = [
      { userId: 'user001', content: 'Yesterday: API development. Today: Testing. Challenge: データベース接続エラー occurred' },
      { userId: 'user002', content: 'Yesterday: DB setup. Today: Migration. Challenge: データベース接続エラー in production' },
      { userId: 'user003', content: 'Yesterday: Schema design. Today: Optimization. Challenge: データベース接続エラー after restart' },
      { userId: 'user004', content: 'Yesterday: Query tuning. Today: Indexing. Challenge: データベース接続エラー on backup' },
      { userId: 'user005', content: 'Yesterday: Monitoring. Today: Alerts. Challenge: データベース接続エラー detected' },
      { userId: 'user006', content: 'Yesterday: Build setup. Today: CI/CD. Challenge: デプロイ遅延 in pipeline' },
      { userId: 'user007', content: 'Yesterday: Testing. Today: Staging. Challenge: デプロイ遅延 with dependencies' },
      { userId: 'user008', content: 'Yesterday: Review. Today: Release. Challenge: デプロイ遅延 on approval' },
      { userId: 'user009', content: 'Yesterday: Writing docs. Today: Editing. Challenge: ドキュメント不備 in spec' },
      { userId: 'user010', content: 'Yesterday: API docs. Today: Examples. Challenge: ドキュメント不備 in changelog' },
    ];

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // Act: 対象関数を呼び出し、集約日報とモック化されたサービスを渡す
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      aggregatedReports,
      mockTextAnalysisService,
    );

    // Assert: 結果がランク付けされた課題キーワードの配列であることを検証
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBe(3);

    // Assert: 課題が発生頻度の降順でランク付けされていることを検証
    expect(result.keywords[0].keyword).toBe('データベース接続エラー');
    expect(result.keywords[0].frequency).toBe(5);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[0].keywordId).toBeDefined();

    expect(result.keywords[1].keyword).toBe('デプロイ遅延');
    expect(result.keywords[1].frequency).toBe(3);
    expect(result.keywords[1].rank).toBe(2);
    expect(result.keywords[1].keywordId).toBeDefined();

    expect(result.keywords[2].keyword).toBe('ドキュメント不備');
    expect(result.keywords[2].frequency).toBe(2);
    expect(result.keywords[2].rank).toBe(3);
    expect(result.keywords[2].keywordId).toBeDefined();

    // Assert: メタデータの検証
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeDefined();
    expect(result.extractedAt instanceof Date).toBe(true);
    expect(result.analysisperiodDays).toBe(7);

    // Assert: モック関数が正しく呼び出されたことを検証
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledTimes(10);
  });
});