import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('ダッシュボード色分け表示機能', () => {
  // SCEN-855
  test('優先度スコアデータが空の状態で色分け表示を実行したときエラーになる', () => {
    const emptyIssues: IssueSummary[] = [];
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };
    const requestedBy = 'user-001';

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: emptyIssues,
      colorThresholds,
      requestedBy,
    };

    expect(() => {
      prioritizeAndColorizeIssues(input);
    }).toThrow(/スコア検証エラー/);
  });
});