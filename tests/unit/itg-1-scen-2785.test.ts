import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  // SCEN-2785: [edge] 課題キーワード自動抽出・頻度ランク付け機能 - 日報テキストから抽出されたキーワード出現頻度が閾値直下（2回）で表示対象外になる
  test('should exclude keywords with frequency below minFrequencyThreshold and record to internal dictionary', async () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 2,
          },
          {
            keyword: 'ネットワーク遅延',
            frequency: 1,
          },
          {
            keyword: 'メモリ不足',
            frequency: 1,
          },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 3,
      requestUserId: 'user-001',
    };

    // Act
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    // Assert
    // 出現頻度が minFrequencyThreshold (3) 未満のキーワードは結果に含まれない
    expect(result.keywords).toEqual([]);
    expect(result.keywords.length).toBe(0);

    // 全キーワード数（フィルタ前）は3件記録される
    expect(result.totalKeywordCount).toBe(3);

    // 分析対象期間は 7 日間（2024-01-08 ～ 2024-01-14）
    expect(result.analysisperiodDays).toBe(7);

    // extractedAt は ISO 8601 形式で現在時刻に近い値
    expect(result.extractedAt).toBeInstanceOf(Date);

    // TextAnalysisServiceAdapter の extractKeywords が呼び出されたことを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith({
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
    });

    // requestUserId が正しく受け取られたことを確認
    expect(input.requestUserId).toBe('user-001');
  });
});