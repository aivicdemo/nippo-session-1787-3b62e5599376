import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-640
  test('[edge] 優先度スコアが2で1より高い優先度として判定される', () => {
    const issueInput1 = {
      issueId: 'TEST-001',
      issueContent: 'Critical database connection failure affecting all users',
      occurrenceFrequency: 15,
      impactScore: 95,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001',
    };

    const issueInput2 = {
      issueId: 'TEST-002',
      issueContent: 'Minor UI formatting issue on login page',
      occurrenceFrequency: 1,
      impactScore: 10,
      affectedTeamCount: 1,
      resolutionDaysAverage: 0.5,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001',
    };

    const result1 = calculateIssuePriorityScore(issueInput1);
    const result2 = calculateIssuePriorityScore(issueInput2);

    expect(result1.priorityScore).toBeGreaterThan(result2.priorityScore);
    expect(result1.priorityScore).toBeGreaterThanOrEqual(2);
    expect(result2.priorityScore).toBeLessThanOrEqual(1);
  });
});