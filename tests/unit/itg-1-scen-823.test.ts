import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-823: [edge] 課題優先度スコア算出機能 - 優先度スコア算出に割り算が含まれ端数が発生するとき、適切に丸められる
  test('影響度スコア計算時に端数が発生する場合、四捨五入で整数に丸められる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn((content: string) => {
        if (content.includes('fractional_low')) {
          return 22.333;
        }
        if (content.includes('fractional_high')) {
          return 22.666;
        }
        return 50;
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input_fractional_low: IssuePriorityScoringInput = {
      issueId: 'issue_001',
      issueContent: 'Test fractional_low impact',
      occurrenceFrequency: 5,
      impactScore: 67,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team_001',
    };

    const result_low = calculateIssuePriorityScore(
      input_fractional_low,
      mockTextAnalysisServiceAdapter as any
    );

    expect(result_low.priorityScore).toBe(22);
    expect(typeof result_low.priorityScore).toBe('number');
    expect(Number.isInteger(result_low.priorityScore)).toBe(true);

    const input_fractional_high: IssuePriorityScoringInput = {
      issueId: 'issue_002',
      issueContent: 'Test fractional_high impact',
      occurrenceFrequency: 5,
      impactScore: 68,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team_001',
    };

    const result_high = calculateIssuePriorityScore(
      input_fractional_high,
      mockTextAnalysisServiceAdapter as any
    );

    expect(result_high.priorityScore).toBe(23);
    expect(typeof result_high.priorityScore).toBe('number');
    expect(Number.isInteger(result_high.priorityScore)).toBe(true);
  });
});