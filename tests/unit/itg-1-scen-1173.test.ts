import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type TextAnalysisServiceAdapter } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1173
  test('日報から1件の課題キーワードが抽出された場合、単一要素の一覧が返される', () => {
    const mockTextAnalysisServiceAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'サーバーダウン',
            frequency: 1,
          },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportText =
      '昨日はサーバー監視を行った。今日もサーバーの状態確認を続ける。課題はサーバーダウンのリスク対応である';

    const result = extractAndRankIssueKeywords(reportText, mockTextAnalysisServiceAdapter);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('keyword');
    expect(result[0]).toHaveProperty('frequency');
    expect(result[0].keyword).toBe('サーバーダウン');
    expect(result[0].frequency).toBe(1);
    expect(typeof result[0].keyword).toBe('string');
    expect(typeof result[0].frequency).toBe('number');
  });
});