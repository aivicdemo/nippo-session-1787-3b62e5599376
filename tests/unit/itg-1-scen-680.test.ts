import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-680: [error] 課題優先度色分け表示機能 - 課題オブジェクト内に影響度スコアが欠落しているときマッピング処理がスキップされエラーになる
  test('should throw error when issue has missing impactScore', () => {
    const issueWithoutImpactScore: IssueSummary = {
      issueId: 'issue-001',
      priorityScore: 75,
      keyword: 'database_performance',
      impactLevel: 'high',
      // impactScore is intentionally undefined/missing
    } as any;

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [issueWithoutImpactScore],
      colorThresholds: colorThresholds,
      requestedBy: 'user-pm-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/impactScore/);
  });
});