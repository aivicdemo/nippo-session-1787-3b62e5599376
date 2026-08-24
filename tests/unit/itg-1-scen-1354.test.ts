import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

// SCEN-1354: [edge] 優先度スコア色分け表示機能 - 中優先度課題がちょうど閾値（例：40点以上70点未満）で黄色に表示される
describe('prioritizeAndColorizeIssues', () => {
  test('should display issues at yellow threshold (40-69 points) correctly with medium priority color', () => {
    // Setup: 3つの課題を用意: 39点(低優先度)、40点(中優先度下限)、69点(中優先度上限)、70点(高優先度)
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-39',
        priorityScore: 39,
        keyword: 'Low priority issue',
        impactLevel: 'low',
      },
      {
        issueId: 'issue-40',
        priorityScore: 40,
        keyword: 'Medium priority issue at threshold',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-69',
        priorityScore: 69,
        keyword: 'Medium priority issue at upper bound',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-70',
        priorityScore: 70,
        keyword: 'High priority issue at threshold',
        impactLevel: 'high',
      },
    ];

    // 色分け閾値設定: 赤は70以上、黄は40以上70未満、緑は40未満
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: 'manager-001',
    };

    // Execute
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // Verify: 各課題が正しい色に分類されていることを確認
    expect(result.colorizedIssues).toHaveLength(4);

    // 39点の課題は緑色で表示
    const issue39 = result.colorizedIssues.find((i) => i.issueId === 'issue-39');
    expect(issue39).toBeDefined();
    expect(issue39?.highlightColor).toBe('green');

    // 40点の課題（下限値）は黄色で表示
    const issue40 = result.colorizedIssues.find((i) => i.issueId === 'issue-40');
    expect(issue40).toBeDefined();
    expect(issue40?.highlightColor).toBe('yellow');

    // 69点の課題（上限値の1点手前）は黄色で表示
    const issue69 = result.colorizedIssues.find((i) => i.issueId === 'issue-69');
    expect(issue69).toBeDefined();
    expect(issue69?.highlightColor).toBe('yellow');

    // 70点の課題（高優先度下限値）は赤色で表示
    const issue70 = result.colorizedIssues.find((i) => i.issueId === 'issue-70');
    expect(issue70).toBeDefined();
    expect(issue70?.highlightColor).toBe('red');

    // 色分布の検証: 赤1件、黄2件、緑1件
    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(2);
    expect(result.colorDistribution.green).toBe(1);

    // 処理実行日時が ISO 8601形式で記録されていること
    expect(result.processedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });
});