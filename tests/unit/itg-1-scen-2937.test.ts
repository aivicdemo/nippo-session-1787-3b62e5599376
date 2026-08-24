import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  test('SCEN-2937: 負の頻度スコアが含まれるとき処理を中断してエラーを返す', () => {
    // Arrange: TextAnalysisServiceAdapterのstubを準備
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          {
            keyword: 'データベース接続タイムアウト',
            frequency: -5,
          },
          {
            keyword: 'テスト失敗',
            frequency: 2,
          },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:00Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const reportText = '昨日は機能Aを開発。今日はテストを実施。課題：データベース接続がタイムアウトしている';

    // Act & Assert
    expect(() =>
      extractAndRankIssueKeywords(input, mockTextAnalysisService)
    ).toThrow(/INVALID_FREQUENCY_SCORE|negative|frequency/i);
  });
});