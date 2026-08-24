import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern, type VisualizationGraph } from '../../src/types/tx8-agent-types';

describe('tx-8-imp-1: Bottleneck Visualization Report Generation with Duplicate Keyword Deduplication', () => {
  // SCEN-2015
  test('should deduplicate identical issue keywords and aggregate frequencies correctly in visualization report', async () => {
    // Arrange: Prepare test dataset with duplicate keywords across 10 reports
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-31T23:59:59Z';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 2;
    const recipientManagerId = 'manager-001';

    const testInput: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    // Mock raw extracted keywords with duplicates: 
    // "Database connection timeout" appears 3 times, "Network latency" appears 2 times
    const mockKeywordExtractResult = {
      'Database connection timeout': 3,
      'Network latency': 2,
      'API rate limit exceeded': 1,
      'Memory leak in service': 1,
      'SSL certificate validation failed': 1,
      'Database connection pool exhausted': 1,
    };

    // Mock raw issue data before deduplication
    const mockExtractedIssuesBeforeDedup = [
      {
        issueKeyword: 'Database connection timeout',
        occurrenceCount: 1,
        reportDate: '2024-01-05',
      },
      {
        issueKeyword: 'Database connection timeout',
        occurrenceCount: 1,
        reportDate: '2024-01-10',
      },
      {
        issueKeyword: 'Network latency',
        occurrenceCount: 1,
        reportDate: '2024-01-07',
      },
      {
        issueKeyword: 'Database connection timeout',
        occurrenceCount: 1,
        reportDate: '2024-01-15',
      },
      {
        issueKeyword: 'Network latency',
        occurrenceCount: 1,
        reportDate: '2024-01-12',
      },
      {
        issueKeyword: 'API rate limit exceeded',
        occurrenceCount: 1,
        reportDate: '2024-01-08',
      },
      {
        issueKeyword: 'Memory leak in service',
        occurrenceCount: 1,
        reportDate: '2024-01-09',
      },
      {
        issueKeyword: 'SSL certificate validation failed',
        occurrenceCount: 1,
        reportDate: '2024-01-11',
      },
      {
        issueKeyword: 'Database connection pool exhausted',
        occurrenceCount: 1,
        reportDate: '2024-01-13',
      },
    ];

    // Stub AI client for tx-8-imp-1
    const mockTx8Imp1AiClient: Tx8Imp1AiClient = {
      // Action 1: Extract keyword data with duplicates
      extractAndAggregateKeywords: async (rawReportData: any): Promise<Record<string, number>> => {
        return mockKeywordExtractResult;
      },

      // Action 2: Analyze time series patterns (deduplicate & aggregate)
      analyzeTimeSeriesPatterns: async (aggregatedKeywords: Record<string, number>): Promise<any> => {
        return {
          dedupedKeywords: aggregatedKeywords,
          timeSeriesData: Object.entries(aggregatedKeywords).map(([keyword, freq]) => ({
            keyword,
            frequency: freq,
            pattern: freq >= minimumRecurrenceThreshold ? 'recurring' : 'isolated',
          })),
        };
      },

      // Action 3: Calculate priority scores
      calculatePriorityScores: async (timeSeriesData: any): Promise<any> => {
        return timeSeriesData.map((item: any) => ({
          ...item,
          priorityScore: Math.min(item.frequency * 15, 100),
        }));
      },

      // Action 4: Generate visualization graphs
      generateVisualizationGraphs: async (priorityData: any): Promise<VisualizationGraph[]> => {
        const graphData = priorityData
          .filter((item: any) => item.pattern === 'recurring')
          .sort((a: any, b: any) => b.frequency - a.frequency);

        return [
          {
            graphType: 'bar',
            title: 'Issue Keyword Frequency Distribution',
            dataPoints: graphData.map((item: any) => ({
              keyword: item.keyword,
              frequency: item.frequency,
              priorityScore: item.priorityScore,
            })),
          },
          {
            graphType: 'line',
            title: 'Recurring Issue Trend Over Time',
            dataPoints: graphData.map((item: any, idx: number) => ({
              date: `2024-01-${String((idx + 1) * 3).padStart(2, '0')}`,
              frequency: item.frequency,
              keyword: item.keyword,
            })),
          },
        ];
      },

      // Action 5: Compile final report and send notification
      compileAndSendReport: async (
        visualizationGraphs: VisualizationGraph[],
        recurringPatterns: RecurringIssuePattern[],
        recipientId: string
      ): Promise<Tx8AgentOutput> => {
        const reportId = `report-${Date.now()}`;
        const emailSentAt = new Date().toISOString();

        return {
          reportId,
          recurringIssuePatterns: recurringPatterns,
          visualizationGraphs,
          emailSentAt,
        };
      },
    };

    // Act: Call orchestrator with prepared input and stub client
    const result = await runTx8Imp1Agent(testInput, mockTx8Imp1AiClient);

    // Assert: Verify output structure
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId).toMatch(/^report-/);

    // Assert: Verify recurring issue patterns with deduplicated keywords
    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);

    // Find deduplicated patterns for "Database connection timeout"
    const dbTimeoutPattern = result.recurringIssuePatterns.find(
      (p: RecurringIssuePattern) => p.issueKeyword === 'Database connection timeout'
    );
    expect(dbTimeoutPattern).toBeDefined();
    expect(dbTimeoutPattern?.occurrenceCount).toBe(3); // Deduplicated count: 3, not 1+1+1
    expect(dbTimeoutPattern?.priorityScore).toBe(45); // 3 * 15 = 45

    // Find deduplicated pattern for "Network latency"
    const networkLatencyPattern = result.recurringIssuePatterns.find(
      (p: RecurringIssuePattern) => p.issueKeyword === 'Network latency'
    );
    expect(networkLatencyPattern).toBeDefined();
    expect(networkLatencyPattern?.occurrenceCount).toBe(2); // Deduplicated count: 2
    expect(networkLatencyPattern?.priorityScore).toBe(30); // 2 * 15 = 30

    // Assert: Verify only recurring patterns (frequency >= minimumRecurrenceThreshold) are included
    const allOccurrenceCounts = result.recurringIssuePatterns.map(
      (p: RecurringIssuePattern) => p.occurrenceCount
    );
    allOccurrenceCounts.forEach((count: number) => {
      expect(count).toBeGreaterThanOrEqual(minimumRecurrenceThreshold);
    });

    // Assert: Verify visualization graphs generated
    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    // Find bar graph
    const barGraph = result.visualizationGraphs.find(
      (g: VisualizationGraph) => g.graphType === 'bar'
    );
    expect(barGraph).toBeDefined();
    expect(barGraph?.title).toBe('Issue Keyword Frequency Distribution');
    expect(Array.isArray(barGraph?.dataPoints)).toBe(true);

    // Assert: Verify dataPoints in bar graph contain deduplicated frequencies
    const dbTimeoutDataPoint = barGraph?.dataPoints?.find(
      (dp: any) => dp.keyword === 'Database connection timeout'
    );
    expect(dbTimeoutDataPoint).toBeDefined();
    expect(dbTimeoutDataPoint?.frequency).toBe(3); // Exact deduplicated count

    const networkLatencyDataPoint = barGraph?.dataPoints?.find(
      (dp: any) => dp.keyword === 'Network latency'
    );
    expect(networkLatencyDataPoint).toBeDefined();
    expect(networkLatencyDataPoint?.frequency).toBe(2); // Exact deduplicated count

    // Assert: Verify line graph for trend
    const lineGraph = result.visualizationGraphs.find(
      (g: VisualizationGraph) => g.graphType === 'line'
    );
    expect(lineGraph).toBeDefined();
    expect(lineGraph?.title).toBe('Recurring Issue Trend Over Time');

    // Assert: Verify email sent timestamp
    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');
    expect(new Date(result.emailSentAt).getTime()).toBeGreaterThan(0);

    // Assert: Verify no double-counting or incorrect deduplication
    const totalPatternCount = result.recurringIssuePatterns.length;
    expect(totalPatternCount).toBeLessThanOrEqual(Object.keys(mockKeywordExtractResult).length);

    // Verify time series pattern field is populated
    result.recurringIssuePatterns.forEach((pattern: RecurringIssuePattern) => {
      expect(pattern.timeSeriesPattern).toBeDefined();
      expect(['increasing', 'decreasing', 'periodic', 'spike', 'constant'].includes(
        pattern.timeSeriesPattern
      )).toBe(true);
    });
  });
});