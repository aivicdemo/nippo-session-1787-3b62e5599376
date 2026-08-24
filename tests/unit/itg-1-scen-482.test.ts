import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題自動抽出・優先度判定機能', () => {
  test('SCEN-482: TextAnalysisServiceAdapterが正常応答した場合にキーワード抽出と影響度判定が完了される', async () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを初期化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'システム障害', frequency: 3 },
        { keyword: '対応', frequency: 2 }
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('高')
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
      reportText: 'システム障害が発生し対応に時間がかかった。同じ問題が他チームでも報告されている'
    };

    // Act: 課題抽出・優先度判定機能を実行
    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    // Assert: extractKeywordsメソッドが呼び出されたことを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      input.reportText
    );
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(1);

    // Assert: assessImpactScoreメソッドが呼び出されたことを確認
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      expect.objectContaining({
        keywords: expect.arrayContaining([
          expect.objectContaining({ keyword: 'システム障害' }),
          expect.objectContaining({ keyword: '対応' })
        ])
      })
    );
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(1);

    // Assert: classifyIssueSeverityメソッドが呼び出されたことを確認
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledWith(
      input.reportText
    );
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(1);

    // Assert: 抽出されたキーワードが結果に含まれることを確認
    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.keywords).toContainEqual(
      expect.objectContaining({
        keyword: 'システム障害'
      })
    );

    // Assert: 影響度スコアが結果に含まれることを確認
    expect(result.impactScore).toBe(75);

    // Assert: 重要度分類が結果に含まれることを確認
    expect(result.severity).toBe('高');

    // Assert: キーワードが発生頻度でランク付けされていることを確認
    if (result.keywords.length > 1) {
      expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(
        result.keywords[1].frequency
      );
    }

    // Assert: 分析期間情報が記録されていることを確認
    expect(result.analysisPeriodDays).toBe(7);
    expect(result.extractedAt).toBeDefined();
    expect(typeof result.extractedAt).toBe('string');

    // Assert: 全キーワード数が記録されていることを確認
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(result.keywords.length);
  });
});