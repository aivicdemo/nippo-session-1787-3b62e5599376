import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues - ダッシュボード表示用の課題優先度ランキング生成機能', () => {
  // SCEN-2154
  test('影響度レベル（高・中・低）に応じて色分けコードが正確に付与される', () => {
    const testInput: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 85,
          keyword: '高優先度課題',
          impactLevel: 'high'
        },
        {
          issueId: 'issue-002',
          priorityScore: 55,
          keyword: '中優先度課題',
          impactLevel: 'medium'
        },
        {
          issueId: 'issue-003',
          priorityScore: 25,
          keyword: '低優先度課題',
          impactLevel: 'low'
        }
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40
      },
      requestedBy: 'user-001'
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(testInput);

    expect(result.colorizedIssues).toHaveLength(3);

    const highImpactIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-001'
    );
    expect(highImpactIssue).toBeDefined();
    expect(highImpactIssue?.highlightColor).toBe('red');
    expect(highImpactIssue?.shouldHighlight).toBe(true);

    const mediumImpactIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-002'
    );
    expect(mediumImpactIssue).toBeDefined();
    expect(mediumImpactIssue?.highlightColor).toBe('yellow');
    expect(mediumImpactIssue?.shouldHighlight).toBe(true);

    const lowImpactIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-003'
    );
    expect(lowImpactIssue).toBeDefined();
    expect(lowImpactIssue?.highlightColor).toBe('green');
    expect(lowImpactIssue?.shouldHighlight).toBe(false);

    expect(result.colorDistribution).toEqual({
      red: 1,
      yellow: 1,
      green: 1
    });

    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate.getTime()).toBeGreaterThan(0);
  });
});