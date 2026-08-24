import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Maximum Impact Score Handling', () => {
  // SCEN-815: [edge] 課題優先度スコア算出機能 - チーム波及度スコアがちょうど100のとき、最大優先度として扱われる
  test('should assign maximum priority score and critical rank when impact score equals 100', () => {
    const criticalIssueInput: IssuePriorityScoringInput = {
      issueId: 'issue-critical-001',
      issueContent: '本番障害が発生し、全顧客に影響を与えている状況です',
      occurrenceFrequency: 5,
      impactScore: 100,
      affectedTeamCount: 8,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-engineering-001'
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(criticalIssueInput);

    expect(result.issueId).toBe('issue-critical-001');
    expect(result.priorityScore).toBe(100);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThan(0);
    expect(result.colorCode).toBe('#FF0000');
    expect(typeof result.calculatedAt).toBe('string');
  });

  test('should rank maximum impact score issue higher than lower score issues', () => {
    const criticalIssueInput: IssuePriorityScoringInput = {
      issueId: 'issue-critical-002',
      issueContent: '本番環境で致命的エラーが発生',
      occurrenceFrequency: 3,
      impactScore: 100,
      affectedTeamCount: 10,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-engineering-002'
    };

    const highIssueInput: IssuePriorityScoringInput = {
      issueId: 'issue-high-001',
      issueContent: 'パフォーマンス低下が一部機能で報告',
      occurrenceFrequency: 2,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-engineering-002'
    };

    const criticalResult: IssuePriorityScoringOutput = calculateIssuePriorityScore(criticalIssueInput);
    const highResult: IssuePriorityScoringOutput = calculateIssuePriorityScore(highIssueInput);

    expect(criticalResult.priorityScore).toBe(100);
    expect(criticalResult.priorityRank).toBe('高');
    expect(criticalResult.colorCode).toBe('#FF0000');

    expect(highResult.priorityScore).toBeLessThan(100);
    expect(highResult.priorityRank).toBe('高');

    expect(criticalResult.priorityScore).toBeGreaterThan(highResult.priorityScore);
  });

  test('should correctly apply impact score component when impact is maximum', () => {
    const maxImpactInput: IssuePriorityScoringInput = {
      issueId: 'issue-max-impact-001',
      issueContent: '全システムダウン',
      occurrenceFrequency: 1,
      impactScore: 100,
      affectedTeamCount: 12,
      resolutionDaysAverage: 4,
      reportingDate: '2024-01-15',
      teamId: 'team-platform-001'
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(maxImpactInput);

    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.priorityScore).toBe(100);
    expect(result.scoreBreakdown.frequencyScore + result.scoreBreakdown.impactScore + result.scoreBreakdown.resolutionDifficultyScore).toBe(100);
  });

  test('should differentiate between impact score 100 and 99 in priority ranking', () => {
    const perfectImpactInput: IssuePriorityScoringInput = {
      issueId: 'issue-perfect-impact-001',
      issueContent: '全サービス停止',
      occurrenceFrequency: 1,
      impactScore: 100,
      affectedTeamCount: 15,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-critical-001'
    };

    const nearlyCriticalInput: IssuePriorityScoringInput = {
      issueId: 'issue-nearly-critical-001',
      issueContent: 'サービス障害の兆候',
      occurrenceFrequency: 1,
      impactScore: 99,
      affectedTeamCount: 14,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-critical-001'
    };

    const perfectResult: IssuePriorityScoringOutput = calculateIssuePriorityScore(perfectImpactInput);
    const nearlyCriticalResult: IssuePriorityScoringOutput = calculateIssuePriorityScore(nearlyCriticalInput);

    expect(perfectResult.priorityScore).toBeGreaterThanOrEqual(nearlyCriticalResult.priorityScore);
    expect(perfectResult.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(nearlyCriticalResult.scoreBreakdown.impactScore);
  });
});