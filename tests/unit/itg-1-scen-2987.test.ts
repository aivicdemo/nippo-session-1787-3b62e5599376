import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示（色分け・ハイライト）する機能', () => {
  // SCEN-2987
  test('課題オブジェクトが null のとき、色分け表示ロジックはエラーを発生させるか防御的に処理する', () => {
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: null as any,
      colorThresholds: colorThresholds,
      requestedBy: 'user-001',
    };

    expect(() => {
      prioritizeAndColorizeIssues(input);
    }).toThrow(/課題|Issues|null/);
  });
});