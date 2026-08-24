import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  // SCEN-1880
  test('複数キーワードで検索した場合、すべてのキーワードにマッチする課題のみが抽出される', () => {
    // 準備: テストデータとして複数の課題キーワード抽出結果を模擬
    const extractedChallenges = [
      {
        challengeId: 'issue-A',
        content: 'データベース接続エラーが発生している',
        keywords: ['データベース', '接続エラー'],
        occurrenceCount: 3,
        impactScore: 85,
      },
      {
        challengeId: 'issue-B',
        content: 'APIレスポンスが遅い',
        keywords: ['APIレスポンス', '遅い'],
        occurrenceCount: 2,
        impactScore: 60,
      },
      {
        challengeId: 'issue-C',
        content: 'データベース接続は正常だがAPIレスポンスに問題がない',
        keywords: ['データベース', '接続'],
        occurrenceCount: 1,
        impactScore: 40,
      },
      {
        challengeId: 'issue-D',
        content: 'ネットワーク遅延のみ報告',
        keywords: ['ネットワーク', '遅延'],
        occurrenceCount: 1,
        impactScore: 30,
      },
    ];

    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-001';

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    // 複数キーワード「データベース」AND「接続エラー」で検索
    const searchKeywords = ['データベース', '接続エラー'];

    // 実行: extractAndRankIssueKeywords 関数を呼び出し
    // (実装では TextAnalysisServiceAdapter をモック化し、上記の抽出結果を返すよう設定)
    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      extractedChallenges,
      searchKeywords
    );

    // 期待結果の検証
    // 課題Aのみが結果に含まれることを確認
    // (課題Aは両キーワード『データベース』『接続エラー』を含む)
    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0].keywordId).toBe('issue-A');
    expect(result.keywords[0].keyword).toBe('データベース接続エラー');
    expect(result.keywords[0].frequency).toBe(3);
    expect(result.keywords[0].rank).toBe(1);

    // 課題B、C、Dは表示されないことを確認
    // (課題Bと課題Dは『データベース』を含まず、
    //  課題Cは『接続エラー』を含まないため)
    expect(result.keywords.map((k) => k.keywordId)).not.toContain('issue-B');
    expect(result.keywords.map((k) => k.keywordId)).not.toContain('issue-C');
    expect(result.keywords.map((k) => k.keywordId)).not.toContain('issue-D');

    // 抽出処理の実行日時が記録されていることを確認
    expect(result.extractedAt).toBeInstanceOf(Date);

    // 分析対象期間の日数を確認 (1月8日から1月14日までの7日間)
    expect(result.analysisperiodDays).toBe(7);
  });
});