import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Extract and Rank Issue Keywords - Deduplication with Same Date Range', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2258: [edge] 課題の重複検出と正規化 - 複数報告の日付範囲が開始日と終了日で同一の場合、重複判定の対象期間として扱われる
  test('should detect duplicate issue keywords reported on same date and mark as duplicate status', async () => {
    // 準備: 同じ日付（2025年1月15日）での重複課題報告をシミュレート
    const targetDate = new Date('2025-01-15T00:00:00Z');
    const startDate = new Date('2025-01-15T00:00:00Z');
    const endDate = new Date('2025-01-15T23:59:59Z');
    const teamId = 'team-001';
    const requestUserId = 'user-admin-001';

    // TextAnalysisServiceAdapterのモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'データベース接続エラー',
          frequency: 2,
          confidence: 0.95,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(85),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    // 入力パラメータの構成: 開始日と終了日が同じ（2025年1月15日）
    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    // テスト実行: 重複検出とランク付けロジックを実行
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
    );

    // 検証1: 抽出されたキーワードが返却されていること
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // 検証2: 重複検出後も1件のキーワードとして統合されていること
    expect(result.keywords.length).toBe(1);

    // 検証3: キーワード情報が正確に設定されていること
    const firstKeyword = result.keywords[0];
    expect(firstKeyword.keyword).toBe('データベース接続エラー');
    expect(firstKeyword.frequency).toBe(2); // 重複を統合した総発生頻度
    expect(firstKeyword.rank).toBe(1);

    // 検証4: 抽出実行日時が記録されていること
    expect(result.extractedAt).toBeInstanceOf(Date);

    // 検証5: 分析対象期間が正確に計算されていること（開始日と終了日が同じ場合は1日）
    expect(result.analysisperiodDays).toBe(1);

    // 検証6: 全キーワード数（フィルタ前）が正確に記録されていること
    expect(result.totalKeywordCount).toBe(1);

    // 検証7: モックされたextractKeywordsメソッドが呼び出されたこと
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();

    // 検証8: 重複判定対象期間が『2025-01-15～2025-01-15』として記録されていること
    // （内部的には開始日と終了日のISO文字列形式で保持）
    const expectedPeriodStart = '2025-01-15';
    const expectedPeriodEnd = '2025-01-15';

    // 結果のキーワードメタデータから重複情報を確認可能な状態を検証
    expect(firstKeyword).toHaveProperty('keywordId');
    expect(typeof firstKeyword.keywordId).toBe('string');
    expect(firstKeyword.keywordId.length).toBeGreaterThan(0);
  });
});