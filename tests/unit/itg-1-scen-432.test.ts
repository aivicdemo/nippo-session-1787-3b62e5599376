import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-analysis-report';
import { type WeeklyAnalysisReportInput, type AggregatedWeeklyReportData, type WeeklyReportRecord, type ExtractedIssue } from '../../src/logic/weekly-analysis-report';

describe('generateWeeklyAnalysisReport', () => {
  // SCEN-432: [normal] 毎週月曜朝に前週（月曜～日曜）の日報データを集約し、課題を抽出・分析して、優先度スコア付きの週次課題傾向レポートを生成する。 - validateAnalysisDataQualityが設計された計算式の代表値を返す
  test('should generate weekly analysis report with valid data quality metrics when all 50 records are complete', () => {
    const baseDate = new Date('2024-01-08T00:00:00Z'); // Monday
    const endDate = new Date('2024-01-14T23:59:59Z');   // Sunday

    const reportRecords: WeeklyReportRecord[] = [];
    for (let i = 0; i < 50; i++) {
      const dayOffset = i % 7;
      const recordDate = new Date(baseDate);
      recordDate.setDate(recordDate.getDate() + dayOffset);

      reportRecords.push({
        reportId: `report_${i}`,
        employeeId: `emp_${String(Math.floor(i / 7)).padStart(2, '0')}`,
        reportDate: recordDate.toISOString(),
        yesterdayWork: `Yesterday work content for record ${i}`,
        todayPlan: `Today plan content for record ${i}`,
        issues: `Issue content for record ${i}`,
        submittedAt: recordDate.toISOString()
      });
    }

    const extractedIssues: ExtractedIssue[] = [
      {
        issueId: 'issue_001',
        issueContent: 'Build failure issue',
        reporterTeamId: 'team_001',
        occurrenceCount: 5
      },
      {
        issueId: 'issue_002',
        issueContent: 'Deployment delay issue',
        reporterTeamId: 'team_001',
        occurrenceCount: 3
      }
    ];

    const aggregatedData: AggregatedWeeklyReportData = {
      reportRecords,
      extractedIssues,
      dataQualityMetrics: {
        completenessRate: 1.0,
        deduplicationRate: 0.95,
        validityRate: 0.98
      }
    };

    const input: WeeklyAnalysisReportInput = {
      analysisStartDate: baseDate,
      analysisEndDate: endDate,
      teamId: 'team_001',
      aggregatedReportData: aggregatedData,
      minimumRecordCount: 50,
      minimumDataCompleteness: 0.8
    };

    const result = generateWeeklyAnalysisReport(input);

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^report_/);
    expect(result.aggregationPeriod.startDate).toEqual(baseDate);
    expect(result.aggregationPeriod.endDate).toEqual(endDate);
    expect(result.issueRanking).toBeDefined();
    expect(Array.isArray(result.issueRanking)).toBe(true);
    expect(result.issueRanking.length).toBeGreaterThan(0);
    expect(result.priorityScores).toBeDefined();
    expect(Array.isArray(result.priorityScores)).toBe(true);
    expect(result.recommendedActions).toBeDefined();
    expect(Array.isArray(result.recommendedActions)).toBe(true);
    expect(result.colorCodedIssueList).toBeDefined();
    expect(Array.isArray(result.colorCodedIssueList)).toBe(true);
    expect(result.generatedAt).toBeInstanceOf(Date);

    const firstIssue = result.issueRanking[0];
    expect(firstIssue).toHaveProperty('issueKeyword');
    expect(firstIssue).toHaveProperty('frequency');
    expect(firstIssue).toHaveProperty('rank');
    expect(firstIssue.rank).toBe(1);

    const priorityScore = result.priorityScores[0];
    expect(priorityScore).toHaveProperty('issueKeyword');
    expect(priorityScore).toHaveProperty('frequencyScore');
    expect(priorityScore).toHaveProperty('impactScore');
    expect(priorityScore).toHaveProperty('priorityScore');
    expect(typeof priorityScore.priorityScore).toBe('number');
    expect(priorityScore.priorityScore).toBeGreaterThanOrEqual(0);
    expect(priorityScore.priorityScore).toBeLessThanOrEqual(100);

    const colorCodedIssue = result.colorCodedIssueList[0];
    expect(colorCodedIssue).toHaveProperty('issueKeyword');
    expect(colorCodedIssue).toHaveProperty('displayColor');
    expect(['red', 'yellow', 'green']).toContain(colorCodedIssue.displayColor);

    const recommendedAction = result.recommendedActions[0];
    expect(recommendedAction).toHaveProperty('actionContent');
    expect(typeof recommendedAction.actionContent).toBe('string');
    expect(recommendedAction.actionContent.length).toBeGreaterThan(0);
  });
});