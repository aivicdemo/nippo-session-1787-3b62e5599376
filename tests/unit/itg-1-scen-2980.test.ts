import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, TextAnalysisServiceAdapter } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア自動計算 - TextAnalysisServiceAdapter エラー伝播', () => {
  let textAnalysisServiceAdapter: jest.Mocked<TextAnalysisServiceAdapter>;

  beforeEach(() => {
    textAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  // SCEN-2980
  test('assessImpactScore が失敗した場合、エラーが正しく伝播される', () => {
    // Arrange
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害により業務停止状態が続いている',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-alpha',
    };

    // assessImpactScore がエラーをスロー
    textAnalysisServiceAdapter.assessImpactScore.mockImplementation(() => {
      throw new Error('Impact assessment API failed');
    });

    // Act & Assert
    expect(() => {
      calculateIssuePriorityScore(input, textAnalysisServiceAdapter);
    }).toThrow(/Impact assessment API failed/);

    // Error 型が伝播されることを確認
    try {
      calculateIssuePriorityScore(input, textAnalysisServiceAdapter);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Impact assessment API failed');
    }

    // assessImpactScore が呼び出されたことを確認
    expect(textAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
  });
});