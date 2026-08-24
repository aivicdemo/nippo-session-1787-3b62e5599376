import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコアリング', () => {
  // SCEN-1604
  test('抽出された課題が0件の場合、空のスコア結果リストを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const emptyIssuesInput: IssuePriorityScoringInput[] = [];

    const result = calculateIssuePriorityScore(
      emptyIssuesInput,
      mockTextAnalysisServiceAdapter
    );

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
  });
});