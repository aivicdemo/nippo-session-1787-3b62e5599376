import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues - yellow color threshold test', () => {
  test('SCEN-653: issues with priority score 50-79 are displayed in yellow', () => {
    // Arrange: テスト用の課題データを準備
    const issueScoreBelow: PrioritizeAndColorizeIssuesInput['issues'][0] = {
      issueId: 'issue-below-49',
      priorityScore: 49,
      keyword: 'boundary-below',
      impactLevel: 'low'
    };

    const issueScoreAtLowerBound: PrioritizeAndColorizeIssuesInput['issues'][0] = {
      issueId: 'issue-50',
      priorityScore: 50,
      keyword: 'test-keyword-50',
      impactLevel: 'medium'
    };

    const issueScoreMiddle: PrioritizeAndColorizeIssuesInput['issues'][0] = {
      issueId: 'issue-79',
      priorityScore: 79,
      keyword: 'test-keyword-79',
      impactLevel: 'medium'
    };

    const issueScoreAtUpperBound: PrioritizeAndColorizeIssuesInput['issues'][0] = {
      issueId: 'issue-80',
      priorityScore: 80,
      keyword: 'boundary-above',
      impactLevel: 'high'
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [issueScoreBelow, issueScoreAtLowerBound, issueScoreMiddle, issueScoreAtUpperBound],
      colorThresholds: {
        redThresholdMin: 80,
        yellowThresholdMin: 50
      },
      requestedBy: 'manager-001'
    };

    // Act: 優先度色分け表示機能を実行
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // Assert: 結果を検証
    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(4);
    expect(result.processedAt).toBeDefined();

    // スコア49の課題は黄色以外（赤または緑）で表示される
    const colorizedBelow = result.colorizedIssues.find(issue => issue.issueId === 'issue-below-49');
    expect(colorizedBelow).toBeDefined();
    expect(colorizedBelow?.highlightColor).not.toBe('yellow');
    expect(['red', 'green', 'none']).toContain(colorizedBelow?.highlightColor);

    // スコア50の課題は黄色で表示される
    const colorizedAtLower = result.colorizedIssues.find(issue => issue.issueId === 'issue-50');
    expect(colorizedAtLower).toBeDefined();
    expect(colorizedAtLower?.highlightColor).toBe('yellow');

    // スコア79の課題は黄色で表示される
    const colorizedMiddle = result.colorizedIssues.find(issue => issue.issueId === 'issue-79');
    expect(colorizedMiddle).toBeDefined();
    expect(colorizedMiddle?.highlightColor).toBe('yellow');

    // スコア80の課題は黄色以外（赤）で表示される
    const colorizedAtUpper = result.colorizedIssues.find(issue => issue.issueId === 'issue-80');
    expect(colorizedAtUpper).toBeDefined();
    expect(colorizedAtUpper?.highlightColor).not.toBe('yellow');
    expect(['red', 'green', 'none']).toContain(colorizedAtUpper?.highlightColor);

    // 色分け統計を検証
    expect(result.colorDistribution).toBeDefined();
    expect(typeof result.colorDistribution.red).toBe('number');
    expect(typeof result.colorDistribution.yellow).toBe('number');
    expect(typeof result.colorDistribution.green).toBe('number');
    expect(result.colorDistribution.yellow).toBeGreaterThanOrEqual(2);
  });
});