import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-2945: [edge] 抽出結果のランク順序が逆順（降順期待を昇順で返す）になった場合を検出する
  test('TextAnalysisServiceAdapterが昇順で返した場合、降順に並び替えて返却すること', async () => {
    // Arrange
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: '対応待ち', frequency: 2 },
        { keyword: 'バグ', frequency: 5 },
        { keyword: 'リスク', frequency: 8 }
      ])
    };

    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-001';

    const reportingTexts = [
      'バグが多発している。対応待ちのタスクが多い。リスク管理が必要。'
    ];

    // Act
    const result = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold,
        requestUserId
      },
      mockTextAnalysisService
    );

    // Assert
    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'リスク',
      frequency: 8,
      rank: 1
    });
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'バグ',
      frequency: 5,
      rank: 2
    });
    expect(result.keywords[2]).toEqual({
      keywordId: expect.any(String),
      keyword: '対応待ち',
      frequency: 2,
      rank: 3
    });

    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toEqual(expect.any(Date));
    expect(result.analysisperiodDays).toBe(7);
  });
});