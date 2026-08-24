import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  test('SCEN-2934: 抽出されたキーワードの頻度データが null のとき、処理を中断してエラーを返す', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        frequencyData: null,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const reportText =
      '昨日は機能A実装、今日は機能B実装、課題：データベース接続エラーが発生している';

    let errorThrown: Error | null = null;
    let result: RankedIssueKeywordList | null = null;

    try {
      result = await extractAndRankIssueKeywords(
        input,
        reportText,
        mockTextAnalysisServiceAdapter
      );
    } catch (error) {
      if (error instanceof Error) {
        errorThrown = error;
      }
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown?.message).toMatch(/頻度データ/);
    expect(result).toBeNull();
  });
});