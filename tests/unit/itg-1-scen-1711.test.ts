import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出機能', () => {
  // SCEN-1711: [normal] 課題キーワード自動抽出・優先度スコア算出機能 - 優先度スコアの高い課題から昇順でソートされた状態で返される
  test('複数の課題キーワードが優先度スコアの高い順に降順ソートされて返される', async () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを準備
    const textAnalysisServiceStub = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'データベース障害', frequency: 3 },
        { keyword: 'ドキュメント未更新', frequency: 1 },
        { keyword: 'ネットワーク遅延', frequency: 2 },
      ]),
      assessImpactScore: jest.fn().mockImplementation((keyword: string) => {
        const scoreMap: Record<string, number> = {
          'データベース障害': 85,
          'ドキュメント未更新': 42,
          'ネットワーク遅延': 68,
        };
        return Promise.resolve(scoreMap[keyword] ?? 0);
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const reportText =
      'データベース障害が発生し、システムが利用できません。ドキュメント未更新の問題も継続しており、ネットワーク遅延が見られます。';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');

    // Act: 課題キーワード自動抽出・優先度スコア算出機能を呼び出す
    const result = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold: 1,
        requestUserId: 'user-001',
      },
      textAnalysisServiceStub
    );

    // Assert: 返却されたデータが優先度スコアの高い順に降順ソートされていることを確認
    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'データベース障害',
      frequency: 3,
      rank: 1,
      impactScore: 85,
    });
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'ネットワーク遅延',
      frequency: 2,
      rank: 2,
      impactScore: 68,
    });
    expect(result.keywords[2]).toEqual({
      keywordId: expect.any(String),
      keyword: 'ドキュメント未更新',
      frequency: 1,
      rank: 3,
      impactScore: 42,
    });

    // 集計期間の日数を確認（2024-01-08 から 2024-01-14 は 7 日間）
    expect(result.analysisPeriodDays).toBe(7);
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});