import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題抽出・優先度判定 - 優先度スコア算出', () => {
  // SCEN-778
  test('複数課題が同じ優先度スコアを持つ場合、安定ソートで元の配列順序が保持される', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: { [key: string]: number } = {
          'issueA': 40,
          'issueB': 40,
          'issueC': 0,
          'issueD': 40,
        };
        return scoreMap[keyword] || 0;
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issues: [
        {
          issueId: 'issue-0',
          priorityScore: 0,
          keyword: 'issueA',
          impactLevel: 'high',
        },
        {
          issueId: 'issue-1',
          priorityScore: 0,
          keyword: 'issueB',
          impactLevel: 'high',
        },
        {
          issueId: 'issue-2',
          priorityScore: 0,
          keyword: 'issueC',
          impactLevel: 'low',
        },
        {
          issueId: 'issue-3',
          priorityScore: 0,
          keyword: 'issueD',
          impactLevel: 'high',
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-123',
    };

    const scoreBreakdownMap: { [key: string]: { frequencyScore: number; impactScore: number; resolutionDifficultyScore: number } } = {
      'issue-0': { frequencyScore: 24, impactScore: 40, resolutionDifficultyScore: 11 },
      'issue-1': { frequencyScore: 24, impactScore: 40, resolutionDifficultyScore: 11 },
      'issue-2': { frequencyScore: 12, impactScore: 20, resolutionDifficultyScore: 8 },
      'issue-3': { frequencyScore: 24, impactScore: 40, resolutionDifficultyScore: 11 },
    };

    const result = calculateIssuePriorityScore(
      {
        issueId: input.issues[0].issueId,
        issueContent: input.issues[0].keyword,
        occurrenceFrequency: 30,
        impactScore: 100,
        affectedTeamCount: 2,
        resolutionDaysAverage: 2,
        reportingDate: '2024-01-15T09:00:00Z',
        teamId: 'team-001',
      },
      mockTextAnalysisAdapter
    );

    const sortedResult = input.issues
      .map((issue, originalIndex) => ({
        ...issue,
        originalIndex,
        calculatedScore:
          scoreBreakdownMap[issue.issueId].frequencyScore +
          scoreBreakdownMap[issue.issueId].impactScore +
          scoreBreakdownMap[issue.issueId].resolutionDifficultyScore,
      }))
      .sort((a, b) => {
        const scoreComparison = b.calculatedScore - a.calculatedScore;
        if (scoreComparison !== 0) return scoreComparison;
        return a.originalIndex - b.originalIndex;
      });

    expect(sortedResult).toHaveLength(4);
    expect(sortedResult[0].issueId).toBe('issue-0');
    expect(sortedResult[0].originalIndex).toBe(0);
    expect(sortedResult[1].issueId).toBe('issue-1');
    expect(sortedResult[1].originalIndex).toBe(1);
    expect(sortedResult[2].issueId).toBe('issue-3');
    expect(sortedResult[2].originalIndex).toBe(3);
    expect(sortedResult[3].issueId).toBe('issue-2');
    expect(sortedResult[3].originalIndex).toBe(2);

    expect(sortedResult[0].calculatedScore).toBe(75);
    expect(sortedResult[1].calculatedScore).toBe(75);
    expect(sortedResult[2].calculatedScore).toBe(75);
    expect(sortedResult[3].calculatedScore).toBe(40);
  });
});