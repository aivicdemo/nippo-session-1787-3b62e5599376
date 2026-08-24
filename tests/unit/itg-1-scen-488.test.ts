import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-488
  test('日報テキストが空文字列のときエラーハンドリングが動作する', () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockImplementation((text: string) => {
        if (!text || text.trim().length === 0) {
          throw new Error('空の入力テキスト');
        }
        return {
          keywords: [],
          confidence: 0,
        };
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const emptyReportContent = '';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-001';

    const input = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    expect(() =>
      extractAndRankIssueKeywords(input, mockTextAnalysisService)
    ).toThrow(/空の入力テキスト/);
  });
});