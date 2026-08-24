import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-2763: TextAnalysisServiceAdapter が例外を発生させたときに代替動作に切り替わらない
  test('should not fallback to cache or manual mode when TextAnalysisServiceAdapter throws exception', async () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを例外発生するように設定
    const failingTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockImplementation(() => {
        throw new Error('IOException: Connection failed');
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act & Assert: extractAndRankIssueKeywords を呼び出し、例外が throw されることを確認
    await expect(
      extractAndRankIssueKeywords(input, failingTextAnalysisAdapter)
    ).rejects.toThrow(/接続/);

    // Assert: adapter の extractKeywords が呼び出されたことを確認
    expect(failingTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();

    // Assert: キャッシュフォールバックまたは代替動作が実行されず、
    // エラーが直接ユーザーに伝播されることを確認（代替動作へ切り替わっていないことを確認）
    // つまり、代替動作の形跡（キャッシュからの読み込み、手動入力モードへの切り替え）がないことを確認
    expect(failingTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(1);
  });
});