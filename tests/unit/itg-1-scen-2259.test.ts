import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Cross-Month Deduplication', () => {
  // SCEN-2259: [edge] 課題の重複検出と正規化 - 複数報告が月をまたぐ期間で提出された場合、正規化処理で月をまたいだ重複が検出される
  test('should detect and normalize cross-month duplicate issue keywords', async () => {
    // Arrange: モック化されたTextAnalysisServiceAdapterを準備
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (reportText: string) => {
        // 両日報から同一のキーワード「データベース接続エラー」を抽出
        if (
          reportText.includes('データベース接続エラーが発生') ||
          reportText.includes('DB接続エラーが発生')
        ) {
          return {
            keywords: [
              {
                keyword: 'データベース接続エラー',
                frequency: 1,
                confidence: 0.95,
              },
              {
                keyword: 'エラー対応',
                frequency: 1,
                confidence: 0.75,
              },
            ],
            extractedAt: new Date().toISOString(),
          };
        }
        return { keywords: [], extractedAt: new Date().toISOString() };
      }),
      assessImpactScore: jest.fn(async (keyword: string) => ({
        impactScore: 75,
        affectedTeamCount: 3,
      })),
      classifyIssueSeverity: jest.fn(async (issueText: string) => 'high'),
    };

    // テスト用の日報データ（月をまたぐ）
    const februaryReportId = 'report-2024-02-01-user-a';
    const marchReportId = 'report-2024-03-15-user-b';

    const februaryReportText =
      '昨日やったこと: データベース接続エラーが発生し、対応に2時間要した。抱えている課題: データベース接続エラーが頻発している。';
    const marchReportText =
      '昨日やったこと: 前日の案件完了。抱えている課題: DB接続エラーが発生し、ユーザーから報告が相次いでいる。';

    // 入力パラメータの準備
    const startDate = new Date('2024-02-01T00:00:00Z');
    const endDate = new Date('2024-03-31T23:59:59Z');

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-dev-001',
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    // モック化されたレポートデータを提供する追加のモック構造
    const mockReportProvider = {
      getReportsByTeamAndDateRange: jest.fn(async () => [
        {
          reportId: februaryReportId,
          teamId: 'team-dev-001',
          reporterUserId: 'user-a',
          reportDate: new Date('2024-02-01T09:00:00Z'),
          reportText: februaryReportText,
          challenges: 'データベース接続エラーが頻発している。',
        },
        {
          reportId: marchReportId,
          teamId: 'team-dev-001',
          reporterUserId: 'user-b',
          reportDate: new Date('2024-03-15T09:30:00Z'),
          reportText: marchReportText,
          challenges: 'DB接続エラーが発生し、ユーザーから報告が相次いでいる。',
        },
      ]),
    };

    // Act: extractAndRankIssueKeywordsを実行
    // 注: 実装側で外部のTextAnalysisServiceAdapterを使用することを想定
    // テストでは、モック化されたアダプターが渡されることを前提にする
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter as any,
      mockReportProvider as any
    );

    // Assert: 結果を検証

    // 1. キーワード抽出の基本検証
    expect(result).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // 2. 重複検出前のキーワード集計を検証
    // 2つの日報から抽出されたキーワード「データベース接続エラー」の統合発生頻度を検証
    const dbErrorKeyword = result.keywords.find(
      (kw) => kw.keyword === 'データベース接続エラー' || kw.keyword.includes('データベース')
    );
    expect(dbErrorKeyword).toBeDefined();
    // 両日報から抽出されているため、正規化後の発生頻度は2であるべき
    expect(dbErrorKeyword?.frequency).toBe(2);

    // 3. キーワードがランク付けされていることを検証
    expect(dbErrorKeyword?.rank).toBe(1);

    // 4. 抽出実行日時が記録されていることを検証
    expect(result.extractedAt).toBeDefined();
    expect(typeof result.extractedAt).toBe('string');
    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate.getTime()).toBeGreaterThan(0);

    // 5. 分析対象期間の日数を検証
    // 2024-02-01 から 2024-03-31 までは88日（2月は閏年で29日）
    expect(result.analysisperiodDays).toBe(90); // 2月1日から3月31日まで

    // 6. 全キーワード数を検証
    // 2つの日報からそれぞれ2つのキーワードが抽出されているが、
    // 「データベース接続エラー」は重複なので正規化後は3つ（1つの「データベース接続エラー」と1つの「エラー対応」各1）
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(1);

    // 7. TextAnalysisServiceAdapterのextractKeywordsが両日報に対して呼び出されたことを検証
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(2);

    // 8. extractKeywordsの呼び出し引数を検証
    const extractKeywordsCalls = mockTextAnalysisAdapter.extractKeywords.mock
      .calls;
    expect(extractKeywordsCalls[0][0]).toContain('データベース接続エラーが発生');
    expect(extractKeywordsCalls[1][0]).toContain('DB接続エラーが発生');

    // 9. 月をまたいだ重複が同一課題として認識されていることを検証
    // 複数の日報から同じキーワードが抽出された場合、それらは統合されるべき
    const deduplicatedCount = result.keywords.filter(
      (kw) =>
        kw.keyword === 'データベース接続エラー' ||
        kw.keyword.includes('データベース')
    ).length;
    expect(deduplicatedCount).toBe(1); // 重複排除されて1件になるべき

    // 10. ランク付けの順序を検証
    // 発生頻度の高い順に並んでいるべき
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(
        result.keywords[i + 1].frequency
      );
      expect(result.keywords[i].rank).toBeLessThanOrEqual(
        result.keywords[i + 1].rank
      );
    }

    // 11. 各キーワードにIDが付与されていることを検証
    result.keywords.forEach((keyword) => {
      expect(keyword.keywordId).toBeDefined();
      expect(typeof keyword.keywordId).toBe('string');
      expect(keyword.keywordId.length).toBeGreaterThan(0);
    });

    // 12. 各キーワードにランクが正しく付与されていることを検証
    result.keywords.forEach((keyword, index) => {
      expect(keyword.rank).toBe(index + 1);
    });
  });
});