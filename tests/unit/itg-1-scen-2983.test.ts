import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues - 優先度スコアが null のとき、色分け判定がエラーになる', () => {
  // SCEN-2983
  test('should throw TypeError when priorityScore is null during color assignment', () => {
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const issuesWithNullScore: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: null as any,
        keyword: 'database-connection',
        impactLevel: 'high',
      },
    ];

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: issuesWithNullScore,
      colorThresholds,
      requestedBy: 'user-director-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/priority|null/i);
  });
});