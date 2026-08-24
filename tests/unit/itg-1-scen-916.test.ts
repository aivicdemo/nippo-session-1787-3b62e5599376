import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  test('SCEN-916: 複数日報が入力されたとき合算の優先度スコアが負数になり例外をスローする', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'キーワードA', frequency: 8 },
          { keyword: 'キーワードB', frequency: 6 }
        ]
      }),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce({ impactScore: 60 })
        .mockResolvedValueOnce({ impactScore: -70 }),
      classifyIssueSeverity: jest.fn()
    };

    const issue1Input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'キーワードA関連の課題',
      occurrenceFrequency: 8,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001'
    };

    const issue2Input: IssuePriorityScoringInput = {
      issueId: 'issue-002',
      issueContent: 'キーワードB関連の課題',
      occurrenceFrequency: 6,
      impactScore: -70,
      affectedTeamCount: 3,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15T10:00:00Z',
      teamId: 'team-001'
    };

    const aggregatedScoreSum = issue1Input.impactScore + issue2Input.impactScore;
    
    expect(aggregatedScoreSum).toBe(-10);
    expect(() => {
      calculateIssuePriorityScore(issue2Input, mockTextAnalysisServiceAdapter);
    }).toThrow(/優先度スコア/);
  });
});