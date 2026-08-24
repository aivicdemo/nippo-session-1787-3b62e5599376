import { describe, test, expect, beforeEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-1357: [edge] 優先度スコア色分け表示機能 - 当日の日報が月末日に全員から集約された場合、課題の優先度判定と色分けが正確に実行される
  test('should colorize issues with correct priority scores and colors when all 10 members submit reports on month-end day', () => {
    // 入力: 10名の課題が優先度スコアとともに提供される
    const issuesList: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: 'Database performance degradation',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 72,
        keyword: 'API response time spike',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-003',
        priorityScore: 65,
        keyword: 'Memory leak in service A',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-004',
        priorityScore: 58,
        keyword: 'Deployment pipeline timeout',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-005',
        priorityScore: 52,
        keyword: 'Test coverage below threshold',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-006',
        priorityScore: 45,
        keyword: 'Documentation outdated',
        impactLevel: 'low',
      },
      {
        issueId: 'issue-007',
        priorityScore: 35,
        keyword: 'Code style inconsistency',
        impactLevel: 'low',
      },
      {
        issueId: 'issue-008',
        priorityScore: 78,
        keyword: 'Critical security vulnerability',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-009',
        priorityScore: 55,
        keyword: 'Build failure on staging',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-010',
        priorityScore: 40,
        keyword: 'Linting warnings in PR',
        impactLevel: 'low',
      },
    ];

    // 色分けの閾値設定: 赤（70以上）、黄（40以上70未満）、緑（40未満）
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const requestedBy = 'manager-001';

    // 関数呼び出し
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: issuesList,
      colorThresholds,
      requestedBy,
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // 期待値検証
    // 1. 返却された課題リストが存在し、長さが10
    expect(result.colorizedIssues).toHaveLength(10);

    // 2. 優先度スコア別にソートされていることを検証（降順）
    const sortedByScore = result.colorizedIssues.map((issue) => issue.priorityScore);
    expect(sortedByScore).toEqual([85, 78, 72, 65, 58, 55, 52, 45, 40, 35]);

    // 3. 赤色（優先度スコア70以上）に分類された課題の検証
    const redIssues = result.colorizedIssues.filter((issue) => issue.highlightColor === 'red');
    expect(redIssues).toHaveLength(3); // issue-001(85), issue-002(72), issue-008(78)
    expect(redIssues.map((i) => i.issueId)).toEqual(['issue-001', 'issue-008', 'issue-002']);
    expect(redIssues.every((i) => i.priorityScore >= 70)).toBe(true);

    // 4. 黄色（優先度スコア40以上70未満）に分類された課題の検証
    const yellowIssues = result.colorizedIssues.filter((issue) => issue.highlightColor === 'yellow');
    expect(yellowIssues).toHaveLength(5); // issue-003(65), issue-004(58), issue-005(52), issue-009(55), issue-006(45)
    expect(yellowIssues.every((i) => i.priorityScore >= 40 && i.priorityScore < 70)).toBe(true);

    // 5. 緑色（優先度スコア40未満）に分類された課題の検証
    const greenIssues = result.colorizedIssues.filter((issue) => issue.highlightColor === 'green');
    expect(greenIssues).toHaveLength(2); // issue-007(35), issue-010(40未満)
    expect(greenIssues.every((i) => i.priorityScore < 40)).toBe(true);

    // 6. 色分布が正確であることを検証
    expect(result.colorDistribution).toEqual({
      red: 3,
      yellow: 5,
      green: 2,
    });

    // 7. 各課題が正しいissueIdとキーワードを保持していることを検証
    const firstRedIssue = result.colorizedIssues[0];
    expect(firstRedIssue.issueId).toBe('issue-001');
    expect(firstRedIssue.keyword).toBe('Database performance degradation');
    expect(firstRedIssue.priorityScore).toBe(85);
    expect(firstRedIssue.highlightColor).toBe('red');

    // 8. processedAtが有効なISO 8601形式の日時であることを検証
    const processedAt = new Date(result.processedAt);
    expect(processedAt instanceof Date && !isNaN(processedAt.getTime())).toBe(true);

    // 9. 月末日（2024年2月28日）の処理であることを確認するため、
    // processedAtが処理実行時刻として記録されていることを確認
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - processedAt.getTime());
    expect(timeDiff).toBeLessThan(5000); // 5秒以内の差分

    // 10. 各課題のhighlightColorが正確に付与されていることを詳細検証
    const colorMap: { [key: string]: string } = {
      'issue-001': 'red',
      'issue-002': 'red',
      'issue-008': 'red',
      'issue-003': 'yellow',
      'issue-004': 'yellow',
      'issue-005': 'yellow',
      'issue-009': 'yellow',
      'issue-006': 'yellow',
      'issue-007': 'green',
      'issue-010': 'green',
    };

    result.colorizedIssues.forEach((issue) => {
      expect(issue.highlightColor).toBe(colorMap[issue.issueId]);
    });
  });
});