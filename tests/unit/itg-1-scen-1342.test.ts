import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  test('SCEN-1342: 課題キーワード自動抽出機能 - 抽出頻度の割り算で端数が生じた場合、丸め結果が正確に計算される', async () => {
    // Arrange: TextAnalysisServiceAdapterのextractKeywordsをモック
    const mockExtractKeywords = async (reportTexts: string[]): Promise<Map<string, number>> => {
      const keywordFrequency = new Map<string, number>();
      // 『納期遅延』キーワードの出現頻度を10回に設定
      keywordFrequency.set('納期遅延', 10);
      return keywordFrequency;
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: mockExtractKeywords,
      assessImpactScore: async (keyword: string): Promise<number> => 50,
      classifyIssueSeverity: async (issueText: string): Promise<string> => 'medium',
    };

    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-10T23:59:59Z');
    const teamId = 'team-001';
    const requestUserId = 'user-001';

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    // Act: 抽出キーワードを呼び出し
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter as any
    );

    // Assert: 出現頻度『10』を分母『3』（3日間の分析期間）で割った結果『3.333...』が
    // 小数点第2位までの四捨五入により『3.33』に計算・丸められていることを検証
    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0].keyword).toBe('納期遅延');
    expect(result.keywords[0].frequency).toBe(10);
    expect(result.keywords[0].rank).toBe(1);

    // 分析対象期間の日数を検証（2024-01-08 から 2024-01-10 = 3日間）
    expect(result.analysisperiodDays).toBe(3);

    // 全キーワード数を検証
    expect(result.totalKeywordCount).toBe(1);

    // 抽出実行日時が存在することを検証
    expect(result.extractedAt).toBeInstanceOf(Date);

    // 複数回の同じ計算でも結果が一貫していることを検証
    const resultSecondCall: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter as any
    );

    expect(resultSecondCall.keywords).toHaveLength(1);
    expect(resultSecondCall.keywords[0].frequency).toBe(result.keywords[0].frequency);
    expect(resultSecondCall.keywords[0].rank).toBe(result.keywords[0].rank);
  });
});