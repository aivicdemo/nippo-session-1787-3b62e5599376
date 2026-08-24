import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出 - 複数課題の降順並べ替え検証', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-824
  test('複数の課題が異なる優先度スコアで順序付けられるとき、降順に正確に並ぶ', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        totalKeywordCount: 0,
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          'keyword_A': 85,
          'keyword_B': 60,
          'keyword_C': 92,
          'keyword_D': 45,
        };
        return Promise.resolve(scoreMap[keyword] || 0);
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const issuesInput = [
      {
        issueId: 'issue_001',
        keyword: 'keyword_A',
        priorityScore: 0,
        frequency: 5,
        impactScore: 85,
      },
      {
        issueId: 'issue_002',
        keyword: 'keyword_B',
        priorityScore: 0,
        frequency: 3,
        impactScore: 60,
      },
      {
        issueId: 'issue_003',
        keyword: 'keyword_C',
        priorityScore: 0,
        frequency: 8,
        impactScore: 92,
      },
      {
        issueId: 'issue_004',
        keyword: 'keyword_D',
        priorityScore: 0,
        frequency: 2,
        impactScore: 45,
      },
    ];

    const result = calculateIssuePriorityScore(
      issuesInput,
      mockTextAnalysisAdapter
    );

    expect(result).toHaveLength(4);
    
    expect(result[0].issueId).toBe('issue_003');
    expect(result[0].priorityScore).toBe(92);
    
    expect(result[1].issueId).toBe('issue_001');
    expect(result[1].priorityScore).toBe(85);
    
    expect(result[2].issueId).toBe('issue_002');
    expect(result[2].priorityScore).toBe(60);
    
    expect(result[3].issueId).toBe('issue_004');
    expect(result[3].priorityScore).toBe(45);

    const priorityScores = result.map((issue) => issue.priorityScore);
    const sortedScores = [...priorityScores].sort((a, b) => b - a);
    expect(priorityScores).toEqual(sortedScores);
  });
});