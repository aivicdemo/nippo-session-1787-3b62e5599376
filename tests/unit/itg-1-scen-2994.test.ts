import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能 - 外部サービス失敗時のエラー伝播', () => {
  test('SCEN-2994: TextAnalysisServiceAdapter の extractKeywords が呼び出し失敗時、エラーが正しく伝播される', async () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを作成し、extractKeywords がエラーをスロー
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockImplementation(() => {
        throw new Error('API_CONNECTION_TIMEOUT');
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-dept-head-001',
    };

    const reportText =
      '昨日は顧客A対応で障害対応が発生。今日も継続対応予定。顧客Aシステムの安定性が課題';

    // Act & Assert: extractAndRankIssueKeywords を呼び出し、例外がスロー されることを期待
    try {
      await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter, [
        { teamId: 'team-001', reportDate: '2024-01-10', content: reportText },
      ]);
      // ここに到達しない場合、テスト失敗
      expect(false).toBe(true);
    } catch (error) {
      // エラーが正しく伝播されていることを確認
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/API_CONNECTION_TIMEOUT/);
    }

    // TextAnalysisServiceAdapter.extractKeywords が呼び出されたことを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});