import { describe, it, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Rounding and Color Distribution', () => {
  // SCEN-968
  it('should correctly round decimal priority scores using banker\'s rounding and apply appropriate color codes', () => {
    const input_47_6: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 5,
      impactScore: 47.6,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const result_47_6 = calculateIssuePriorityScore(input_47_6);
    expect(result_47_6.priorityScore).toBe(48);
    expect(result_47_6.colorCode).toBe('#FFFF00');
    expect(result_47_6.priorityRank).toBe('中');

    const input_52_3: IssuePriorityScoringInput = {
      issueId: 'issue-002',
      issueContent: 'API rate limiting causing intermittent failures',
      occurrenceFrequency: 4,
      impactScore: 52.3,
      affectedTeamCount: 3,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const result_52_3 = calculateIssuePriorityScore(input_52_3);
    expect(result_52_3.priorityScore).toBe(52);
    expect(result_52_3.colorCode).toBe('#FFFF00');
    expect(result_52_3.priorityRank).toBe('中');

    const input_88_9: IssuePriorityScoringInput = {
      issueId: 'issue-003',
      issueContent: 'Critical production outage affecting all users',
      occurrenceFrequency: 12,
      impactScore: 88.9,
      affectedTeamCount: 8,
      resolutionDaysAverage: 4,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const result_88_9 = calculateIssuePriorityScore(input_88_9);
    expect(result_88_9.priorityScore).toBe(89);
    expect(result_88_9.colorCode).toBe('#FF0000');
    expect(result_88_9.priorityRank).toBe('高');
  });
});