import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  // SCEN-1714
  test('TextAnalysisServiceAdapterが正常応答したとき、抽出キーワードと影響度スコアが部長向けダッシュボード用に整形される', () => {
    const mockExtractKeywords = jest.fn().mockReturnValue({
      'システム障害': 3,
      '納期遅延': 2,
    });

    const mockAssessImpactScore = jest.fn((keyword: string): number => {
      const scoreMap: Record<string, number> = {
        'システム障害': 85,
        '納期遅延': 62,
      };
      return scoreMap[keyword] || 0;
    });

    const textAnalysisServiceAdapter = {
      extractKeywords: mockExtractKeywords,
      assessImpactScore: mockAssessImpactScore,
      classifyIssueSeverity: jest.fn(),
    };

    const reportText =
      'データベースの障害が発生し、3時間システムが停止した。納期が2日遅延する見込み';

    const result = extractAndRankIssueKeywords(reportText, textAnalysisServiceAdapter);

    expect(mockExtractKeywords).toHaveBeenCalledWith(reportText);
    expect(mockAssessImpactScore).toHaveBeenCalledWith('システム障害');
    expect(mockAssessImpactScore).toHaveBeenCalledWith('納期遅延');

    expect(result).toEqual([
      {
        keyword: 'システム障害',
        frequency: 3,
        impactScore: 85,
      },
      {
        keyword: '納期遅延',
        frequency: 2,
        impactScore: 62,
      },
    ]);

    expect(result[0].impactScore).toBeGreaterThan(result[1].impactScore);
    expect(result.every((item) => typeof item.keyword === 'string')).toBe(true);
    expect(result.every((item) => typeof item.frequency === 'number')).toBe(true);
    expect(result.every((item) => typeof item.impactScore === 'number')).toBe(true);
  });
});