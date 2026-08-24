import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出と優先度ランク付け', () => {
  // SCEN-2254: [edge] 課題の重複検出と正規化 - 同一課題キーワードの出現頻度が閾値直上（例：4回）の場合、重複として正規化される
  test('同一課題キーワード出現頻度が閾値と同一（4回）の場合、重複として正規化されて1件の統合課題として登録される', async () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 4,
            occurrences: [
              { date: '2024-01-15', text: 'データベース接続エラーが発生した' },
              { date: '2024-01-16', text: 'またデータベース接続エラーが起きた' },
              { date: '2024-01-17', text: 'データベース接続エラーが繰り返される' },
              { date: '2024-01-18', text: 'データベース接続エラーが継続している' },
            ],
          },
        ],
        totalKeywords: 1,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-123',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-18T23:59:59Z'),
      minFrequencyThreshold: 4,
      requestUserId: 'user-001',
    };

    // Act
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    // Assert
    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0].keyword).toBe('データベース接続エラー');
    expect(result.keywords[0].frequency).toBe(4);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.totalKeywordCount).toBe(1);
    expect(result.analysisperiodDays).toBe(4);
    expect(result.extractedAt).toEqual(expect.any(Date));
  });
});