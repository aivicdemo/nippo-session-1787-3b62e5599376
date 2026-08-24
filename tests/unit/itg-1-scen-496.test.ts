import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-496
  test('抽出されたキーワード配列が空のときエラーを返す', () => {
    // TextAnalysisServiceAdapterのスタブを準備
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // 入力データの準備
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportText = '特に課題はありません';

    // 関数を呼び出してエラーをキャッチ
    return extractAndRankIssueKeywords(
      input,
      reportText,
      textAnalysisServiceAdapterStub
    ).catch((error) => {
      // 期待結果の検証
      expect(error).toBeDefined();
      expect(error.message).toMatch(/課題キーワードが抽出されませんでした/);

      // assessImpactScore と classifyIssueSeverity が呼び出されないことを確認
      expect(textAnalysisServiceAdapterStub.assessImpactScore).not.toHaveBeenCalled();
      expect(textAnalysisServiceAdapterStub.classifyIssueSeverity).not.toHaveBeenCalled();
    });
  });
});