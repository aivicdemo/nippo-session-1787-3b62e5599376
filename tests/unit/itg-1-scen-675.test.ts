import { describe, it, expect, beforeEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues - Color Threshold Validation', () => {
  // SCEN-675: [error] 課題優先度色分け表示機能 - 黄色のしきい値が負の数のとき色分けルールが不正でエラーになる
  it('should throw validation error when yellow threshold is negative', () => {
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 75,
        keyword: 'サーバーダウン',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 45,
        keyword: 'パフォーマンス低下',
        impactLevel: 'medium',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: -5,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: 'manager-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/黄色のしきい値/);
  });
});