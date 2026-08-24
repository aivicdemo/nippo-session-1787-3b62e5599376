import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type TextAnalysisServiceAdapter } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-841
  test('発生頻度が負の数で返されたときエラーハンドリングが実行される', async () => {
    const reportText = 'サーバーがダウンしました。データベース接続エラーが頻繁に発生しています';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-pm-001';

    const mockTextAnalysisServiceAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { text: 'サーバーダウン', frequency: -5 },
          { text: 'データベース接続エラー', frequency: -3 },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
      reportTexts: [reportText],
    };

    let thrownError: Error | null = null;
    let result: any = null;

    try {
      result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/課題分析/);

    const mockCalls = (mockTextAnalysisServiceAdapter.extractKeywords as jest.Mock).mock.calls;
    expect(mockCalls.length).toBeGreaterThan(0);

    const retryAttempts = mockCalls.length;
    expect(retryAttempts).toBeGreaterThanOrEqual(1);
    expect(retryAttempts).toBeLessThanOrEqual(3);
  });
});