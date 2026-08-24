import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation', () => {
  test('SCEN-889: should return empty array when no daily reports exist', () => {
    // Arrange: テストデータ準備 - 当日の日報件数が0件の状態
    const emptyReports: any[] = [];
    
    // Mock TextAnalysisServiceAdapter - 呼び出されないため最小限の定義
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Act: 課題優先度スコア自動算出機能を呼び出す
    const result = calculateIssuePriorityScore(emptyReports, mockTextAnalysisServiceAdapter);

    // Assert: 戻り値が空配列であることを検証
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});