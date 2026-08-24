import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Impact Assessment Validation', () => {
  // SCEN-3004: [error] 課題影響度判定機能 - 返されたスコアが 0-100 の範囲外のとき、影響度判定ロジックがエラーになる
  test('should throw RangeError when TextAnalysisServiceAdapter returns out-of-range impact score', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({ keywords: ['server-down'], frequency: 1 }),
      assessImpactScore: jest.fn().mockResolvedValue(-5),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'サーバーダウンにより全機能停止',
      occurrenceFrequency: 1,
      impactScore: -5,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T10:00:00Z',
      teamId: 'TEAM-001',
    };

    expect(() => {
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/有効範囲/);
  });

  // SCEN-3004 continuation: Test with impact score exceeding upper bound (105)
  test('should throw RangeError when TextAnalysisServiceAdapter returns impact score above 100', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({ keywords: ['server-down'], frequency: 1 }),
      assessImpactScore: jest.fn().mockResolvedValue(105),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-002',
      issueContent: 'サーバーダウンにより全機能停止',
      occurrenceFrequency: 1,
      impactScore: 105,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T10:00:00Z',
      teamId: 'TEAM-001',
    };

    expect(() => {
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/有効範囲/);
  });
});