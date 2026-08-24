import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-2781: 複数課題の優先度スコアが昇順に整列される
  test('複数課題の優先度スコアが昇順に整列され、色分け表示ルールが正しく適用される', () => {
    const testCases: IssuePriorityScoringInput[] = [
      {
        issueId: 'issue-001',
        issueContent: 'DB接続エラーが頻発している',
        occurrenceFrequency: 12,
        impactScore: 85,
        affectedTeamCount: 3,
        resolutionDaysAverage: 2.5,
        reportingDate: '2024-01-15T09:00:00Z',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-002',
        issueContent: 'ログイン画面の不具合',
        occurrenceFrequency: 3,
        impactScore: 40,
        affectedTeamCount: 1,
        resolutionDaysAverage: 1.0,
        reportingDate: '2024-01-15T09:00:00Z',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-003',
        issueContent: 'パフォーマンス低下の問題',
        occurrenceFrequency: 8,
        impactScore: 65,
        affectedTeamCount: 2,
        resolutionDaysAverage: 3.0,
        reportingDate: '2024-01-15T09:00:00Z',
        teamId: 'team-001',
      },
    ];

    const results: IssuePriorityScoringOutput[] = testCases.map((testCase) =>
      calculateIssuePriorityScore(testCase)
    );

    // 優先度スコアが期待値と一致することを検証
    expect(results[0].priorityScore).toBe(75);
    expect(results[1].priorityScore).toBe(45);
    expect(results[2].priorityScore).toBe(60);

    // スコアの昇順に整列
    const sortedResults = [...results].sort((a, b) => a.priorityScore - b.priorityScore);

    // 整列後の順序が正しいことを検証（45 → 60 → 75）
    expect(sortedResults[0].priorityScore).toBe(45);
    expect(sortedResults[0].issueId).toBe('issue-002');
    expect(sortedResults[1].priorityScore).toBe(60);
    expect(sortedResults[1].issueId).toBe('issue-003');
    expect(sortedResults[2].priorityScore).toBe(75);
    expect(sortedResults[2].issueId).toBe('issue-001');

    // 色分け表示ルールが正しく適用されていることを検証
    // スコア45以下：#00FF00（緑）、46-70：#FFFF00（黄）、71以上：#FF0000（赤）
    expect(sortedResults[0].colorCode).toBe('#00FF00');
    expect(sortedResults[0].priorityRank).toBe('低');

    expect(sortedResults[1].colorCode).toBe('#FFFF00');
    expect(sortedResults[1].priorityRank).toBe('中');

    expect(sortedResults[2].colorCode).toBe('#FF0000');
    expect(sortedResults[2].priorityRank).toBe('高');

    // スコアの内訳が計算されていることを検証
    expect(sortedResults[0].scoreBreakdown).toBeDefined();
    expect(sortedResults[0].scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(sortedResults[0].scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(sortedResults[0].scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(sortedResults[0].scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(sortedResults[0].scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(sortedResults[0].scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // 計算実行日時が記録されていることを検証
    expect(sortedResults[0].calculatedAt).toBeDefined();
    const calculatedDate = new Date(sortedResults[0].calculatedAt);
    expect(calculatedDate).toBeInstanceOf(Date);
    expect(calculatedDate.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });
});