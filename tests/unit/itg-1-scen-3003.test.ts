import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題影響度判定機能', () => {
  // SCEN-3003
  test('TextAnalysisServiceAdapter の assessImpactScore がタイムアウトしたとき、エラーが正しく伝播される', async () => {
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(async () => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const timeoutError = new Error('TimeoutError');
            timeoutError.name = 'TimeoutError';
            reject(timeoutError);
          }, 31000);
        });
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害',
      occurrenceFrequency: 3,
      impactScore: 0,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    try {
      await calculateIssuePriorityScore(input, textAnalysisServiceAdapterStub);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe('TimeoutError');
      expect((error as Error).message).toMatch(/TimeoutError/);
    }
  });
});