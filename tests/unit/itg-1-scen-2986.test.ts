import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示（色分け・ハイライト）する機能', () => {
  // SCEN-2986: [error] 課題ダッシュボード色分け表示機能 - 優先度スコアが 101 を超えるとき、色分け判定がエラーになる
  test('should throw error when priority score exceeds 100', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 101,
          keyword: 'performance-degradation',
          impactLevel: 'high'
        }
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40
      },
      requestedBy: 'manager-001'
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/Priority score/);
  });
});