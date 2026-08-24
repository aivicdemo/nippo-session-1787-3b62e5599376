import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { TextAnalysisServiceAdapter } from '../../src/adapters/text-analysis-service-adapter';

describe('課題キーワード自動抽出機能', () => {
  let mockTextAnalysisAdapter: jest.Mocked<TextAnalysisServiceAdapter>;

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  // SCEN-210
  test('[normal] 日報テキストからOpenAI APIが正常応答し、課題キーワードが発生頻度でランク付けされる', async () => {
    // Arrange
    const reportText = 'データベース接続エラーが発生。サーバー再起動で一時回避。データベース接続の根本原因調査が必要。';
    const mockKeywordFrequency = {
      'データベース接続': 2,
      'エラー': 1,
      'サーバー': 1,
    };

    mockTextAnalysisAdapter.extractKeywords.mockResolvedValue(mockKeywordFrequency);

    // Act
    const result = await extractAndRankIssueKeywords(
      reportText,
      mockTextAnalysisAdapter
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(3);
    
    // First ranked keyword: 'データベース接続' with frequency 2
    expect(result.keywords[0]).toEqual({
      keyword: 'データベース接続',
      frequency: 2,
      rank: 1,
    });
    
    // Second and third ranked keywords with frequency 1
    // Either 'エラー' or 'サーバー' could be second, but order is deterministic
    expect(result.keywords[1].frequency).toBe(1);
    expect(result.keywords[1].rank).toBe(2);
    expect(result.keywords[2].frequency).toBe(1);
    expect(result.keywords[2].rank).toBe(3);
    
    // Verify keywords are in descending order by frequency
    expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(result.keywords[1].frequency);
    expect(result.keywords[1].frequency).toBeGreaterThanOrEqual(result.keywords[2].frequency);
    
    // Verify adapter was called with correct parameter
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(reportText);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(1);
  });
});