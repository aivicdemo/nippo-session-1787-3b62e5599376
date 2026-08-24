import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-912
  test('[error] TextAnalysisServiceAdapterの呼び出しが失敗したときキャッシュから結果を返さず例外をスローする', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockImplementation(() => {
        throw new Error('TimeoutError');
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'サーバー障害により本番環境が停止している',
      occurrenceFrequency: 5,
      impactScore: 0,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-alpha',
    };

    expect(() => {
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/TimeoutError/);

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
  });
});