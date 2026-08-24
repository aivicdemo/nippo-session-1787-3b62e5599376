import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorThresholdConfig,
  IssueSummary,
  ColorizedIssueList,
} from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Dashboard Colorization', () => {
  // SCEN-1098: 複数課題が同一最高スコアで表示される場合、すべてが同じハイライト色で表示される
  test('複数の課題が同一最高スコア75で表示され、すべてが同じハイライト色で表示される', () => {
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 75,
        keyword: 'システム障害',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 75,
        keyword: '納期遅延',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-003',
        priorityScore: 75,
        keyword: '品質問題',
        impactLevel: 'high',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: 'manager-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // すべての課題が処理されたことを確認
    expect(result.colorizedIssues).toHaveLength(3);

    // すべての課題が同一スコア75であることを確認
    expect(result.colorizedIssues[0].priorityScore).toBe(75);
    expect(result.colorizedIssues[1].priorityScore).toBe(75);
    expect(result.colorizedIssues[2].priorityScore).toBe(75);

    // すべての課題が赤色（red）でカラリングされていることを確認
    // スコア75はredThresholdMin(70)以上なので赤色
    expect(result.colorizedIssues[0].highlightColor).toBe('red');
    expect(result.colorizedIssues[1].highlightColor).toBe('red');
    expect(result.colorizedIssues[2].highlightColor).toBe('red');

    // すべての課題がハイライト対象であることを確認
    expect(result.colorizedIssues[0].shouldHighlight).toBe(true);
    expect(result.colorizedIssues[1].shouldHighlight).toBe(true);
    expect(result.colorizedIssues[2].shouldHighlight).toBe(true);

    // カラーコードが同一であることを確認
    // スコア75に対応するカラーコードは #FF6B35 (赤系)
    expect(result.colorizedIssues[0].colorCode).toBe('#FF6B35');
    expect(result.colorizedIssues[1].colorCode).toBe('#FF6B35');
    expect(result.colorizedIssues[2].colorCode).toBe('#FF6B35');

    // カラーコードが統一されていることを確認
    const firstColorCode = result.colorizedIssues[0].colorCode;
    expect(result.colorizedIssues[1].colorCode).toBe(firstColorCode);
    expect(result.colorizedIssues[2].colorCode).toBe(firstColorCode);

    // カラー分布を確認
    expect(result.colorDistribution.red).toBe(3);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);

    // processedAtが設定されていることを確認
    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate.getTime()).toBeGreaterThan(0);
  });
});