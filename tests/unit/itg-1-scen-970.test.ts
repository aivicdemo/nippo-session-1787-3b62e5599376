import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算機能', () => {
  // SCEN-970: [edge] 課題優先度スコア計算・色分け表示機能 - 課題一覧が優先度スコアの降順で並べられたとき順序が逆転していない
  test('複数課題の優先度スコアを計算し降順でソートしたとき順序が逆転していない', () => {
    // テストデータセット: 5件の課題
    const testIssues: IssuePriorityScoringInput[] = [
      {
        issueId: 'issue-A',
        issueContent: 'データベース接続エラーが発生している',
        occurrenceFrequency: 12,
        impactScore: 85,
        affectedTeamCount: 5,
        resolutionDaysAverage: 2,
        reportingDate: '2024-01-15T09:00:00Z',
        teamId: 'team-001'
      },
      {
        issueId: 'issue-B',
        issueContent: 'UI レイアウトズレの改善要望',
        occurrenceFrequency: 4,
        impactScore: 45,
        affectedTeamCount: 2,
        resolutionDaysAverage: 3,
        reportingDate: '2024-01-15T09:15:00Z',
        teamId: 'team-001'
      },
      {
        issueId: 'issue-C',
        issueContent: 'API レスポンス遅延が顧客に影響',
        occurrenceFrequency: 18,
        impactScore: 95,
        affectedTeamCount: 7,
        resolutionDaysAverage: 1,
        reportingDate: '2024-01-15T09:30:00Z',
        teamId: 'team-001'
      },
      {
        issueId: 'issue-D',
        issueContent: 'ログファイルサイズが増大している',
        occurrenceFrequency: 3,
        impactScore: 35,
        affectedTeamCount: 1,
        resolutionDaysAverage: 4,
        reportingDate: '2024-01-15T09:45:00Z',
        teamId: 'team-001'
      },
      {
        issueId: 'issue-E',
        issueContent: 'キャッシュの有効期限設定が不適切',
        occurrenceFrequency: 8,
        impactScore: 72,
        affectedTeamCount: 3,
        resolutionDaysAverage: 2,
        reportingDate: '2024-01-15T10:00:00Z',
        teamId: 'team-001'
      }
    ];

    // 各課題の優先度スコアを計算
    const calculatedScores: Array<{ issueId: string; priorityScore: number }> = [];

    testIssues.forEach((issue) => {
      const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(issue);
      calculatedScores.push({
        issueId: result.issueId,
        priorityScore: result.priorityScore
      });
    });

    // スコアの期待値を確認
    // 課題A: frequencyScore = min(12/20*40, 40) = 24, impactScore = min(85/100*40, 40) = 34, resolutionScore = (4-2)/4*20 = 10 => 24+34+10 = 68
    // 課題B: frequencyScore = min(4/20*40, 40) = 8, impactScore = min(45/100*40, 40) = 18, resolutionScore = (4-3)/4*20 = 5 => 8+18+5 = 31
    // 課題C: frequencyScore = min(18/20*40, 40) = 36, impactScore = min(95/100*40, 40) = 38, resolutionScore = (4-1)/4*20 = 15 => 36+38+15 = 89
    // 課題D: frequencyScore = min(3/20*40, 40) = 6, impactScore = min(35/100*40, 40) = 14, resolutionScore = (4-4)/4*20 = 0 => 6+14+0 = 20
    // 課題E: frequencyScore = min(8/20*40, 40) = 16, impactScore = min(72/100*40, 40) = 28.8, resolutionScore = (4-2)/4*20 = 10 => 16+28.8+10 = 54.8

    expect(calculatedScores.find((s) => s.issueId === 'issue-A')?.priorityScore).toBe(68);
    expect(calculatedScores.find((s) => s.issueId === 'issue-B')?.priorityScore).toBe(31);
    expect(calculatedScores.find((s) => s.issueId === 'issue-C')?.priorityScore).toBe(89);
    expect(calculatedScores.find((s) => s.issueId === 'issue-D')?.priorityScore).toBe(20);
    expect(calculatedScores.find((s) => s.issueId === 'issue-E')?.priorityScore).toBeCloseTo(54.8, 1);

    // 優先度スコアでソート（降順）
    const sortedByPriority = calculatedScores.sort(
      (a, b) => b.priorityScore - a.priorityScore
    );

    // 期待される順序: 課題C(89) > 課題A(68) > 課題E(54.8) > 課題B(31) > 課題D(20)
    expect(sortedByPriority[0].issueId).toBe('issue-C');
    expect(sortedByPriority[1].issueId).toBe('issue-A');
    expect(sortedByPriority[2].issueId).toBe('issue-E');
    expect(sortedByPriority[3].issueId).toBe('issue-B');
    expect(sortedByPriority[4].issueId).toBe('issue-D');

    // スコア値が降順であることを確認
    for (let i = 0; i < sortedByPriority.length - 1; i++) {
      expect(sortedByPriority[i].priorityScore).toBeGreaterThan(
        sortedByPriority[i + 1].priorityScore
      );
    }
  });
});