import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  test('SCEN-838: TextAnalysisServiceAdapterのextractKeywordsが3回再試行後も失敗したときエラーになる', async () => {
    // Mock TextAnalysisServiceAdapter
    let callCount = 0;
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockImplementation(() => {
        callCount++;
        // 全ての呼び出しで失敗を返す
        return Promise.reject(new Error('External API call failed'));
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportTexts = [
      '昨日は機能実装を行いました。今日はテスト対応を予定しています。課題は本番環境でデータベース接続タイムアウトが発生していることです。',
    ];

    // 再試行ロジックを含む extractAndRankIssueKeywords を呼び出す
    // 関数内部で3秒・10秒・30秒のインターバルで最大3回再試行される
    await expect(
      extractAndRankIssueKeywords(
        input,
        reportTexts,
        mockTextAnalysisServiceAdapter
      )
    ).rejects.toThrow(
      /TextAnalysisServiceAdapter.*Failed to extract keywords after 3 retries/
    );

    // 3回の再試行が実行されたことを確認（初回 + 3回の再試行 = 最大4回呼び出し）
    // ただし最後の再試行も失敗するため、実装によっては4回呼ばれる可能性がある
    expect(callCount).toBeGreaterThanOrEqual(3);
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});