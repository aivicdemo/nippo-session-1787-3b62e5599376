import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-analysis-report';
import type { WeeklyAnalysisReportInput, WeeklyAnalysisReport } from '../../src/logic/weekly-analysis-report';

describe('generateWeeklyAnalysisReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-436
  test('should generate weekly analysis report when valid record count is 80-90% of minimum threshold', async () => {
    const teamId = 'team-001';
    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-14T23:59:59Z');
    const minimumReportThreshold = 50;

    const fullyCompleteRecords = Array.from({ length: 40 }, (_, i) => ({
      reportId: `report-${i + 1}`,
      employeeId: `emp-${(i % 10) + 1}`,
      reportDate: new Date(`2024-01-${8 + Math.floor(i / 8)}`),
      yesterday: `Completed task ${i + 1}`,
      today: `Planned task ${i + 1}`,
      issue: `Issue encountered in task ${i + 1}`,
      submittedAt: new Date(`2024-01-${8 + Math.floor(i / 8)}T09:00:00Z`),
    }));

    const incompleteRecords = Array.from({ length: 5 }, (_, i) => ({
      reportId: `report-incomplete-${i + 1}`,
      employeeId: `emp-${(i % 10) + 1}`,
      reportDate: new Date(`2024-01-${10 + i}`),
      yesterday: i % 2 === 0 ? '' : `Partial task ${i + 1}`,
      today: '',
      issue: i % 2 === 0 ? `Partial issue ${i + 1}` : '',
      submittedAt: new Date(`2024-01-${10 + i}T10:00:00Z`),
    }));

    const allReports = [...fullyCompleteRecords, ...incompleteRecords];

    const completenessScores = allReports.map((record) => {
      const fieldCount = [record.yesterday, record.today, record.issue].filter(
        (field) => field != null && field.trim() !== ''
      ).length;
      return fieldCount / 3;
    });

    const averageCompleteness = completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length;
    expect(averageCompleteness).toBeGreaterThanOrEqual(0.8);

    const validRecordCount = fullyCompleteRecords.length;
    const recordThresholdPercentage = (validRecordCount / minimumReportThreshold) * 100;
    expect(recordThresholdPercentage).toBeGreaterThanOrEqual(80);
    expect(recordThresholdPercentage).toBeLessThan(90);

    const input: WeeklyAnalysisReportInput = {
      analysisStartDate,
      analysisEndDate,
      teamId,
      aggregatedReportData: {
        reportRecords: allReports,
        extractedIssues: [
          {
            issueId: 'issue-1',
            issueKeyword: 'バグ',
            occurrenceCount: 8,
            affectedMemberCount: 4,
            reportedDate: new Date('2024-01-10'),
          },
          {
            issueId: 'issue-2',
            issueKeyword: '遅延',
            occurrenceCount: 5,
            affectedMemberCount: 3,
            reportedDate: new Date('2024-01-11'),
          },
        ],
        dataQualityMetrics: {
          completenessRate: averageCompleteness,
          deduplicationRate: 0.95,
          validityRate: 0.9,
        },
      },
      minimumReportThreshold,
    };

    const report = await generateWeeklyAnalysisReport(input);

    expect(report).toBeDefined();
    expect(report.reportId).toBeDefined();
    expect(typeof report.reportId).toBe('string');
    expect(report.reportId.length).toBeGreaterThan(0);

    expect(report.aggregationPeriod).toBeDefined();
    expect(report.aggregationPeriod.startDate).toEqual(analysisStartDate);
    expect(report.aggregationPeriod.endDate).toEqual(analysisEndDate);

    expect(Array.isArray(report.issueRanking)).toBe(true);

    expect(Array.isArray(report.priorityScores)).toBe(true);
    report.priorityScores.forEach((scoreItem) => {
      expect(typeof scoreItem.priorityScore).toBe('number');
      expect(scoreItem.priorityScore).toBeGreaterThanOrEqual(0);
      expect(scoreItem.priorityScore).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low']).toContain(scoreItem.priorityRank);
    });

    expect(Array.isArray(report.recommendedActions)).toBe(true);

    expect(Array.isArray(report.colorCodedIssueList)).toBe(true);
    report.colorCodedIssueList.forEach((colorItem) => {
      expect(['red', 'yellow', 'green']).toContain(colorItem.displayColor);
    });

    expect(report.generatedAt).toBeInstanceOf(Date);
    expect(report.generatedAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });
});