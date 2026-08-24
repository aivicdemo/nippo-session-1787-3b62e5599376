import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能', () => {
  // SCEN-1012
  test('同じ日報テキストで2回抽出を実行した場合、同じキーワードと頻度が返される', () => {
    // Arrange
    const sampleReportText = 'データベース接続エラーが発生している。API呼び出しのタイムアウト問題も並行して発生';
    
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((reportText: string) => {
        if (reportText === sampleReportText) {
          return {
            keywords: ['データベース接続エラー', 'タイムアウト'],
            frequencies: {
              'データベース接続エラー': 1,
              'タイムアウト': 1
            }
          };
        }
        return { keywords: [], frequencies: {} };
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    // Act - 1回目の抽出
    const firstExtractionResult = extractAndRankIssueKeywords(
      sampleReportText,
      mockTextAnalysisAdapter
    );

    // Act - 2回目の抽出
    const secondExtractionResult = extractAndRankIssueKeywords(
      sampleReportText,
      mockTextAnalysisAdapter
    );

    // Assert
    expect(firstExtractionResult.keywords).toEqual(secondExtractionResult.keywords);
    expect(firstExtractionResult.keywords).toEqual(['データベース接続エラー', 'タイムアウト']);
    
    expect(firstExtractionResult.frequencies).toEqual(secondExtractionResult.frequencies);
    expect(firstExtractionResult.frequencies['データベース接続エラー']).toBe(1);
    expect(firstExtractionResult.frequencies['タイムアウト']).toBe(1);
    
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(2);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(sampleReportText);
  });
});