import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出と影響度ランキング - TextAnalysisServiceAdapter連携', () => {
  test('SCEN-3070: OpenAI API GPT-5.6連携 - 正常応答時にチーム波及度スコアが算出される', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockResolvedValue({
        keywords: ['システム障害', 'データベース遅延', 'ネットワーク接続問題'],
        impactScores: [85, 62, 45],
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input_keywords = ['システム障害', 'データベース遅延', 'ネットワーク接続問題'];

    const result = await extractAndRankIssueKeywords(
      input_keywords,
      mockTextAnalysisServiceAdapter
    );

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      input_keywords
    );

    expect(result.impactScores).toBeDefined();
    expect(Array.isArray(result.impactScores)).toBe(true);
    expect(result.impactScores.length).toBe(3);

    expect(result.impactScores[0]).toBe(85);
    expect(result.impactScores[1]).toBe(62);
    expect(result.impactScores[2]).toBe(45);

    result.impactScores.forEach((score: number) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(score)).toBe(true);
    });

    expect(result.impactScores[0]).toBeGreaterThan(result.impactScores[1]);
    expect(result.impactScores[1]).toBeGreaterThan(result.impactScores[2]);
  });
});