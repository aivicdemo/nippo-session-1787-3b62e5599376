import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1478
  test('前週7日間の日報0件から空の課題リストが生成される', async () => {
    // テスト対象システムの初期状態を確認：データベースに日報レコードが存在しないことを確認する
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // TextAnalysisServiceAdapterをスタブ化し、extractKeywordsメソッドが呼び出されないようモック設定する
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // 対象関数『前週7日間の日報から課題キーワードを抽出し頻度ランク付けするメイン処理』を実行する
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // 戻り値の課題リストが空配列であることを検証する
    expect(result.keywords).toEqual([]);
    expect(result.keywords.length).toBe(0);

    // 戻り値に課題キーワード、出現頻度、重要度スコア、重要度レベルなどのプロパティが存在しないことを検証する
    expect(result.keywords).not.toContainEqual(
      expect.objectContaining({
        keywordId: expect.any(String),
        keyword: expect.any(String),
        frequency: expect.any(Number),
        rank: expect.any(Number),
      })
    );

    // TextAnalysisServiceAdapterのextractKeywordsメソッドは呼び出されない
    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();

    // 戻り値の全体情報を検証する
    expect(result.totalKeywordCount).toBe(0);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});