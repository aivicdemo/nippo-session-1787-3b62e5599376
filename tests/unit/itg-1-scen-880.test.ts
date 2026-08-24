import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-880
  test('課題キーワードの発生頻度がちょうど1回のとき、ランク付けされる', () => {
    const stubTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 1,
            confidence: 0.95,
          },
        ],
        totalKeywordCount: 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(25),
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const reportTexts = [
      'データベース接続エラーが発生した。データベース接続エラーの原因を調査中。',
    ];

    const result: RankedIssueKeywordList = {
      keywords: [
        {
          keywordId: 'keyword-db-connection-001',
          keyword: 'データベース接続エラー',
          frequency: 1,
          rank: 1,
        },
      ],
      totalKeywordCount: 1,
      extractedAt: new Date('2024-01-15T09:00:00Z'),
      analysisperiodDays: 7,
    };

    expect(
      extractAndRankIssueKeywords(input, stubTextAnalysisAdapter)
    ).resolves.toEqual(result);

    expect(stubTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      reportTexts,
      expect.objectContaining({
        teamId: 'team-001',
      })
    );

    expect(result.keywords[0]).toMatchObject({
      keyword: 'データベース接続エラー',
      frequency: 1,
      rank: 1,
    });

    expect(result.totalKeywordCount).toBe(1);
    expect(result.analysisperiodDays).toBe(7);
  });
});