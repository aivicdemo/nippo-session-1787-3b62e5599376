import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1182: TextAnalysisServiceAdapter.extractKeywords が undefined を返すときの例外ハンドリング
  test('extractKeywords が undefined を返した場合、制御された例外を発生させる', () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを準備
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue(undefined),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-dept-manager-001',
    };

    // Act & Assert: extractKeywords が undefined を返した場合、エラーを発生させることを確認
    expect(() => {
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/課題キーワード抽出失敗/);
  });
});