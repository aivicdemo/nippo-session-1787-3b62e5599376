import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度色分け機能', () => {
  // SCEN-690: [edge] 課題優先度色分け機能 - 優先度スコアが小数点を含む場合（例：75.5 点）正しく色分けされる
  test('優先度スコアが小数点を含む場合に正しい色分けが適用される', () => {
    const issue_with_decimal_score: IssueSummary = {
      issueId: 'issue-001',
      priorityScore: 75.5,
      keyword: 'デバッグ手順の統一',
      impactLevel: 'medium',
    };

    const color_threshold_config: ColorThresholdConfig = {
      redThresholdMin: 80,
      yellowThresholdMin: 60,
    };

    const prioritize_input: PrioritizeAndColorizeIssuesInput = {
      issues: [issue_with_decimal_score],
      colorThresholds: color_threshold_config,
      requestedBy: 'user-12345',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(prioritize_input);

    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[0].priorityScore).toBe(75.5);
    expect(result.colorizedIssues[0].highlightColor).toBe('yellow');
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(0);
    expect(result.processedAt).toBeDefined();
  });
});