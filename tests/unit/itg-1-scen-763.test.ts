import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題抽出・優先度判定 - TextAnalysisServiceAdapter障害時のキャッシュフォールバック', () => {
  // SCEN-763
  test('assessImpactScore が失敗したとき、キャッシュから復旧した影響度スコアを返し、ユーザーに警告メッセージを表示する', async () => {
    // === セットアップ ===
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-manager-001';
    const minFrequencyThreshold = 1;

    // 抽出対象の日報テキスト
    const reportTexts = [
      'データベース障害により朝8時から10時まで全員が作業停止。原因調査中。',
      'データベース障害の影響でQA環境も連動してダウン。復旧まで2時間要した。',
      'ネットワーク遅延が発生し、API応答が40秒超過した。',
    ];

    // TextAnalysisServiceAdapter のモック化
    // assessImpactScore が失敗するシナリオを作成
    const failingTextAnalysisAdapter = {
      extractKeywords: async (text: string) => {
        // 正常系: キーワード抽出は成功
        if (text.includes('データベース')) {
          return ['データベース障害', '環境障害'];
        }
        if (text.includes('ネットワーク')) {
          return ['ネットワーク遅延', 'パフォーマンス低下'];
        }
        return [];
      },
      assessImpactScore: async (keyword: string) => {
        // エラー系: assessImpactScore は失敗（タイムアウト、API接続失敗など）
        throw new Error('API timeout: assessImpactScore request exceeded 30 seconds');
      },
      classifyIssueSeverity: async (content: string) => {
        return 'high';
      },
    };

    // キャッシュテーブル（内部保持テーブル「課題キーワード辞書」）
    const issueKeywordDictionary = new Map<string, number>([
      ['データベース障害', 85],
      ['環境障害', 72],
      ['ネットワーク遅延', 58],
      ['パフォーマンス低下', 61],
    ]);

    // === 実行 ===
    const result = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold,
        requestUserId,
      },
      failingTextAnalysisAdapter,
      issueKeywordDictionary
    );

    // === 検証 ===
    // 1. キャッシュから取得したスコア値が返却されることを確認
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // 2. 「データベース障害」がランク付けされていることを確認
    const databaseFailureKeyword = result.keywords.find(
      (kw) => kw.keyword === 'データベース障害'
    );
    expect(databaseFailureKeyword).toBeDefined();
    expect(databaseFailureKeyword?.impactScore).toBe(85); // キャッシュから復旧されたスコア
    expect(databaseFailureKeyword?.impactScore).toBeGreaterThanOrEqual(0);
    expect(databaseFailureKeyword?.impactScore).toBeLessThanOrEqual(100);

    // 3. 「ネットワーク遅延」もキャッシュから復旧されることを確認
    const networkDelayKeyword = result.keywords.find(
      (kw) => kw.keyword === 'ネットワーク遅延'
    );
    expect(networkDelayKeyword).toBeDefined();
    expect(networkDelayKeyword?.impactScore).toBe(58); // キャッシュから復旧されたスコア
    expect(networkDelayKeyword?.impactScore).toBeGreaterThanOrEqual(0);
    expect(networkDelayKeyword?.impactScore).toBeLessThanOrEqual(100);

    // 4. 発生頻度でランク付けされていることを確認
    expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(
      result.keywords[result.keywords.length - 1].frequency
    );

    // 5. ユーザーへのエラー警告メッセージ
    expect(result.fallbackWarningMessage).toBe(
      '課題分析が一時的に利用できません。手動入力をご利用ください'
    );

    // 6. フォールバック状態が記録されていることを確認
    expect(result.isFallbackMode).toBe(true);

    // 7. キャッシュから取得したことの監査ログ情報
    expect(result.cacheHitCount).toBeGreaterThan(0);
    expect(result.cacheMissCount).toBeGreaterThanOrEqual(0);

    // 8. 新規日報入力については手動キーワード入力モードに切り替わることの指示
    expect(result.manualKeywordInputRequired).toBe(true);

    // 9. 総キーワード数とランクの一貫性
    expect(result.totalKeywordCount).toBeGreaterThan(0);
    result.keywords.forEach((keyword, index) => {
      expect(keyword.rank).toBe(index + 1);
    });

    // 10. 抽出日時が記録されていることを確認
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.extractedAt.getTime()).toBeGreaterThan(0);

    // 11. 分析対象期間が正確に計算されていることを確認
    expect(result.analysisperiodDays).toBe(7); // 1月8日 00:00 ～ 1月14日 23:59 = 7日間
  });
});