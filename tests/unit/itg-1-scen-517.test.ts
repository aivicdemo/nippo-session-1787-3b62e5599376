import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('課題ダッシュボード表示機能 - 色分け・ハイライト処理', () => {
  // SCEN-517: [edge] 課題ダッシュボード表示機能 - 優先度スコアが最高値100で赤色ハイライトが適用される
  test('should apply red highlight color code when priority score is 100', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 100,
          keyword: '本番システム停止',
          impactLevel: 'high'
        }
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40
      },
      requestedBy: 'user-dept-manager-001'
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[0].priorityScore).toBe(100);
    expect(result.colorizedIssues[0].highlightColor).toBe('red');
    expect(result.colorizedIssues[0].shouldHighlight).toBe(true);
    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);
    expect(result.processedAt).toBeDefined();
  });
});