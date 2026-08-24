import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues - Issue highlighting and colorization', () => {
  // SCEN-698: [normal] 優先度別課題ハイライト表示機能 - 課題が 0 件の場合、空のハイライト表示リストが返却される
  test('should return empty colorized issue list when input issues array is empty', () => {
    // Arrange: 課題件数 0 件の入力データを準備
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-001',
    };

    // Act: 優先度別課題ハイライト表示機能を呼び出す
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // Assert: 戻り値は空のハイライト表示リストが返却される
    expect(result.colorizedIssues).toEqual([]);
    expect(result.colorizedIssues.length).toBe(0);
    expect(result.highlightCount).toBe(0);
    expect(result.colorDistribution).toEqual({
      red: 0,
      yellow: 0,
      green: 0,
    });
    expect(result.processedAt).toBeDefined();
    expect(typeof result.processedAt).toBe('string');
  });
});