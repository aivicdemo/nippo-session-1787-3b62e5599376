import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('朝会報告管理システム - 課題キーワード自動抽出と優先度ランク付け', () => {
  // SCEN-1394: [edge] 重複課題の自動判定と統合機能 - 入力課題データの並び順が逆順の場合、統合結果と優先度順序が変わらない
  test('should produce identical merged results and priority order regardless of input order', () => {
    // 日報データセット準備
    const dailyReport_1 = {
      id: 'report_1',
      reporterId: 'eng_001',
      reportDate: '2024-01-15',
      yesterday: 'DB接続テスト実施',
      today: 'ログ出力確認',
      issues: 'DB接続エラーが発生し、ログ出力不可となった',
    };

    const dailyReport_2 = {
      id: 'report_2',
      reporterId: 'eng_002',
      reportDate: '2024-01-15',
      yesterday: 'ログシステム調査',
      today: 'エラー対応',
      issues: 'ログ出力不可、DB接続エラーの影響を受けている',
    };

    // 入力順序A: DB接続エラー → ログ出力不可
    const inputA: ExtractIssueKeywordsInput = {
      reportDataList: [dailyReport_1, dailyReport_2],
      analysisStartDate: '2024-01-08',
      analysisEndDate: '2024-01-15',
      minFrequencyThreshold: 1,
    };

    // 入力順序B: 逆順 (ログ出力不可 → DB接続エラー)
    const inputB: ExtractIssueKeywordsInput = {
      reportDataList: [dailyReport_2, dailyReport_1],
      analysisStartDate: '2024-01-08',
      analysisEndDate: '2024-01-15',
      minFrequencyThreshold: 1,
    };

    // 実行: 順序Aで抽出・ランク付け
    const resultA: RankedIssueKeywordList = extractAndRankIssueKeywords(inputA);

    // 実行: 順序Bで抽出・ランク付け
    const resultB: RankedIssueKeywordList = extractAndRankIssueKeywords(inputB);

    // 検証1: 抽出課題数が一致
    expect(resultA.keywords.length).toBe(resultB.keywords.length);
    expect(resultA.keywords.length).toBe(2);

    // 検証2: 総課題件数が一致
    expect(resultA.totalIssueCount).toBe(resultB.totalIssueCount);
    expect(resultA.totalIssueCount).toBe(2);

    // 検証3: 優先度順序が一致 (優先度スコアで降順)
    expect(resultA.keywords[0].keyword).toBe(resultB.keywords[0].keyword);
    expect(resultA.keywords[1].keyword).toBe(resultB.keywords[1].keyword);

    // 検証4: 優先度スコアが一致
    expect(resultA.keywords[0].priorityScore).toBe(resultB.keywords[0].priorityScore);
    expect(resultA.keywords[1].priorityScore).toBe(resultB.keywords[1].priorityScore);

    // 検証5: 発生頻度が一致
    expect(resultA.keywords[0].frequency).toBe(resultB.keywords[0].frequency);
    expect(resultA.keywords[1].frequency).toBe(resultB.keywords[1].frequency);

    // 検証6: 表示色が一致
    expect(resultA.keywords[0].priorityColor).toBe(resultB.keywords[0].priorityColor);
    expect(resultA.keywords[1].priorityColor).toBe(resultB.keywords[1].priorityColor);

    // 検証7: 優先度順序がスコア降順であることを確認
    expect(resultA.keywords[0].priorityScore).toBeGreaterThanOrEqual(
      resultA.keywords[1].priorityScore
    );

    // 検証8: DB接続エラーがログ出力不可より優先度が高い
    expect(resultA.keywords[0].keyword).toMatch(/DB接続/);
    expect(resultA.keywords[1].keyword).toMatch(/ログ出力/);

    // 検証9: 分析実行時刻が ISO 8601 形式であることを確認
    expect(resultA.analysisExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(resultB.analysisExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // 検証10: データ品質スコアが0～100の範囲内であることを確認
    expect(resultA.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(resultA.dataQualityScore).toBeLessThanOrEqual(100);
    expect(resultB.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(resultB.dataQualityScore).toBeLessThanOrEqual(100);

    // 検証11: 優先度スコアが0～100の範囲内であることを確認
    for (const keyword of resultA.keywords) {
      expect(keyword.priorityScore).toBeGreaterThanOrEqual(0);
      expect(keyword.priorityScore).toBeLessThanOrEqual(100);
    }
    for (const keyword of resultB.keywords) {
      expect(keyword.priorityScore).toBeGreaterThanOrEqual(0);
      expect(keyword.priorityScore).toBeLessThanOrEqual(100);
    }

    // 検証12: 発生頻度が正の整数であることを確認
    for (const keyword of resultA.keywords) {
      expect(keyword.frequency).toBeGreaterThan(0);
      expect(Number.isInteger(keyword.frequency)).toBe(true);
    }
    for (const keyword of resultB.keywords) {
      expect(keyword.frequency).toBeGreaterThan(0);
      expect(Number.isInteger(keyword.frequency)).toBe(true);
    }
  });
});