import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import { type ExtractAndRankIssuesInput, type RankedIssueList } from '../../src/logic/issue-extraction-and-ranking';

describe('Issue Extraction and Ranking - Edge Cases', () => {
  test('SCEN-328: Extract and rank issues with low submission rate (40% of team)', () => {
    // Setup: Create 4 reports (40% of 10-person team)
    const reports = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-15T09:00:00Z'),
        issueText: 'ビルドエラーが発生',
        teamId: 'team-alpha',
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-15T09:15:00Z'),
        issueText: 'ビルドエラーが発生',
        teamId: 'team-alpha',
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2024-01-15T09:30:00Z'),
        issueText: 'テスト環境が不安定',
        teamId: 'team-alpha',
      },
      {
        reportId: 'report-004',
        reportDate: new Date('2024-01-15T09:45:00Z'),
        issueText: 'テスト環境が不安定',
        teamId: 'team-alpha',
      },
    ];

    const input: ExtractAndRankIssuesInput = {
      reports,
      analysisStartDate: new Date('2023-12-16T00:00:00Z'), // 30 days before 2024-01-15
      analysisEndDate: new Date('2024-01-15T23:59:59Z'),
      teamIds: undefined, // no team filter
      minimumConfidenceThreshold: 50, // default value
    };

    // Mock dependencies: extractKeywordsFromReportText, normalizeAndDeduplicateIssues,
    // calculateIssueFrequencyRanking, combineFrequencyAndImpactForPriority,
    // applyPriorityColorCoding, calculatePriorityScoreForIssue all return valid results

    // Mock extracted keywords: 2 unique keywords with frequencies
    // "ビルドエラー" appears 2 times in reports 1,2
    // "テスト環境" appears 2 times in reports 3,4

    // Mock frequency ranking results
    const mockFrequencyRanking = {
      rankedKeywords: [
        {
          keywordId: 'kw-001',
          keywordName: 'ビルドエラー',
          occurrenceCount: 2,
          frequencyRank: 1,
        },
        {
          keywordId: 'kw-002',
          keywordName: 'テスト環境',
          occurrenceCount: 2,
          frequencyRank: 2,
        },
      ],
      aggregationPeriod: {
        startDate: new Date('2023-12-16T00:00:00Z'),
        endDate: new Date('2024-01-15T23:59:59Z'),
      },
      totalReportsAnalyzed: 4,
    };

    // Expected RankedIssueList with low confidence count warning
    // Since submission rate is 40% (4 out of 10), lowConfidenceIssueCount should equal total extracted count
    // Calculation:
    // - frequencyScore for "ビルドエラー": (2 / 2) * 100 = 100
    // - frequencyScore for "テスト環境": (2 / 2) * 100 = 100
    // - impactScore for both: (2 affected members / 10 team size) * 100 = 20
    // - priorityScore for "ビルドエラー": (100 * 0.4) + (20 * 0.6) = 40 + 12 = 52
    // - priorityScore for "テスト環境": (100 * 0.4) + (20 * 0.6) = 40 + 12 = 52
    // Both issues have similar priority, sorted by frequency rank

    const result = extractAndRankIssuesFromReports(input);

    // Assertions
    expect(result).toBeDefined();
    expect(result.issues).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);

    // Verify issues are sorted by priority score in descending order
    for (let i = 0; i < result.issues.length - 1; i++) {
      expect(result.issues[i].priorityScore).toBeGreaterThanOrEqual(
        result.issues[i + 1].priorityScore
      );
    }

    // Verify lowConfidenceIssueCount equals total extracted issues
    // (submission rate is 40%, below 50% threshold)
    expect(result.lowConfidenceIssueCount).toBe(result.totalIssueCount);

    // Verify analysisTimestamp is set
    expect(result.analysisTimestamp).toBeInstanceOf(Date);
    expect(result.analysisTimestamp.getTime()).toBeLessThanOrEqual(Date.now());

    // Verify each ranked issue has required fields
    result.issues.forEach((issue) => {
      expect(issue.issueId).toBeDefined();
      expect(typeof issue.issueId).toBe('string');

      expect(issue.keyword).toBeDefined();
      expect(typeof issue.keyword).toBe('string');

      expect(issue.frequency).toBeDefined();
      expect(typeof issue.frequency).toBe('number');
      expect(issue.frequency).toBeGreaterThanOrEqual(0);

      expect(issue.impactScore).toBeDefined();
      expect(typeof issue.impactScore).toBe('number');
      expect(issue.impactScore).toBeGreaterThanOrEqual(0);
      expect(issue.impactScore).toBeLessThanOrEqual(100);

      expect(issue.priorityScore).toBeDefined();
      expect(typeof issue.priorityScore).toBe('number');
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);

      expect(issue.priorityRank).toBeDefined();
      expect(['高', '中', '低']).toContain(issue.priorityRank);

      expect(issue.colorCode).toBeDefined();
      expect(['red', 'yellow', 'green']).toContain(issue.colorCode);

      expect(issue.confidenceScore).toBeDefined();
      expect(typeof issue.confidenceScore).toBe('number');
      expect(issue.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(issue.confidenceScore).toBeLessThanOrEqual(100);

      expect(issue.affectedTeamCount).toBeDefined();
      expect(typeof issue.affectedTeamCount).toBe('number');
      expect(issue.affectedTeamCount).toBeGreaterThanOrEqual(1);
      expect(issue.affectedTeamCount).toBeLessThanOrEqual(4); // max submitted reports
    });

    // Verify total issue count matches extracted issues
    expect(result.totalIssueCount).toBeGreaterThan(0);
    expect(result.issues.length).toBe(result.totalIssueCount);

    // Warning: submission rate is 40% (4/10), below 50% threshold
    // This should be indicated by lowConfidenceIssueCount matching totalIssueCount
    expect(result.lowConfidenceIssueCount).toBe(result.totalIssueCount);
  });
});