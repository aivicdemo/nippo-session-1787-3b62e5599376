import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能 - 影響度スコア検証', () => {
  // SCEN-540: [error] 課題キーワード自動抽出・優先度判定機能 - 影響度スコアが100を超える値で返された場合、エラーを返す
  test('影響度スコアが有効範囲(0-100)を超過した場合、エラーを返す', async () => {
    // TextAnalysisServiceAdapterのスタブを定義
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'システム障害', frequency: 3 },
        { keyword: '全機能停止', frequency: 2 }
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(101), // 無効な値: 101 (> 100)
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const dailyReportText = 'システム障害により全機能停止しました。';

    // extractAndRankIssueKeywordsを呼び出し
    const result = await extractAndRankIssueKeywords(
      input,
      dailyReportText,
      mockTextAnalysisAdapter
    );

    // 期待結果: エラーが発生し、メッセージ内に影響度スコア範囲超過を示す内容が含まれる
    expect(result).toEqual(
      expect.objectContaining({
        error: expect.stringContaining('影響度スコア'),
        errorCode: 'INVALID_IMPACT_SCORE_RANGE'
      })
    );

    expect(result.error).toMatch(/有効範囲/);
    expect(result.error).toMatch(/0-100/);
    expect(result.error).toMatch(/101/);

    // TextAnalysisServiceAdapterのassessImpactScoreメソッドが呼び出されたことを確認
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});