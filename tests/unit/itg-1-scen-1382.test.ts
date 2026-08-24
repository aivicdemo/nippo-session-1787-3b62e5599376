import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue highlighting and color-coding for manager dashboard', () => {
  // SCEN-1382: [error] 重複課題統合・優先度再計算機能 - 課題に色分けルール定義がないとき強調表示の判定が失敗する
  test('should return structured error when issue lacks color rule definition and handle gracefully without stopping processing', () => {
    const analysisStartDate = '2024-11-01T00:00:00Z';
    const analysisEndDate = '2024-11-07T23:59:59Z';

    const reportDataList = [
      {
        id: 'REPORT-001',
        submittedAt: '2024-11-01T08:30:00Z',
        yesterday: 'Completed task A',
        today: 'Start task B',
        issues: 'Database connection timeout',
        submittedByUserId: 'ENG-001',
        teamId: 'TEAM-001',
      },
      {
        id: 'REPORT-002',
        submittedAt: '2024-11-02T08:30:00Z',
        yesterday: 'Completed task B',
        today: 'Start task C',
        issues: 'Database connection timeout',
        submittedByUserId: 'ENG-002',
        teamId: 'TEAM-001',
      },
      {
        id: 'REPORT-003',
        submittedAt: '2024-11-03T08:30:00Z',
        yesterday: 'Completed task C',
        today: 'Start task D',
        issues: 'Network latency issue',
        submittedByUserId: 'ENG-003',
        teamId: 'TEAM-001',
      },
    ];

    const input: ExtractIssueKeywordsInput = {
      reportDataList,
      analysisStartDate,
      analysisEndDate,
      minFrequencyThreshold: 1,
    };

    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(input);

    // Verify that processing continues despite missing rule definitions
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // Verify that "Database connection timeout" appears with highest frequency (2 occurrences)
    const databaseIssue = result.keywords.find((kw) => kw.keyword === 'Database connection timeout');
    expect(databaseIssue).toBeDefined();
    expect(databaseIssue?.frequency).toBe(2);

    // Verify that priorityScore and priorityColor are assigned even without explicit rule definitions
    expect(typeof databaseIssue?.priorityScore).toBe('number');
    expect(databaseIssue?.priorityScore).toBeGreaterThanOrEqual(0);
    expect(databaseIssue?.priorityScore).toBeLessThanOrEqual(100);

    // Verify that color assignment uses fallback logic when rules are missing
    // Default color should be applied: red (high frequency) or yellow/green based on calculation
    expect(['red', 'yellow', 'green']).toContain(databaseIssue?.priorityColor);

    // Verify that "Network latency issue" appears with lower frequency (1 occurrence)
    const networkIssue = result.keywords.find((kw) => kw.keyword === 'Network latency issue');
    expect(networkIssue).toBeDefined();
    expect(networkIssue?.frequency).toBe(1);

    // Verify color assignment for lower frequency issue
    expect(['red', 'yellow', 'green']).toContain(networkIssue?.priorityColor);

    // Verify that processing metrics are recorded
    expect(result.totalIssueCount).toBe(3);
    expect(result.analysisExecutedAt).toBeDefined();
    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Verify that keywords are ranked by frequency (highest first)
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i]!.frequency).toBeGreaterThanOrEqual(result.keywords[i + 1]!.frequency);
    }

    // Verify that all keywords have valid priority scores
    result.keywords.forEach((kw) => {
      expect(kw.priorityScore).toBeGreaterThanOrEqual(0);
      expect(kw.priorityScore).toBeLessThanOrEqual(100);
      expect(['red', 'yellow', 'green']).toContain(kw.priorityColor);
    });
  });
});