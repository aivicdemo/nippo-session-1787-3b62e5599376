import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Prioritization and Colorization - Dashboard Display', () => {
  // SCEN-1754: [edge] ダッシュボード色分け表示機能 - 優先度最高ランク（例：赤）の閾値がちょうどスコア 80 のとき色が切り替わる
  test('should colorize issue as red when priorityScore equals 80 (threshold boundary)', () => {
    const issueSummaries = [
      {
        issueId: 'issue-001',
        priorityScore: 80,
        keyword: 'システム障害',
        impactLevel: 'high',
      },
    ];

    const colorThresholds = {
      redThresholdMin: 80,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: issueSummaries,
      colorThresholds: colorThresholds,
      requestedBy: 'manager-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[0].keyword).toBe('システム障害');
    expect(result.colorizedIssues[0].priorityScore).toBe(80);
    expect(result.colorizedIssues[0].highlightColor).toBe('red');
    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);
    expect(result.processedAt).toBeDefined();
  });

  test('should colorize issue as yellow when priorityScore equals 79 (below red threshold)', () => {
    const issueSummaries = [
      {
        issueId: 'issue-001',
        priorityScore: 79,
        keyword: 'システム障害',
        impactLevel: 'high',
      },
    ];

    const colorThresholds = {
      redThresholdMin: 80,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: issueSummaries,
      colorThresholds: colorThresholds,
      requestedBy: 'manager-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[0].priorityScore).toBe(79);
    expect(result.colorizedIssues[0].highlightColor).toBe('yellow');
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(0);
  });

  test('should colorize issue as green when priorityScore equals 39 (below yellow threshold)', () => {
    const issueSummaries = [
      {
        issueId: 'issue-001',
        priorityScore: 39,
        keyword: 'システム障害',
        impactLevel: 'low',
      },
    ];

    const colorThresholds = {
      redThresholdMin: 80,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: issueSummaries,
      colorThresholds: colorThresholds,
      requestedBy: 'manager-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[0].priorityScore).toBe(39);
    expect(result.colorizedIssues[0].highlightColor).toBe('green');
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(1);
  });

  test('should transition from yellow to red when score changes from 79 to 80', () => {
    const issueSummaries = [
      {
        issueId: 'issue-001',
        priorityScore: 80,
        keyword: 'システム障害',
        impactLevel: 'high',
      },
    ];

    const colorThresholds = {
      redThresholdMin: 80,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: issueSummaries,
      colorThresholds: colorThresholds,
      requestedBy: 'manager-001',
    };

    const resultAtBoundary: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(resultAtBoundary.colorizedIssues[0].highlightColor).toBe('red');
    expect(resultAtBoundary.colorDistribution.red).toBe(1);

    const issueSummariesBelowBoundary = [
      {
        issueId: 'issue-001',
        priorityScore: 79,
        keyword: 'システム障害',
        impactLevel: 'high',
      },
    ];

    const inputBelowBoundary: PrioritizeAndColorizeIssuesInput = {
      issues: issueSummariesBelowBoundary,
      colorThresholds: colorThresholds,
      requestedBy: 'manager-001',
    };

    const resultBelowBoundary: ColorizedIssueList = prioritizeAndColorizeIssues(inputBelowBoundary);

    expect(resultBelowBoundary.colorizedIssues[0].highlightColor).toBe('yellow');
    expect(resultBelowBoundary.colorDistribution.yellow).toBe(1);
    expect(resultBelowBoundary.colorDistribution.red).toBe(0);
  });

  test('should handle multiple issues with mixed priority scores and correct color distribution', () => {
    const issueSummaries = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: '重大障害',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 80,
        keyword: 'システム遅延',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-003',
        priorityScore: 79,
        keyword: 'ネットワーク問題',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-004',
        priorityScore: 50,
        keyword: 'ログ出力エラー',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-005',
        priorityScore: 39,
        keyword: 'マイナー警告',
        impactLevel: 'low',
      },
    ];

    const colorThresholds = {
      redThresholdMin: 80,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: issueSummaries,
      colorThresholds: colorThresholds,
      requestedBy: 'manager-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(5);
    expect(result.colorizedIssues[0].highlightColor).toBe('red');
    expect(result.colorizedIssues[1].highlightColor).toBe('red');
    expect(result.colorizedIssues[2].highlightColor).toBe('yellow');
    expect(result.colorizedIssues[3].highlightColor).toBe('yellow');
    expect(result.colorizedIssues[4].highlightColor).toBe('green');

    expect(result.colorDistribution.red).toBe(2);
    expect(result.colorDistribution.yellow).toBe(2);
    expect(result.colorDistribution.green).toBe(1);
  });
});