import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度スコア計算 - 影響度判定エラーハンドリング', () => {
  test('SCEN-3001: 課題テキストが空文字列のとき、影響度判定がエラーになる', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(() => ({
        error: true,
        code: 'EMPTY_TEXT_ERROR',
        message: '課題テキストが空です',
      })),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: '',
      occurrenceFrequency: 3,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    expect(() => {
      calculateIssuePriorityScore(input, mockTextAnalysisAdapter);
    }).toThrow(/空/);
  });
});