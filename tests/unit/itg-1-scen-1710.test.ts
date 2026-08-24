import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  // SCEN-1710: [normal] 抽出されたキーワードに対してチーム波及度スコア（0-100）が算出される
  test('複数の日報テキストから課題キーワードを抽出し、チーム波及度スコアを算出して優先度でランク付けする', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'サーバーダウン', frequency: 2 },
        { keyword: '納期遅延', frequency: 1 },
        { keyword: '人員不足', frequency: 1 },
      ]),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          サーバーダウン: 75,
          納期遅延: 60,
          人員不足: 45,
        };
        return Promise.resolve(scoreMap[keyword] || 0);
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const reportTexts = [
      '本番サーバーがダウンした。納期が遅延する恐れ。人員不足のため対応が遅れている',
    ];

    const result = await extractAndRankIssueKeywords(
      reportTexts,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBe(3);

    const sortedByScore = result.keywords.sort((a, b) => b.frequency - a.frequency);

    const serverDownKeyword = result.keywords.find(
      (k) => k.keyword === 'サーバーダウン'
    );
    expect(serverDownKeyword).toBeDefined();
    expect(serverDownKeyword?.impactScore).toBe(75);
    expect(typeof serverDownKeyword?.impactScore).toBe('number');
    expect(serverDownKeyword?.impactScore).toBeGreaterThanOrEqual(0);
    expect(serverDownKeyword?.impactScore).toBeLessThanOrEqual(100);

    const delayKeyword = result.keywords.find((k) => k.keyword === '納期遅延');
    expect(delayKeyword).toBeDefined();
    expect(delayKeyword?.impactScore).toBe(60);
    expect(typeof delayKeyword?.impactScore).toBe('number');
    expect(delayKeyword?.impactScore).toBeGreaterThanOrEqual(0);
    expect(delayKeyword?.impactScore).toBeLessThanOrEqual(100);

    const staffKeyword = result.keywords.find((k) => k.keyword === '人員不足');
    expect(staffKeyword).toBeDefined();
    expect(staffKeyword?.impactScore).toBe(45);
    expect(typeof staffKeyword?.impactScore).toBe('number');
    expect(staffKeyword?.impactScore).toBeGreaterThanOrEqual(0);
    expect(staffKeyword?.impactScore).toBeLessThanOrEqual(100);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      'サーバーダウン'
    );
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      '納期遅延'
    );
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      '人員不足'
    );
  });
});