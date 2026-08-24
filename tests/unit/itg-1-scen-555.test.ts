import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能', () => {
  // SCEN-555: 複数日報に同じキーワードが含まれている場合、発生頻度が累積されて計算される
  test('複数日報から同一キーワードの発生頻度が累積計算される', async () => {
    // Arrange: TextAnalysisServiceAdapter をモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn()
        .mockResolvedValueOnce([{ keyword: 'エラー', frequency: 1 }]) // 1日目
        .mockResolvedValueOnce([{ keyword: 'エラー', frequency: 1 }]) // 2日目
        .mockResolvedValueOnce([{ keyword: 'エラー', frequency: 1 }]), // 3日目
      assessImpactScore: jest.fn().mockResolvedValue(50),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    // 1日目の日報入力
    const report_day1 = {
      reportId: 'report-001',
      content: 'データベース接続エラーが発生している。サーバーのメモリ不足が疑われる',
      reportingDate: new Date('2024-01-15T09:00:00Z')
    };

    // 2日目の日報入力
    const report_day2 = {
      reportId: 'report-002',
      content: 'エラーの原因を調査中。昨日と同じエラーが再発している',
      reportingDate: new Date('2024-01-16T09:00:00Z')
    };

    // 3日目の日報入力
    const report_day3 = {
      reportId: 'report-003',
      content: 'エラー対応が完了した。別の箇所でエラーが新たに検出された',
      reportingDate: new Date('2024-01-17T09:00:00Z')
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-17T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    // Act: 関数を呼び出し、複数日報の課題キーワード抽出を実行
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    // Assert: 累積発生頻度が正しく計算されている
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // 「エラー」キーワードが存在し、frequency が 3 で累積されていることを確認
    const errorKeyword = result.keywords.find(kw => kw.keyword === 'エラー');
    expect(errorKeyword).toBeDefined();
    if (errorKeyword) {
      expect(errorKeyword.frequency).toBe(3); // 1 + 1 + 1 = 3
      expect(errorKeyword.rank).toBe(1); // 最も高い発生頻度のため rank=1
      expect(errorKeyword.keywordId).toBeDefined();
    }

    // 全キーワード数を確認
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(1);

    // 抽出実行日時が記録されている
    expect(result.extractedAt).toBeInstanceOf(Date);

    // 分析対象期間の日数を確認（3日間）
    expect(result.analysisperiodDays).toBe(3);

    // テキスト解析アダプタが 3 回呼び出されたことを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(3);
  });
});