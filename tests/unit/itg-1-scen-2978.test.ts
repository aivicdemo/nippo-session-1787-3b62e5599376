import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア自動計算機能', () => {
  // SCEN-2978
  test('日報テキストが空文字列のとき、エラーが投げられる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockImplementation(() => {
        throw new Error('入力テキストが空です');
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: '',
      occurrenceFrequency: 1,
      impactScore: 50,
      affectedTeamCount: 1,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    expect(() => {
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/入力テキストが空/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
  });
});