import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランキング機能', () => {
  // SCEN-773
  test('集約日報データの必須フィールドが不足している場合、エラーを返す', () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Case 1: 課題フィールドがnull
    const inputWithNullIssue: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act & Assert - Case 1: 課題フィールドがnull
    expect(() => {
      extractAndRankIssueKeywords(inputWithNullIssue, mockTextAnalysisServiceAdapter as any);
    }).toThrow(/必須フィールド/);

    // Case 2: 昨日のタスクが空文字列
    const aggregatedReportWithEmptyYesterdayTask = {
      yesterdayTasks: '',
      todayTasks: '本日のタスク説明',
      issues: '課題の説明',
    };

    expect(() => {
      extractAndRankIssueKeywords(
        {
          teamId: 'team-001',
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-07T23:59:59Z'),
          minFrequencyThreshold: 1,
          requestUserId: 'user-001',
        },
        mockTextAnalysisServiceAdapter as any,
        aggregatedReportWithEmptyYesterdayTask
      );
    }).toThrow(/必須フィールド/);

    // Case 3: 今日のタスクがnull
    const aggregatedReportWithNullTodayTask = {
      yesterdayTasks: '昨日のタスク説明',
      todayTasks: null,
      issues: '課題の説明',
    };

    expect(() => {
      extractAndRankIssueKeywords(
        {
          teamId: 'team-001',
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-07T23:59:59Z'),
          minFrequencyThreshold: 1,
          requestUserId: 'user-001',
        },
        mockTextAnalysisServiceAdapter as any,
        aggregatedReportWithNullTodayTask
      );
    }).toThrow(/必須フィールド/);

    // Verify that TextAnalysisServiceAdapter was never called
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});