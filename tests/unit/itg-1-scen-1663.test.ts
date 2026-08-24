import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList, type IssueSummary, type ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('優先度色分け表示機能 - 高優先度課題の色分けが部長ダッシュボードで正しくハイライト表示される', () => {
  // SCEN-1663
  test('優先度スコアに基づいて課題を赤・黄・緑で色分けし、色分け前後の課題数を正確に追跡する', () => {
    // 準備: 優先度『高』に分類された課題3件、『中』2件、『低』5件を模擬データとして用意
    const highPriorityChallenges: IssueSummary[] = [
      {
        issueId: 'high-001',
        priorityScore: 85,
        keyword: 'システム障害',
        impactLevel: 'high',
      },
      {
        issueId: 'high-002',
        priorityScore: 92,
        keyword: 'セキュリティ脆弱性',
        impactLevel: 'high',
      },
      {
        issueId: 'high-003',
        priorityScore: 78,
        keyword: '本番環境クラッシュ',
        impactLevel: 'high',
      },
    ];

    const mediumPriorityChallenges: IssueSummary[] = [
      {
        issueId: 'medium-001',
        priorityScore: 55,
        keyword: 'パフォーマンス低下',
        impactLevel: 'medium',
      },
      {
        issueId: 'medium-002',
        priorityScore: 62,
        keyword: 'UI改善要望',
        impactLevel: 'medium',
      },
    ];

    const lowPriorityChallenges: IssueSummary[] = [
      {
        issueId: 'low-001',
        priorityScore: 25,
        keyword: 'ドキュメント更新',
        impactLevel: 'low',
      },
      {
        issueId: 'low-002',
        priorityScore: 32,
        keyword: 'テスト環境セットアップ',
        impactLevel: 'low',
      },
      {
        issueId: 'low-003',
        priorityScore: 18,
        keyword: '開発環境最適化',
        impactLevel: 'low',
      },
      {
        issueId: 'low-004',
        priorityScore: 28,
        keyword: 'コード品質チェック',
        impactLevel: 'low',
      },
      {
        issueId: 'low-005',
        priorityScore: 35,
        keyword: 'ログ出力改善',
        impactLevel: 'low',
      },
    ];

    const allChallenges = [
      ...highPriorityChallenges,
      ...mediumPriorityChallenges,
      ...lowPriorityChallenges,
    ];

    // 色分け閾値を定義: 赤色(70以上)、黄色(40以上70未満)、緑色(40未満)
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    // 入力データを構築
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: allChallenges,
      colorThresholds: colorThresholds,
      requestedBy: 'manager-001',
    };

    // 関数を実行
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // 期待値: 色分けが正しく適用され、各色の課題数が正確であること
    // 赤色(スコア70以上): 3件(85, 92, 78)
    // 黄色(スコア40以上70未満): 2件(55, 62)
    // 緑色(スコア40未満): 5件(25, 32, 18, 28, 35)
    expect(result.colorDistribution.red).toBe(3);
    expect(result.colorDistribution.yellow).toBe(2);
    expect(result.colorDistribution.green).toBe(5);

    // 色分けが適用された課題の合計数を検証
    expect(result.colorizedIssues.length).toBe(10);

    // 赤色課題の検証
    const redIssues = result.colorizedIssues.filter(
      (issue) => issue.highlightColor === 'red'
    );
    expect(redIssues.length).toBe(3);
    expect(redIssues.map((i) => i.issueId)).toEqual([
      'high-001',
      'high-002',
      'high-003',
    ]);
    redIssues.forEach((issue) => {
      expect(issue.priorityScore).toBeGreaterThanOrEqual(70);
      expect(issue.highlightColor).toBe('red');
    });

    // 黄色課題の検証
    const yellowIssues = result.colorizedIssues.filter(
      (issue) => issue.highlightColor === 'yellow'
    );
    expect(yellowIssues.length).toBe(2);
    expect(yellowIssues.map((i) => i.issueId)).toEqual([
      'medium-001',
      'medium-002',
    ]);
    yellowIssues.forEach((issue) => {
      expect(issue.priorityScore).toBeGreaterThanOrEqual(40);
      expect(issue.priorityScore).toBeLessThan(70);
      expect(issue.highlightColor).toBe('yellow');
    });

    // 緑色課題の検証
    const greenIssues = result.colorizedIssues.filter(
      (issue) => issue.highlightColor === 'green'
    );
    expect(greenIssues.length).toBe(5);
    expect(greenIssues.map((i) => i.issueId)).toEqual([
      'low-001',
      'low-002',
      'low-003',
      'low-004',
      'low-005',
    ]);
    greenIssues.forEach((issue) => {
      expect(issue.priorityScore).toBeLessThan(40);
      expect(issue.highlightColor).toBe('green');
    });

    // 処理実行日時が記録されていることを検証
    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate.getTime()).toBeGreaterThan(0);

    // 高優先度課題がダッシュボード上で視覚的に識別可能であることを確認
    // すべての高優先度課題が赤色でハイライトされているか
    const allHighPriorityColoredAsRed = highPriorityChallenges.every((challenge) => {
      const colored = result.colorizedIssues.find(
        (c) => c.issueId === challenge.issueId
      );
      return colored && colored.highlightColor === 'red';
    });
    expect(allHighPriorityColoredAsRed).toBe(true);

    // 中・低優先度課題が赤色ではないことを確認
    const mediumAndLowNotRed = [
      ...mediumPriorityChallenges,
      ...lowPriorityChallenges,
    ].every((challenge) => {
      const colored = result.colorizedIssues.find(
        (c) => c.issueId === challenge.issueId
      );
      return colored && colored.highlightColor !== 'red';
    });
    expect(mediumAndLowNotRed).toBe(true);

    // 色分けの一貫性を検証: 同じ優先度スコアの課題は同じ色になること
    const issue1 = result.colorizedIssues.find((i) => i.issueId === 'high-001'); // スコア85
    const issue2 = result.colorizedIssues.find((i) => i.issueId === 'high-002'); // スコア92
    const issue3 = result.colorizedIssues.find((i) => i.issueId === 'high-003'); // スコア78
    expect(issue1?.highlightColor).toBe(issue2?.highlightColor);
    expect(issue2?.highlightColor).toBe(issue3?.highlightColor);
  });
});