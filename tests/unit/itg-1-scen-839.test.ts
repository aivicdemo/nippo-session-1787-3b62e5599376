import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  test('// SCEN-839: 抽出されたキーワードが空配列で返されたときエラーになる', () => {
    // Arrange: TextAnalysisServiceAdapter をモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-07T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-001';

    const reportTexts = [
      'システム障害が発生し、データベース接続がタイムアウトした。原因調査中。',
    ];

    // Act & Assert: 空配列が返された場合、エラーをスローすることを確認
    expect(async () => {
      await extractAndRankIssueKeywords(
        {
          teamId,
          startDate,
          endDate,
          minFrequencyThreshold,
          requestUserId,
        },
        mockTextAnalysisAdapter,
        reportTexts
      );
    }).rejects.toThrow(/キーワード抽出/);
  });
});