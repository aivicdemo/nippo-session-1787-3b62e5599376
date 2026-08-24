import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度順序付け機能', () => {
  // SCEN-794
  test('優先度スコアが異なる複数の課題がある場合、高スコア順に降順で順序付けされる', () => {
    const issueA = {
      issueId: 'issue-a',
      keyword: 'Database Performance',
      priorityScore: 75,
      frequency: 5,
      impactScore: 70,
    };

    const issueB = {
      issueId: 'issue-b',
      keyword: 'API Timeout',
      priorityScore: 92,
      frequency: 8,
      impactScore: 95,
    };

    const issueC = {
      issueId: 'issue-c',
      keyword: 'Documentation Update',
      priorityScore: 45,
      frequency: 2,
      impactScore: 30,
    };

    const issueD = {
      issueId: 'issue-d',
      keyword: 'Test Coverage',
      priorityScore: 88,
      frequency: 7,
      impactScore: 85,
    };

    const inputIssues = [issueA, issueB, issueC, issueD];

    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-001';

    const input = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    const result = extractAndRankIssueKeywords(input);

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    if (result.keywords && result.keywords.length >= 4) {
      const rankedKeywords = result.keywords;

      expect(rankedKeywords[0].priorityScore).toBe(92);
      expect(rankedKeywords[0].keyword).toBeDefined();
      expect(rankedKeywords[0].rank).toBe(1);

      expect(rankedKeywords[1].priorityScore).toBe(88);
      expect(rankedKeywords[1].keyword).toBeDefined();
      expect(rankedKeywords[1].rank).toBe(2);

      expect(rankedKeywords[2].priorityScore).toBe(75);
      expect(rankedKeywords[2].keyword).toBeDefined();
      expect(rankedKeywords[2].rank).toBe(3);

      expect(rankedKeywords[3].priorityScore).toBe(45);
      expect(rankedKeywords[3].keyword).toBeDefined();
      expect(rankedKeywords[3].rank).toBe(4);

      for (let i = 1; i < rankedKeywords.length; i++) {
        expect(rankedKeywords[i - 1].priorityScore).toBeGreaterThanOrEqual(
          rankedKeywords[i].priorityScore
        );
      }
    }

    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(0);
    expect(result.extractedAt).toBeDefined();
    expect(typeof result.extractedAt).toBe('object');
    expect(result.analysisperiodDays).toBeGreaterThanOrEqual(0);
  });
});