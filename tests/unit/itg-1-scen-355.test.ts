import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';
import type { IssuePriorityScoringInput, IssuePriorityScore } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  // SCEN-355
  test('過去7日間の発生頻度データが不完全なとき、優先度スコアを計算して警告を出力する', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      frequency: 45,
      impactScore: 70,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    const result: IssuePriorityScore = calculatePriorityScoreForIssue(input);

    const expectedPriorityScore = Math.round((45 * 0.4) + (70 * 0.6));

    expect(result.issueId).toBe('ISSUE-001');
    expect(typeof result.priorityScore).toBe('number');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityScore).toBe(expectedPriorityScore);

    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result.priorityRank);
    expect(['RED', 'YELLOW', 'GREEN']).toContain(result.colorCode);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/過去データが不足しているため、トレンド反映の精度が低下しています/)
    );

    consoleWarnSpy.mockRestore();
  });
});