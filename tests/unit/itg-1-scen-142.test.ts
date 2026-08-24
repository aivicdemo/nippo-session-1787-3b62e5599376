import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能 - 重複度計算の正確性', () => {
  it('SCEN-142: 同一キーワード複数出現時に全出現回数が重複度計算に正しく反映される', async () => {
    // Arrange: TextAnalysisServiceAdapterのstubを準備
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続',
            frequency: 3,
            contexts: [
              'データベース接続エラーが発生',
              'データベース接続の問題は昨日も発生',
              'データベース接続テストを実施中'
            ]
          }
        ]
      })
    };

    const reportText = 'データベース接続エラーが発生。データベース接続の問題は昨日も発生していて、データベース接続テストを実施中';
    const teamId = 'team-001';
    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-mgr-001';
    const minFrequencyThreshold = 1;

    // Act: 課題キーワード自動抽出機能を実行
    const result = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate: analysisStartDate,
        endDate: analysisEndDate,
        minFrequencyThreshold,
        requestUserId
      },
      mockTextAnalysisAdapter
    );

    // Assert: キーワード「データベース接続」の出現回数が3回と正確に記録されていることを確認
    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0].keyword).toBe('データベース接続');
    expect(result.keywords[0].frequency).toBe(3);
    expect(result.keywords[0].rank).toBe(1);

    // Assert: 総キーワード数が1であることを確認
    expect(result.totalKeywordCount).toBe(1);

    // Assert: extractedAtが日時文字列として記録されていることを確認
    expect(result.extractedAt).toBeInstanceOf(Date);

    // Assert: 分析対象期間が7日間（8日から14日）として計算されていることを確認
    const expectedAnalysisPeriodDays = 7;
    expect(result.analysisperiodDays).toBe(expectedAnalysisPeriodDays);

    // Assert: TextAnalysisServiceAdapterのextractKeywordsメソッドが呼び出されたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();

    // Assert: 重複度の計算に全出現回数3が正しく含まれていることを確認
    // キーワードのfrequencyが3で、全キーワード数の計算に使用されていることを検証
    const totalFrequency = result.keywords.reduce((sum, kw) => sum + kw.frequency, 0);
    expect(totalFrequency).toBe(3);
  });
});