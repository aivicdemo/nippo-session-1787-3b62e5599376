import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('優先度スコア色分け表示機能', () => {
  // SCEN-1358: [edge] 優先度スコア色分け表示機能 - 当日の日報が月初日に全員から集約された場合、課題の優先度判定と色分けが正確に実行される
  test('月初日に全員から集約された日報から抽出された課題が正確に色分け表示される', () => {
    // Setup: 月初日のデータセット（1日）を構成
    const monthFirstDate = '2024-01-01T00:00:00Z';
    const teamId = 'team-alpha-001';
    const requestedBy = 'director-001';

    // 部員10名の日報から抽出された課題データを構成
    // 各課題にはassessImpactScoreで算出されたスコア（0-100）を含める
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 92, // 高優先度（赤色対象）
        keyword: 'データベース接続エラー',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 88, // 高優先度（赤色対象）
        keyword: 'API応答遅延',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-003',
        priorityScore: 75, // 高優先度（赤色対象）
        keyword: '設計変更による調整',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-004',
        priorityScore: 48, // 中優先度（黄色対象）
        keyword: 'ドキュメント更新遅延',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-005',
        priorityScore: 52, // 中優先度（黄色対象）
        keyword: 'テスト環境セットアップ問題',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-006',
        priorityScore: 38, // 中優先度（黄色対象）
        keyword: 'レビュー指摘事項確認',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-007',
        priorityScore: 25, // 低優先度（緑色対象）
        keyword: 'コード整形ツール導入検討',
        impactLevel: 'low',
      },
      {
        issueId: 'issue-008',
        priorityScore: 18, // 低優先度（緑色対象）
        keyword: '定期メンテナンス予定確認',
        impactLevel: 'low',
      },
      {
        issueId: 'issue-009',
        priorityScore: 12, // 低優先度（緑色対象）
        keyword: '情報共有ツール使い方確認',
        impactLevel: 'low',
      },
      {
        issueId: 'issue-010',
        priorityScore: 66, // 高優先度境界値（赤色対象）
        keyword: 'セキュリティパッチ適用',
        impactLevel: 'high',
      },
    ];

    // 色分け設定：赤色66以上、黄色33以上66未満、緑色33未満
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 66,
      yellowThresholdMin: 33,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy,
    };

    // 関数を実行
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // 期待値の検証：基本構造
    expect(result).toHaveProperty('colorizedIssues');
    expect(result).toHaveProperty('colorDistribution');
    expect(result).toHaveProperty('processedAt');
    expect(Array.isArray(result.colorizedIssues)).toBe(true);

    // 色分けされた課題一覧の検証
    const colorizedIssues = result.colorizedIssues;
    expect(colorizedIssues).toHaveLength(10);

    // 赤色対象（スコア66以上）：issue-001, issue-002, issue-003, issue-010
    const redIssues = colorizedIssues.filter((ci) => ci.highlightColor === 'red');
    expect(redIssues).toHaveLength(4);
    expect(redIssues.map((ci) => ci.issueId).sort()).toEqual([
      'issue-001',
      'issue-002',
      'issue-003',
      'issue-010',
    ]);
    redIssues.forEach((ci) => {
      expect(ci.shouldHighlight).toBe(true);
    });

    // 黄色対象（スコア33-65）：issue-004, issue-005, issue-006
    const yellowIssues = colorizedIssues.filter(
      (ci) => ci.highlightColor === 'yellow'
    );
    expect(yellowIssues).toHaveLength(3);
    expect(yellowIssues.map((ci) => ci.issueId).sort()).toEqual([
      'issue-004',
      'issue-005',
      'issue-006',
    ]);
    yellowIssues.forEach((ci) => {
      expect(ci.shouldHighlight).toBe(true);
    });

    // 緑色対象（スコア0-32）：issue-007, issue-008, issue-009
    const greenIssues = colorizedIssues.filter(
      (ci) => ci.highlightColor === 'green'
    );
    expect(greenIssues).toHaveLength(3);
    expect(greenIssues.map((ci) => ci.issueId).sort()).toEqual([
      'issue-007',
      'issue-008',
      'issue-009',
    ]);
    greenIssues.forEach((ci) => {
      expect(ci.shouldHighlight).toBe(true);
    });

    // 色分布の検証：各色の課題件数
    expect(result.colorDistribution.red).toBe(4);
    expect(result.colorDistribution.yellow).toBe(3);
    expect(result.colorDistribution.green).toBe(3);

    // processedAtが有効なISO 8601形式の日時であることを確認
    const processedAtDate = new Date(result.processedAt);
    expect(processedAtDate instanceof Date).toBe(true);
    expect(processedAtDate.getTime()).toBeGreaterThan(0);

    // 同一課題キーワードが複数回出現した場合、最高スコアで統一される確認
    // ここでは、各issueIdが一意であることを検証
    const issueIds = result.colorizedIssues.map((ci) => ci.issueId);
    expect(new Set(issueIds).size).toBe(issueIds.length);

    // 各課題が正しいスコア範囲に色分けされていることの最終確認
    result.colorizedIssues.forEach((colorizedIssue) => {
      const originalIssue = issues.find((i) => i.issueId === colorizedIssue.issueId);
      expect(originalIssue).toBeDefined();

      if (originalIssue && originalIssue.priorityScore >= 66) {
        expect(colorizedIssue.highlightColor).toBe('red');
      } else if (originalIssue && originalIssue.priorityScore >= 33) {
        expect(colorizedIssue.highlightColor).toBe('yellow');
      } else if (originalIssue) {
        expect(colorizedIssue.highlightColor).toBe('green');
      }
    });
  });
});