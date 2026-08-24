import { describe, it, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization: prioritizeAndColorizeIssues', () => {
  // SCEN-677: [error] 課題優先度色分け表示機能 - 優先度スコアが数値でなく文字列のとき型チェックエラーになる
  it('should return error when priorityScore is a string instead of number', () => {
    const invalidInput: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 'high' as unknown as number,
          keyword: 'database_connection',
          impactLevel: 'high'
        }
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40
      },
      requestedBy: 'user-dept-head-001'
    };

    const result = prioritizeAndColorizeIssues(invalidInput);

    expect(result).toHaveProperty('error');
    expect(result.error).toMatch(/優先度スコアは数値である必要があります/);
    expect(result).not.toHaveProperty('colorizedIssues');
    expect(result).not.toHaveProperty('colorDistribution');
    expect(result).not.toHaveProperty('processedAt');
  });
});