import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-657: [normal] 課題優先度色分け表示機能 - 課題が複数件の場合、各課題のスコアに応じた色が個別に正しく適用される
  test('should apply individual colors to each issue based on its own priority score', () => {
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 75,
        keyword: 'データベース接続エラー',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-002',
        priorityScore: 45,
        keyword: 'ログファイル出力遅延',
        impactLevel: 'low',
      },
      {
        issueId: 'issue-003',
        priorityScore: 90,
        keyword: '本番環境ダウン',
        impactLevel: 'high',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 80,
      yellowThresholdMin: 50,
    };

    const requestedBy = 'user-manager-001';

    const result: ColorizedIssueList = prioritizeAndColorizeIssues({
      issues,
      colorThresholds,
      requestedBy,
    });

    // Verify structure
    expect(result).toHaveProperty('colorizedIssues');
    expect(result).toHaveProperty('colorDistribution');
    expect(result).toHaveProperty('processedAt');

    // Verify colorizedIssues array
    expect(result.colorizedIssues).toHaveLength(3);

    // Verify issue-001: score 75 should be yellow (>= 50 and < 80)
    const colorizedIssue1 = result.colorizedIssues.find(
      (ci) => ci.issueId === 'issue-001'
    );
    expect(colorizedIssue1).toBeDefined();
    expect(colorizedIssue1?.highlightColor).toBe('yellow');
    expect(colorizedIssue1?.issueId).toBe('issue-001');

    // Verify issue-002: score 45 should be green (< 50)
    const colorizedIssue2 = result.colorizedIssues.find(
      (ci) => ci.issueId === 'issue-002'
    );
    expect(colorizedIssue2).toBeDefined();
    expect(colorizedIssue2?.highlightColor).toBe('green');
    expect(colorizedIssue2?.issueId).toBe('issue-002');

    // Verify issue-003: score 90 should be red (>= 80)
    const colorizedIssue3 = result.colorizedIssues.find(
      (ci) => ci.issueId === 'issue-003'
    );
    expect(colorizedIssue3).toBeDefined();
    expect(colorizedIssue3?.highlightColor).toBe('red');
    expect(colorizedIssue3?.issueId).toBe('issue-003');

    // Verify color distribution
    // Expected: 1 red (score 90), 1 yellow (score 75), 1 green (score 45)
    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(1);

    // Verify processedAt is ISO 8601 format
    expect(result.processedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // Verify individual colors are independently applied
    const colors = result.colorizedIssues.map((ci) => ci.highlightColor);
    expect(colors).toContain('red');
    expect(colors).toContain('yellow');
    expect(colors).toContain('green');
    // Verify each issue has exactly one color and no duplicates of the same color for different score ranges
    expect(new Set(colors).size).toBe(3);
  });
});