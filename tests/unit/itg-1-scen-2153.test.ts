import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-2153: [normal] ダッシュボード表示用の課題優先度ランキング生成機能 - 優先度スコアが高い課題から降順で表示用データが生成される
  test('should generate prioritized and colorized issue list in descending order by priority score', () => {
    // 準備：5件の課題データを準備
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-A',
        priorityScore: 75,
        keyword: '課題A',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-B',
        priorityScore: 92,
        keyword: '課題B',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-C',
        priorityScore: 45,
        keyword: '課題C',
        impactLevel: 'low',
      },
      {
        issueId: 'issue-D',
        priorityScore: 88,
        keyword: '課題D',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-E',
        priorityScore: 60,
        keyword: '課題E',
        impactLevel: 'medium',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: 'user-001',
    };

    // 実行
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // 検証：結果が降順で並んでいることを確認
    expect(result.colorizedIssues).toHaveLength(5);

    // 期待される優先順序：課題B（92）→課題D（88）→課題A（75）→課題E（60）→課題C（45）
    expect(result.colorizedIssues[0].issueId).toBe('issue-B');
    expect(result.colorizedIssues[0].keyword).toBe('課題B');
    expect(result.colorizedIssues[0].priorityScore).toBe(92);
    expect(result.colorizedIssues[0].highlightColor).toBe('red');

    expect(result.colorizedIssues[1].issueId).toBe('issue-D');
    expect(result.colorizedIssues[1].keyword).toBe('課題D');
    expect(result.colorizedIssues[1].priorityScore).toBe(88);
    expect(result.colorizedIssues[1].highlightColor).toBe('red');

    expect(result.colorizedIssues[2].issueId).toBe('issue-A');
    expect(result.colorizedIssues[2].keyword).toBe('課題A');
    expect(result.colorizedIssues[2].priorityScore).toBe(75);
    expect(result.colorizedIssues[2].highlightColor).toBe('red');

    expect(result.colorizedIssues[3].issueId).toBe('issue-E');
    expect(result.colorizedIssues[3].keyword).toBe('課題E');
    expect(result.colorizedIssues[3].priorityScore).toBe(60);
    expect(result.colorizedIssues[3].highlightColor).toBe('yellow');

    expect(result.colorizedIssues[4].issueId).toBe('issue-C');
    expect(result.colorizedIssues[4].keyword).toBe('課題C');
    expect(result.colorizedIssues[4].priorityScore).toBe(45);
    expect(result.colorizedIssues[4].highlightColor).toBe('yellow');

    // 色分け分布の検証
    expect(result.colorDistribution.red).toBe(3);
    expect(result.colorDistribution.yellow).toBe(2);
    expect(result.colorDistribution.green).toBe(0);

    // 処理実行日時が記録されていることを確認
    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate).toBeInstanceOf(Date);
    expect(processedDate.getTime()).toBeGreaterThan(0);
  });
});