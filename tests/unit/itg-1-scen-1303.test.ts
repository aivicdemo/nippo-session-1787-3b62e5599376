import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-1303: [normal] 課題影響度判定機能 - 影響度スコアが複数件の課題から全件が判定される
  test('複数件の課題から全件の影響度スコア判定が完了し、優先度スコアが算出される', () => {
    const mockTextAnalysisAdapter = {
      assessImpactScore: jest.fn(),
    };

    mockTextAnalysisAdapter.assessImpactScore
      .mockResolvedValueOnce(85)
      .mockResolvedValueOnce(60)
      .mockResolvedValueOnce(45);

    const issueA: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'サーバーダウン',
      occurrenceFrequency: 3,
      impactScore: 85,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-alpha',
    };

    const issueB: IssuePriorityScoringInput = {
      issueId: 'issue-002',
      issueContent: '納期遅延',
      occurrenceFrequency: 2,
      impactScore: 60,
      affectedTeamCount: 3,
      resolutionDaysAverage: 4,
      reportingDate: '2024-01-15',
      teamId: 'team-alpha',
    };

    const issueC: IssuePriorityScoringInput = {
      issueId: 'issue-003',
      issueContent: '品質問題',
      occurrenceFrequency: 1,
      impactScore: 45,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-alpha',
    };

    const resultA = calculateIssuePriorityScore(issueA);
    const resultB = calculateIssuePriorityScore(issueB);
    const resultC = calculateIssuePriorityScore(issueC);

    expect(resultA).toBeDefined();
    expect(resultB).toBeDefined();
    expect(resultC).toBeDefined();

    expect(resultA.issueId).toBe('issue-001');
    expect(resultB.issueId).toBe('issue-002');
    expect(resultC.issueId).toBe('issue-003');

    expect(resultA.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultA.priorityScore).toBeLessThanOrEqual(100);
    expect(resultB.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultB.priorityScore).toBeLessThanOrEqual(100);
    expect(resultC.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultC.priorityScore).toBeLessThanOrEqual(100);

    expect(resultA.priorityRank).toMatch(/高|中|低/);
    expect(resultB.priorityRank).toMatch(/高|中|低/);
    expect(resultC.priorityRank).toMatch(/高|中|低/);

    expect(resultA.scoreBreakdown).toBeDefined();
    expect(resultA.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(resultA.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(resultA.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(resultA.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(resultA.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(resultA.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    expect(resultB.scoreBreakdown).toBeDefined();
    expect(resultB.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(resultB.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(resultB.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(resultB.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(resultB.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(resultB.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    expect(resultC.scoreBreakdown).toBeDefined();
    expect(resultC.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(resultC.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(resultC.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(resultC.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(resultC.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(resultC.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    expect(resultA.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
    expect(resultB.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
    expect(resultC.colorCode).toMatch(/^#[0-9A-F]{6}$/i);

    expect(resultA.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(resultB.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(resultC.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    const frequencyScoreA =
      (issueA.occurrenceFrequency / 10) * 40 > 40 ? 40 : (issueA.occurrenceFrequency / 10) * 40;
    const frequencyScoreB =
      (issueB.occurrenceFrequency / 10) * 40 > 40 ? 40 : (issueB.occurrenceFrequency / 10) * 40;
    const frequencyScoreC =
      (issueC.occurrenceFrequency / 10) * 40 > 40 ? 40 : (issueC.occurrenceFrequency / 10) * 40;

    const impactScoreA = (issueA.impactScore / 100) * 40;
    const impactScoreB = (issueB.impactScore / 100) * 40;
    const impactScoreC = (issueC.impactScore / 100) * 40;

    const resolutionDifficultyScoreA = Math.min((issueA.resolutionDaysAverage / 5) * 20, 20);
    const resolutionDifficultyScoreB = Math.min((issueB.resolutionDaysAverage / 5) * 20, 20);
    const resolutionDifficultyScoreC = Math.min((issueC.resolutionDaysAverage / 5) * 20, 20);

    const expectedPriorityScoreA = frequencyScoreA + impactScoreA + resolutionDifficultyScoreA;
    const expectedPriorityScoreB = frequencyScoreB + impactScoreB + resolutionDifficultyScoreB;
    const expectedPriorityScoreC = frequencyScoreC + impactScoreC + resolutionDifficultyScoreC;

    expect(resultA.priorityScore).toBe(Math.round(expectedPriorityScoreA));
    expect(resultB.priorityScore).toBe(Math.round(expectedPriorityScoreB));
    expect(resultC.priorityScore).toBe(Math.round(expectedPriorityScoreC));

    const scoreBreakdownA = resultA.scoreBreakdown;
    expect(scoreBreakdownA.frequencyScore).toBe(Math.round(frequencyScoreA));
    expect(scoreBreakdownA.impactScore).toBe(Math.round(impactScoreA));
    expect(scoreBreakdownA.resolutionDifficultyScore).toBe(Math.round(resolutionDifficultyScoreA));

    const scoreBreakdownB = resultB.scoreBreakdown;
    expect(scoreBreakdownB.frequencyScore).toBe(Math.round(frequencyScoreB));
    expect(scoreBreakdownB.impactScore).toBe(Math.round(impactScoreB));
    expect(scoreBreakdownB.resolutionDifficultyScore).toBe(Math.round(resolutionDifficultyScoreB));

    const scoreBreakdownC = resultC.scoreBreakdown;
    expect(scoreBreakdownC.frequencyScore).toBe(Math.round(frequencyScoreC));
    expect(scoreBreakdownC.impactScore).toBe(Math.round(impactScoreC));
    expect(scoreBreakdownC.resolutionDifficultyScore).toBe(Math.round(resolutionDifficultyScoreC));

    if (resultA.priorityScore >= 70) {
      expect(resultA.priorityRank).toBe('高');
      expect(resultA.colorCode).toBe('#FF0000');
    } else if (resultA.priorityScore >= 40) {
      expect(resultA.priorityRank).toBe('中');
      expect(resultA.colorCode).toBe('#FFFF00');
    } else {
      expect(resultA.priorityRank).toBe('低');
      expect(resultA.colorCode).toBe('#00FF00');
    }

    if (resultB.priorityScore >= 70) {
      expect(resultB.priorityRank).toBe('高');
      expect(resultB.colorCode).toBe('#FF0000');
    } else if (resultB.priorityScore >= 40) {
      expect(resultB.priorityRank).toBe('中');
      expect(resultB.colorCode).toBe('#FFFF00');
    } else {
      expect(resultB.priorityRank).toBe('低');
      expect(resultB.colorCode).toBe('#00FF00');
    }

    if (resultC.priorityScore >= 70) {
      expect(resultC.priorityRank).toBe('高');
      expect(resultC.colorCode).toBe('#FF0000');
    } else if (resultC.priorityScore >= 40) {
      expect(resultC.priorityRank).toBe('中');
      expect(resultC.colorCode).toBe('#FFFF00');
    } else {
      expect(resultC.priorityRank).toBe('低');
      expect(resultC.colorCode).toBe('#00FF00');
    }
  });
});