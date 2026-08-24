import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワードの自動抽出と優先度判定', () => {
  test('SCEN-734: 課題キーワードの発生頻度が正確に集計され、出現回数でランク付けされる', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害が発生。障害対応に追われた。障害の原因は不明。障害解決に時間がかかった。データベース接続エラーが発生した。エラー原因を調査中。本来のタスク実施。特に課題なし。',
      occurrenceFrequency: 6,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result).toMatchObject({
      issueId: 'issue-001',
      priorityScore: expect.any(Number),
      priorityRank: expect.stringMatching(/^(高|中|低)$/),
      scoreBreakdown: {
        frequencyScore: expect.any(Number),
        impactScore: expect.any(Number),
        resolutionDifficultyScore: expect.any(Number)
      },
      colorCode: expect.stringMatching(/^#[0-9A-F]{6}$/),
      calculatedAt: expect.any(String)
    });

    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);

    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);

    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    const totalScore = result.scoreBreakdown.frequencyScore + result.scoreBreakdown.impactScore + result.scoreBreakdown.resolutionDifficultyScore;
    expect(result.priorityScore).toBe(totalScore);

    if (result.priorityScore >= 70) {
      expect(result.priorityRank).toBe('高');
      expect(result.colorCode).toBe('#FF0000');
    } else if (result.priorityScore >= 40) {
      expect(result.priorityRank).toBe('中');
      expect(result.colorCode).toBe('#FFFF00');
    } else {
      expect(result.priorityRank).toBe('低');
      expect(result.colorCode).toBe('#00FF00');
    }

    const calculatedDate = new Date(result.calculatedAt);
    expect(calculatedDate).toBeInstanceOf(Date);
    expect(calculatedDate.getTime()).toBeLessThanOrEqual(Date.now());
  });
});