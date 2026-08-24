import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type TextAnalysisServiceAdapter } from '../../src/adapters/text-analysis-service-adapter';

describe('課題の影響度判定と優先度スコア付け機能', () => {
  // SCEN-757: [error] 課題自動抽出・優先度判定機能 - 影響度スコアがnullのとき、エラーを返す
  test('影響度スコアがnullのとき、エラーを返す', () => {
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: ['データベース接続エラー', 'タイムアウト'],
        confidence: 0.85,
      }),
      assessImpactScore: jest.fn().mockReturnValue(null),
      classifyIssueSeverity: jest.fn().mockReturnValue('high'),
    };

    const reportText =
      'データベース接続エラーが発生し、朝の定時処理がタイムアウトしました。';
    const teamId = 'team-001';
    const reportingDate = '2024-01-15';

    const result = extractAndRankIssueKeywords(
      {
        reportText,
        teamId,
        reportingDate,
        occurrenceFrequency: 2,
        affectedTeamCount: 3,
        resolutionDaysAverage: 1.5,
      },
      mockTextAnalysisAdapter
    );

    expect(result).toEqual({
      code: 'INVALID_IMPACT_SCORE',
      message: '影響度スコアが無効です。API応答を確認してください。',
      statusCode: 400,
    });
  });
});