import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-1017: [normal] 課題重要度分類機能 - 複数の課題テキストが高・中・低の重要度に分類される
  test('複数の課題テキストが高・中・低の重要度に分類されて優先度スコアが計算される', () => {
    const mockTextAnalysisServiceAdapter = {
      classifyIssueSeverity: jest.fn((issueText: string) => {
        if (issueText === 'サーバーがダウンした') {
          return Promise.resolve('高');
        }
        if (issueText === 'ドキュメント更新が遅れている') {
          return Promise.resolve('中');
        }
        if (issueText === 'メールの返信が遅い') {
          return Promise.resolve('低');
        }
        return Promise.resolve('中');
      }),
    };

    const testCases = [
      {
        input: {
          issueId: 'issue-001',
          issueContent: 'サーバーがダウンした',
          occurrenceFrequency: 5,
          impactScore: 95,
          affectedTeamCount: 8,
          resolutionDaysAverage: 2,
          reportingDate: '2024-01-15T09:00:00Z',
          teamId: 'team-001',
        } as IssuePriorityScoringInput,
        expectedSeverity: '高',
        expectedMinScore: 85,
      },
      {
        input: {
          issueId: 'issue-002',
          issueContent: 'ドキュメント更新が遅れている',
          occurrenceFrequency: 3,
          impactScore: 50,
          affectedTeamCount: 3,
          resolutionDaysAverage: 5,
          reportingDate: '2024-01-15T10:00:00Z',
          teamId: 'team-001',
        } as IssuePriorityScoringInput,
        expectedSeverity: '中',
        expectedMinScore: 40,
      },
      {
        input: {
          issueId: 'issue-003',
          issueContent: 'メールの返信が遅い',
          occurrenceFrequency: 1,
          impactScore: 20,
          affectedTeamCount: 1,
          resolutionDaysAverage: 1,
          reportingDate: '2024-01-15T11:00:00Z',
          teamId: 'team-001',
        } as IssuePriorityScoringInput,
        expectedSeverity: '低',
        expectedMaxScore: 30,
      },
    ];

    testCases.forEach(async (testCase) => {
      const result = await calculateIssuePriorityScore(
        testCase.input,
        mockTextAnalysisServiceAdapter,
      );

      expect(result).toBeDefined();
      expect(result.issueId).toBe(testCase.input.issueId);
      expect(typeof result.priorityScore).toBe('number');
      expect(result.priorityScore).toBeGreaterThanOrEqual(1);
      expect(result.priorityScore).toBeLessThanOrEqual(100);

      if (testCase.expectedSeverity === '高') {
        expect(result.priorityRank).toBe('高');
        expect(result.priorityScore).toBeGreaterThanOrEqual(testCase.expectedMinScore);
        expect(result.colorCode).toBe('#FF0000');
      } else if (testCase.expectedSeverity === '中') {
        expect(result.priorityRank).toBe('中');
        expect(result.priorityScore).toBeGreaterThanOrEqual(testCase.expectedMinScore);
        expect(result.colorCode).toBe('#FFFF00');
      } else if (testCase.expectedSeverity === '低') {
        expect(result.priorityRank).toBe('低');
        expect(result.priorityScore).toBeLessThanOrEqual(testCase.expectedMaxScore);
        expect(result.colorCode).toBe('#00FF00');
      }

      expect(result.scoreBreakdown).toBeDefined();
      expect(typeof result.scoreBreakdown.frequencyScore).toBe('number');
      expect(typeof result.scoreBreakdown.impactScore).toBe('number');
      expect(typeof result.scoreBreakdown.resolutionDifficultyScore).toBe('number');
      expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
      expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
      expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

      expect(result.calculatedAt).toBeDefined();
      const parsedDate = new Date(result.calculatedAt);
      expect(parsedDate.getTime()).toBeGreaterThan(0);

      expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledWith(
        testCase.input.issueContent,
      );
    });
  });
});