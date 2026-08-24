import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation - 6 Day Aggregation Period', () => {
  test('SCEN-1588: Generate report for 6-day (144-hour) aggregation period with extracted keywords, impact scores, and severity classification', () => {
    // Setup: Create 6-day aggregation period
    const aggregationStartDate = '2024-01-08'; // Monday
    const aggregationEndDate = '2024-01-13'; // Saturday (6 days)
    const teamId = 'team-001';

    // Mock extracted issue data with keyword, frequency, and impact information
    const extractedIssueData = [
      {
        issueKeyword: 'データベース遅延',
        occurrenceCount: 5,
        impactScore: 85,
        severity: 'high' as const,
      },
      {
        issueKeyword: 'APIタイムアウト',
        occurrenceCount: 3,
        impactScore: 72,
        severity: 'medium' as const,
      },
      {
        issueKeyword: 'メモリリーク',
        occurrenceCount: 2,
        impactScore: 65,
        severity: 'medium' as const,
      },
      {
        issueKeyword: 'ビルド失敗',
        occurrenceCount: 4,
        impactScore: 58,
        severity: 'low' as const,
      },
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate,
      aggregationEndDate,
      extractedIssues: extractedIssueData,
      teamId,
    };

    // Execute: Generate weekly analysis report
    const report: WeeklyAnalysisReport = generateWeeklyAnalysisReport(input);

    // Verify: Report structure and content
    expect(report).toBeDefined();
    expect(report.reportId).toBeDefined();
    expect(typeof report.reportId).toBe('string');

    // Verify: Aggregation period matches 6-day input
    expect(report.aggregationPeriod.startDate).toBe(aggregationStartDate);
    expect(report.aggregationPeriod.endDate).toBe(aggregationEndDate);

    // Verify: Issue ranking by occurrence count (highest first)
    expect(report.issueRanking).toHaveLength(4);
    expect(report.issueRanking[0].issueKeyword).toBe('データベース遅延');
    expect(report.issueRanking[0].occurrenceCount).toBe(5);
    expect(report.issueRanking[0].rank).toBe(1);

    expect(report.issueRanking[1].issueKeyword).toBe('ビルド失敗');
    expect(report.issueRanking[1].occurrenceCount).toBe(4);
    expect(report.issueRanking[1].rank).toBe(2);

    expect(report.issueRanking[2].issueKeyword).toBe('APIタイムアウト');
    expect(report.issueRanking[2].occurrenceCount).toBe(3);
    expect(report.issueRanking[2].rank).toBe(3);

    expect(report.issueRanking[3].issueKeyword).toBe('メモリリーク');
    expect(report.issueRanking[3].occurrenceCount).toBe(2);
    expect(report.issueRanking[3].rank).toBe(4);

    // Verify: Priority scores for each issue (0-100 range)
    expect(report.priorityScores).toHaveLength(4);

    const dbDelayScore = report.priorityScores.find(
      (item) => item.issueId === 'データベース遅延'
    );
    expect(dbDelayScore).toBeDefined();
    expect(dbDelayScore!.priorityScore).toBe(85);
    expect(dbDelayScore!.priorityRank).toBe('high');

    const apiTimeoutScore = report.priorityScores.find(
      (item) => item.issueId === 'APIタイムアウト'
    );
    expect(apiTimeoutScore).toBeDefined();
    expect(apiTimeoutScore!.priorityScore).toBe(72);
    expect(apiTimeoutScore!.priorityRank).toBe('medium');

    const memoryLeakScore = report.priorityScores.find(
      (item) => item.issueId === 'メモリリーク'
    );
    expect(memoryLeakScore).toBeDefined();
    expect(memoryLeakScore!.priorityScore).toBe(65);
    expect(memoryLeakScore!.priorityRank).toBe('medium');

    const buildFailureScore = report.priorityScores.find(
      (item) => item.issueId === 'ビルド失敗'
    );
    expect(buildFailureScore).toBeDefined();
    expect(buildFailureScore!.priorityScore).toBe(58);
    expect(buildFailureScore!.priorityRank).toBe('low');

    // Verify: Recommended countermeasures are generated
    expect(report.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(report.recommendedCountermeasures)).toBe(true);
    expect(report.recommendedCountermeasures.length).toBeGreaterThan(0);

    // Verify: Generated timestamp is ISO 8601 format
    expect(report.generatedAt).toBeDefined();
    expect(typeof report.generatedAt).toBe('string');
    const generatedDate = new Date(report.generatedAt);
    expect(generatedDate.getTime()).toBeGreaterThan(0);
    expect(report.generatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // Verify: Each recommended countermeasure has required fields
    report.recommendedCountermeasures.forEach((measure) => {
      expect(measure).toHaveProperty('issueKeyword');
      expect(measure).toHaveProperty('recommendedAction');
      expect(typeof measure.issueKeyword).toBe('string');
      expect(typeof measure.recommendedAction).toBe('string');
    });
  });
});