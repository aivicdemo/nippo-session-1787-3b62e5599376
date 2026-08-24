import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能', () => {
  // SCEN-143: [edge] 課題キーワード自動抽出機能 - 日報から抽出されたキーワードの発生頻度が小数点を含むとき、正しく丸めて表示される
  test('小数点を含む発生頻度が四捨五入で正確に表示される', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keywordId: 'kw-001', keyword: 'バグ対応', frequency: 2.5 },
          { keywordId: 'kw-002', keyword: 'パフォーマンス改善', frequency: 3.7 },
          { keywordId: 'kw-003', keyword: 'ドキュメント作成', frequency: 1.33 }
        ]
      })
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // 期待値: 小数点が四捨五入で整数化される
    // バグ対応: 2.5 → 3（四捨五入）
    // パフォーマンス改善: 3.7 → 4（四捨五入）
    // ドキュメント作成: 1.33 → 1（四捨五入）
    expect(result.keywords).toHaveLength(3);

    // ランク1位: パフォーマンス改善（四捨五入後 4）
    expect(result.keywords[0]).toEqual({
      keywordId: 'kw-002',
      keyword: 'パフォーマンス改善',
      frequency: 4,
      rank: 1
    });

    // ランク2位: バグ対応（四捨五入後 3）
    expect(result.keywords[1]).toEqual({
      keywordId: 'kw-001',
      keyword: 'バグ対応',
      frequency: 3,
      rank: 2
    });

    // ランク3位: ドキュメント作成（四捨五入後 1）
    expect(result.keywords[2]).toEqual({
      keywordId: 'kw-003',
      keyword: 'ドキュメント作成',
      frequency: 1,
      rank: 3
    });

    // 全キーワード数（フィルタ前）は 3
    expect(result.totalKeywordCount).toBe(3);

    // 分析対象期間の日数は 7 日間（1月15日から1月21日）
    expect(result.analysisperiodDays).toBe(7);

    // extractedAt が存在して ISO 8601 形式であることを確認
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.extractedAt.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});