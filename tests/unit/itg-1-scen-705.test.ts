import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  // SCEN-705
  test('課題リストが空配列のとき処理がエラーになる', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-001',
    };

    expect(() => {
      prioritizeAndColorizeIssues(input);
    }).toThrow(/課題リスト/);
  });
});