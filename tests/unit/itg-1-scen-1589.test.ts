import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1589: [edge] 週次課題傾向レポート生成機能 - 集計期間が 8 日間（7 日超過）でレポート生成される
  test('should generate weekly analysis report with 8-day aggregation period exceeding 7-day standard', async () => {
    // Setup: Prepare test data with 8-day period (exceeding standard 7-day weekly period)
    const aggregationStartDate = '2026-08-19';
    const aggregationEndDate = '2026-08-26';
    const teamId = 'team-001';

    // Mock extracted issues data for 5 issues reported during the 8-day period
    const extractedIssuesData = [
      {
        keyword: 'database_performance',
        occurrenceCount: 3,
        impactScore: 85,
        severity: 'high' as const,
      },
      {
        keyword: 'api_timeout',
        occurrenceCount: 2,
        impactScore: 72,
        severity: 'medium' as const,
      },
      {
        keyword: 'memory_leak',
        occurrenceCount: 2,
        impactScore: 88,
        severity: 'high' as const,
      },
      {
        keyword: 'unit_test_coverage',
        occurrenceCount: 1,
        impactScore: 45,
        severity: 'low' as const,
      },
      {
        keyword: 'ci_pipeline_delay',
        occurrenceCount: 1,
        impactScore: 60,
        severity: 'medium' as const,
      },
    ];

    // Create input object matching WeeklyAnalysisReportInput structure
    const reportInput: WeeklyAnalysisReportInput = {
      aggregationStartDate,
      aggregationEndDate,
      extractedIssues: extractedIssuesData,
      teamId,
    };

    // Execute: Call generateWeeklyAnalysisReport with 8-day period input
    const result: WeeklyAnalysisReport = await generateWeeklyAnalysisReport(reportInput);

    // Verify: Check that report was generated successfully
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');

    // Verify aggregation period matches the 8-day span
    expect(result.aggregationPeriod.startDate).toBe('2026-08-19');
    expect(result.aggregationPeriod.endDate).toBe('2026-08-26');

    // Verify all 5 extracted issues are included in the report
    expect(result.issueRanking).toBeDefined();
    expect(result.issueRanking.length).toBe(5);

    // Verify issue ranking is sorted by occurrence frequency (descending)
    expect(result.issueRanking[0].issueKeyword).toBe('database_performance');
    expect(result.issueRanking[0].occurrenceCount).toBe(3);
    expect(result.issueRanking[0].rank).toBe(1);

    expect(result.issueRanking[1].issueKeyword).toBe('api_timeout');
    expect(result.issueRanking[1].occurrenceCount).toBe(2);
    expect(result.issueRanking[1].rank).toBe(2);

    expect(result.issueRanking[2].issueKeyword).toBe('memory_leak');
    expect(result.issueRanking[2].occurrenceCount).toBe(2);
    expect(result.issueRanking[2].rank).toBe(3);

    expect(result.issueRanking[3].issueKeyword).toBe('unit_test_coverage');
    expect(result.issueRanking[3].occurrenceCount).toBe(1);
    expect(result.issueRanking[3].rank).toBe(4);

    expect(result.issueRanking[4].issueKeyword).toBe('ci_pipeline_delay');
    expect(result.issueRanking[4].occurrenceCount).toBe(1);
    expect(result.issueRanking[4].rank).toBe(5);

    // Verify priority scores are calculated and included
    expect(result.priorityScores).toBeDefined();
    expect(result.priorityScores.length).toBe(5);

    // Verify first issue (highest impact) has high priority rank
    const highestPriorityIssue = result.priorityScores.find(
      (p) => p.issueId === 'database_performance',
    );
    expect(highestPriorityIssue).toBeDefined();
    expect(highestPriorityIssue!.priorityScore).toBe(85);
    expect(highestPriorityIssue!.priorityRank).toBe('high');

    // Verify memory_leak issue (second highest impact) has high priority rank
    const memoryLeakIssue = result.priorityScores.find((p) => p.issueId === 'memory_leak');
    expect(memoryLeakIssue).toBeDefined();
    expect(memoryLeakIssue!.priorityScore).toBe(88);
    expect(memoryLeakIssue!.priorityRank).toBe('high');

    // Verify medium priority issues
    const apiTimeoutIssue = result.priorityScores.find((p) => p.issueId === 'api_timeout');
    expect(apiTimeoutIssue).toBeDefined();
    expect(apiTimeoutIssue!.priorityScore).toBe(72);
    expect(apiTimeoutIssue!.priorityRank).toBe('medium');

    const ciPipelineIssue = result.priorityScores.find((p) => p.issueId === 'ci_pipeline_delay');
    expect(ciPipelineIssue).toBeDefined();
    expect(ciPipelineIssue!.priorityScore).toBe(60);
    expect(ciPipelineIssue!.priorityRank).toBe('medium');

    // Verify low priority issue
    const testCoverageIssue = result.priorityScores.find((p) => p.issueId === 'unit_test_coverage');
    expect(testCoverageIssue).toBeDefined();
    expect(testCoverageIssue!.priorityScore).toBe(45);
    expect(testCoverageIssue!.priorityRank).toBe('low');

    // Verify recommended countermeasures are generated
    expect(result.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(result.recommendedCountermeasures)).toBe(true);
    expect(result.recommendedCountermeasures.length).toBeGreaterThan(0);

    // Verify generated report timestamp is present and valid ISO 8601 format
    expect(result.generatedAt).toBeDefined();
    const generatedAtDate = new Date(result.generatedAt);
    expect(generatedAtDate.getTime()).toBeGreaterThan(0);
    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});