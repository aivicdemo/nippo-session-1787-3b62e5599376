import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type IssueSummary, type ColorThresholdConfig, type ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Colorization', () => {
  // SCEN-703: [normal] 優先度別課題ハイライト表示機能 - 発生頻度が低く影響度スコアが閾値未満の課題は色分け表示されない
  test('should not apply highlight color to issues with low frequency and low impact score below threshold', () => {
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 25,
        keyword: 'database connection timeout',
        impactLevel: 'low'
      }
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40
    };

    const requestedBy = 'user-mgr-001';

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(
      issues,
      colorThresholds,
      requestedBy
    );

    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[0].highlightColor).toBe('none');
    expect(result.colorizedIssues[0].shouldHighlight).toBe(false);
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);
    expect(result.processedAt).toBeDefined();
  });
});