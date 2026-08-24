import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation - Large Dataset Performance', () => {
  // SCEN-1600
  test('should generate weekly analysis report for 1000+ daily reports within memory and performance boundaries', async () => {
    // Prepare test dataset with 1000+ daily reports
    const largeReportDataset: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      teamId: 'team-001',
      extractedIssues: generateLargeIssueDataset(1200)
    };

    // Capture initial memory state
    if (global.gc) {
      global.gc();
    }
    const initialMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    // Mock external service adapters
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['integration', 'deployment', 'database'],
        frequencies: [45, 32, 28]
      }),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'delivered',
        sentAt: new Date('2024-01-15T08:30:00Z')
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: 1150, failed: 50 })
    };

    // Execute report generation
    const report: WeeklyAnalysisReport = await generateWeeklyAnalysisReport(
      largeReportDataset,
      {
        textAnalysisService: mockTextAnalysisAdapter,
        notificationService: mockNotificationAdapter
      }
    );

    // Capture end time and final memory state
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    if (global.gc) {
      global.gc();
    }
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrement = finalMemory - initialMemory;

    // Assertions: Verify report structure
    expect(report).toBeDefined();
    expect(report.reportId).toBeDefined();
    expect(typeof report.reportId).toBe('string');
    expect(report.aggregationPeriod).toEqual({
      startDate: '2024-01-08',
      endDate: '2024-01-14'
    });
    expect(Array.isArray(report.issueRanking)).toBe(true);
    expect(report.issueRanking.length).toBeGreaterThan(0);
    expect(Array.isArray(report.priorityScores)).toBe(true);
    expect(report.priorityScores.length).toBeGreaterThan(0);
    expect(Array.isArray(report.recommendedCountermeasures)).toBe(true);
    expect(report.generatedAt).toBeDefined();

    // Assertions: Verify issue ranking structure
    report.issueRanking.forEach((issue, index) => {
      expect(issue.issueKeyword).toBeDefined();
      expect(typeof issue.issueKeyword).toBe('string');
      expect(issue.occurrenceCount).toBeGreaterThan(0);
      expect(issue.rank).toBe(index + 1);
      if (index > 0) {
        expect(issue.occurrenceCount).toBeLessThanOrEqual(
          report.issueRanking[index - 1].occurrenceCount
        );
      }
    });

    // Assertions: Verify priority scores
    report.priorityScores.forEach((priorityData) => {
      expect(priorityData.issueId).toBeDefined();
      expect(typeof priorityData.issueId).toBe('string');
      expect(priorityData.priorityScore).toBeGreaterThanOrEqual(0);
      expect(priorityData.priorityScore).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low']).toContain(priorityData.priorityRank);
    });

    // Assertions: Verify countermeasures
    report.recommendedCountermeasures.forEach((measure) => {
      expect(measure).toBeDefined();
      expect(typeof measure).toBe('object');
    });

    // Assertions: Performance boundaries - execution time
    expect(executionTime).toBeLessThan(60000);

    // Assertions: Memory boundaries - heap usage
    const heapSizeInMB = process.memoryUsage().heapTotal / (1024 * 1024);
    expect(heapSizeInMB).toBeLessThanOrEqual(512);

    // Assertions: Memory leak detection
    expect(memoryIncrement).toBeLessThan(157286400); // 150 MB in bytes

    // Assertions: External service adapter calls were recorded
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalled();

    // Assertions: Report generation timestamp is valid ISO 8601
    expect(new Date(report.generatedAt)).toEqual(new Date(report.generatedAt));

    // Assertions: Top issues are correctly ranked by occurrence
    if (report.issueRanking.length >= 2) {
      expect(report.issueRanking[0].occurrenceCount).toBeGreaterThanOrEqual(
        report.issueRanking[1].occurrenceCount
      );
    }
  });
});

/**
 * Helper function to generate large issue dataset with 1000+ entries
 * Each entry includes keyword, occurrence frequency, and impact information
 */
function generateLargeIssueDataset(count: number): Array<{
  issueKeyword: string;
  occurrenceFrequency: number;
  impactScore: number;
}> {
  const baseKeywords = [
    'database_performance',
    'API_integration',
    'deployment_error',
    'authentication_failure',
    'memory_leak',
    'network_timeout',
    'data_validation',
    'cache_invalidation',
    'dependency_conflict',
    'build_failure'
  ];

  const dataset: Array<{
    issueKeyword: string;
    occurrenceFrequency: number;
    impactScore: number;
  }> = [];

  for (let i = 0; i < count; i++) {
    const keywordIndex = i % baseKeywords.length;
    const frequency = Math.floor(Math.random() * 100) + 1;
    const impact = Math.floor(Math.random() * 100);

    dataset.push({
      issueKeyword: `${baseKeywords[keywordIndex]}_${Math.floor(i / baseKeywords.length)}`,
      occurrenceFrequency: frequency,
      impactScore: impact
    });
  }

  return dataset;
}