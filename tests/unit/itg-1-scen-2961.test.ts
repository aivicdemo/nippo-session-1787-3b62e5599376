import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues - ダッシュボード色分け表示機能', () => {
  // SCEN-2961: [normal] ダッシュボード色分け表示機能 - 複数の課題が優先度スコアの高い順に並び替えられる
  test('should sort issues by priority score in descending order and apply color coding', () => {
    // テストデータ: 異なる優先度スコアを持つ複数の課題オブジェクト
    const issueSummaries: IssueSummary[] = [
      {
        issueId: 'issue-a',
        priorityScore: 75,
        keyword: '課題A',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-b',
        priorityScore: 90,
        keyword: '課題B',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-c',
        priorityScore: 60,
        keyword: '課題C',
        impactLevel: 'low',
      },
      {
        issueId: 'issue-d',
        priorityScore: 85,
        keyword: '課題D',
        impactLevel: 'high',
      },
    ];

    // 色分けの閾値設定: 赤（75以上）、黄（50以上75未満）、緑（50未満）
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 75,
      yellowThresholdMin: 50,
    };

    // 入力データ
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: issueSummaries,
      colorThresholds: colorThresholds,
      requestedBy: 'user-001',
    };

    // 関数を実行
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // 検証1: 返却データ構造の確認
    expect(result).toHaveProperty('colorizedIssues');
    expect(result).toHaveProperty('colorDistribution');
    expect(result).toHaveProperty('processedAt');
    expect(Array.isArray(result.colorizedIssues)).toBe(true);

    // 検証2: 優先度スコアの降順ソート確認
    // 期待順序: 課題B（90） → 課題D（85） → 課題A（75） → 課題C（60）
    expect(result.colorizedIssues[0].issueId).toBe('issue-b');
    expect(result.colorizedIssues[0].priorityScore).toBe(90);
    expect(result.colorizedIssues[1].issueId).toBe('issue-d');
    expect(result.colorizedIssues[1].priorityScore).toBe(85);
    expect(result.colorizedIssues[2].issueId).toBe('issue-a');
    expect(result.colorizedIssues[2].priorityScore).toBe(75);
    expect(result.colorizedIssues[3].issueId).toBe('issue-c');
    expect(result.colorizedIssues[3].priorityScore).toBe(60);

    // 検証3: 色分け適用の確認
    // 課題B（90）と課題D（85）と課題A（75）は赤（スコア75以上）
    expect(result.colorizedIssues[0].highlightColor).toBe('red');
    expect(result.colorizedIssues[1].highlightColor).toBe('red');
    expect(result.colorizedIssues[2].highlightColor).toBe('red');
    // 課題C（60）は黄（スコア50以上75未満）
    expect(result.colorizedIssues[3].highlightColor).toBe('yellow');

    // 検証4: colorDistribution の確認
    // 赤: 3件（課題B、D、A）、黄: 1件（課題C）、緑: 0件
    expect(result.colorDistribution.red).toBe(3);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(0);

    // 検証5: processedAt がISO 8601形式であることを確認
    expect(typeof result.processedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.processedAt)).toBe(true);
  });
});