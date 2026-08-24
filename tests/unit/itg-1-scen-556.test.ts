import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能', () => {
  test('SCEN-556: 抽出されたキーワードが impactScore の高い順（降順）に並んでいることを確認', () => {
    // Arrange
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-manager-001';

    // TextAnalysisServiceAdapter のモック
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: '顧客対応',
          frequency: 15,
          impactScore: 85,
        },
        {
          keyword: 'DB障害',
          frequency: 8,
          impactScore: 92,
        },
        {
          keyword: 'ドキュメント作成',
          frequency: 5,
          impactScore: 45,
        },
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Act
    const result = extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold,
        requestUserId,
      },
      mockTextAnalysisService
    );

    // Assert
    expect(result).resolves.toMatchObject({
      keywords: [
        {
          keyword: 'DB障害',
          frequency: 8,
          impactScore: 92,
          rank: 1,
        },
        {
          keyword: '顧客対応',
          frequency: 15,
          impactScore: 85,
          rank: 2,
        },
        {
          keyword: 'ドキュメント作成',
          frequency: 5,
          impactScore: 45,
          rank: 3,
        },
      ],
      totalKeywordCount: 3,
      analysisperiodDays: 7,
    });

    // キーワード順序が impactScore の降順であることを明示的に検証
    result.then((rankingResult) => {
      expect(rankingResult.keywords[0].impactScore).toBe(92);
      expect(rankingResult.keywords[1].impactScore).toBe(85);
      expect(rankingResult.keywords[2].impactScore).toBe(45);

      // 降順の検証：前のスコアが後ろのスコアより大きい
      for (let i = 0; i < rankingResult.keywords.length - 1; i++) {
        expect(rankingResult.keywords[i].impactScore).toBeGreaterThan(
          rankingResult.keywords[i + 1].impactScore
        );
      }
    });
  });
});