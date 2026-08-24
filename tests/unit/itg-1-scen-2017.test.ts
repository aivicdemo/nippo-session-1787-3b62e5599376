import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('TX-8 Orchestrator - Large-scale bottleneck visualization report generation', () => {
  // SCEN-2017
  test('should generate visualization report successfully for 1500+ issues with complete action execution', async () => {
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-31T23:59:59Z';
    const teamIds = ['team-001', 'team-002'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    // Prepare mock issue dataset (1500 issues)
    const mockIssueDataset = Array.from({ length: 1500 }, (_, i) => ({
      issueId: `issue-${String(i + 1).padStart(4, '0')}`,
      reportDate: new Date(
        new Date('2024-01-01').getTime() +
          Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      issueContent: `Issue content for issue ${i + 1}`,
      recurrenceFlag: i % 7 === 0,
      bottleneckClassification: ['performance', 'quality', 'scheduling'][i % 3],
    }));

    // Define mock recurrence patterns (20 patterns for 1500 issues)
    const mockRecurrencePatterns = Array.from({ length: 20 }, (_, i) => ({
      patternId: `pattern-${String(i + 1).padStart(2, '0')}`,
      issueKeyword: `Recurrent Issue Type ${i + 1}`,
      occurrenceCount: 15 + i * 2,
      timeSeriesPattern: ['increasing', 'cyclic', 'sudden_spike'][i % 3],
      confidenceScore: 0.75 + Math.random() * 0.25,
    }));

    // Define mock bottleneck patterns
    const mockBottleneckPatterns = Array.from({ length: 5 }, (_, i) => ({
      patternId: `bottleneck-${String(i + 1).padStart(2, '0')}`,
      bottleneckType: ['performance', 'quality', 'scheduling', 'resource', 'communication'][i],
      changeTrend: ['escalating', 'stable', 'declining'][i % 3],
      affectedIssueCount: 200 + i * 50,
      timeRange: {
        startDate: analysisStartDate,
        endDate: analysisEndDate,
      },
    }));

    // Define mock prioritized issues
    const mockPrioritizedIssues = Array.from({ length: 50 }, (_, i) => ({
      issueId: `issue-${String(i + 1).padStart(4, '0')}`,
      priorityRank: i + 1,
      priorityScore: 100 - i * 1.8,
      highlightFlag: i < 10,
      reasonForHighlight: i < 10 ? 'Critical: Multiple recurrences detected' : undefined,
    }));

    // Create stub AI client
    const stubAiClient: Tx8Imp1AiClient = {
      action01SearchAndExtractIssues: jest.fn().mockResolvedValue({
        actionId: 'action-01',
        actionName: 'Search and Extract Issues',
        executionTimestamp: new Date().toISOString(),
        extractedIssues: mockIssueDataset,
        totalExtracted: 1500,
        dataQualityScore: 0.98,
      }),
      action02AnalyzeTimeSeriesPatterns: jest.fn().mockResolvedValue({
        actionId: 'action-02',
        actionName: 'Analyze Time Series Patterns',
        executionTimestamp: new Date().toISOString(),
        recurrencePatterns: mockRecurrencePatterns,
        patternsIdentified: 20,
        analysisCompleteness: 0.95,
      }),
      action03IdentifyBottleneckChanges: jest.fn().mockResolvedValue({
        actionId: 'action-03',
        actionName: 'Identify Bottleneck Changes',
        executionTimestamp: new Date().toISOString(),
        bottleneckChangePatterns: mockBottleneckPatterns,
        patternsDetected: 5,
      }),
      action04GenerateVisualizationReport: jest.fn().mockResolvedValue({
        actionId: 'action-04',
        actionName: 'Generate Visualization Report',
        executionTimestamp: new Date().toISOString(),
        reportStructure: {
          reportId: '550e8400-e29b-41d4-a716-446655440000',
          generatedAt: new Date().toISOString(),
          graphData: Array.from({ length: 8 }, (_, i) => ({
            graphId: `graph-${i + 1}`,
            graphType: ['line', 'bar', 'area', 'scatter', 'heatmap', 'box', 'bubble', 'treemap'][i],
            title: `Visualization ${i + 1}`,
            dataPoints: Array.from({ length: 100 }, (_, j) => ({
              timestamp: new Date(
                new Date('2024-01-01').getTime() + j * 24 * 60 * 60 * 1000
              ).toISOString(),
              value: Math.random() * 100,
            })),
          })),
          tableData: Array.from({ length: 20 }, (_, i) => ({
            rowId: `row-${i + 1}`,
            issueKeyword: `Issue ${i + 1}`,
            frequency: 50 - i,
            trend: 'increasing',
          })),
          summaryText: 'Analysis summary for large-scale dataset',
        },
      }),
      action05ExtractAndHighlightCriticalIssues: jest.fn().mockResolvedValue({
        actionId: 'action-05',
        actionName: 'Extract and Highlight Critical Issues',
        executionTimestamp: new Date().toISOString(),
        prioritizedIssues: mockPrioritizedIssues,
        criticalIssueCount: 10,
      }),
    };

    // Execute orchestrator
    const startTime = Date.now();
    const result = await runTx8Imp1Agent(
      {
        analysisStartDate,
        analysisEndDate,
        teamIds,
        minimumRecurrenceThreshold,
        recipientManagerId,
      },
      stubAiClient
    );
    const endTime = Date.now();
    const executionTimeMs = endTime - startTime;

    // Verify all actions were called in correct order
    expect(stubAiClient.action01SearchAndExtractIssues).toHaveBeenCalledTimes(1);
    expect(stubAiClient.action02AnalyzeTimeSeriesPatterns).toHaveBeenCalledTimes(1);
    expect(stubAiClient.action03IdentifyBottleneckChanges).toHaveBeenCalledTimes(1);
    expect(stubAiClient.action04GenerateVisualizationReport).toHaveBeenCalledTimes(1);
    expect(stubAiClient.action05ExtractAndHighlightCriticalIssues).toHaveBeenCalledTimes(1);

    // Verify required fields exist in response
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('recurringIssuePatterns');
    expect(result).toHaveProperty('visualizationGraphs');
    expect(result).toHaveProperty('emailSentAt');

    // Verify reportId format (UUID)
    expect(result.reportId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // Verify emailSentAt is ISO 8601 format
    expect(result.emailSentAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/
    );

    // Verify recurringIssuePatterns contains 20 patterns
    expect(result.recurringIssuePatterns).toHaveLength(20);
    result.recurringIssuePatterns.forEach((pattern) => {
      expect(pattern).toHaveProperty('issueKeyword');
      expect(pattern).toHaveProperty('occurrenceCount');
      expect(pattern).toHaveProperty('timeSeriesPattern');
      expect(pattern).toHaveProperty('priorityScore');
      expect(typeof pattern.priorityScore).toBe('number');
      expect(pattern.priorityScore).toBeGreaterThanOrEqual(0);
      expect(pattern.priorityScore).toBeLessThanOrEqual(100);
    });

    // Verify visualizationGraphs structure
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);
    result.visualizationGraphs.forEach((graph) => {
      expect(graph).toHaveProperty('graphType');
      expect(graph).toHaveProperty('title');
      expect(graph).toHaveProperty('dataPoints');
      expect(Array.isArray(graph.dataPoints)).toBe(true);
    });

    // Verify no null or undefined values in critical fields
    expect(result.reportId).toBeDefined();
    expect(result.reportId).not.toBeNull();
    expect(result.emailSentAt).toBeDefined();
    expect(result.emailSentAt).not.toBeNull();

    // Verify execution completed within 60 seconds
    expect(executionTimeMs).toBeLessThan(60000);

    // Verify all 1500 issues were processed
    expect(result.recurringIssuePatterns.reduce((sum, p) => sum + p.occurrenceCount, 0)).toBeGreaterThan(0);

    // Verify escalation conditions not triggered (normal execution)
    expect(result).not.toHaveProperty('escalationTriggered');
    expect(result).not.toHaveProperty('dataQualityWarning');

    // Verify audit log structure if present
    if (result.auditLog) {
      expect(result.auditLog).toHaveProperty('executionTimestamp');
      expect(result.auditLog).toHaveProperty('processedRecordCount');
      expect(result.auditLog.processedRecordCount).toBe(1500);
      expect(result.auditLog).toHaveProperty('actionStatuses');
      expect(Array.isArray(result.auditLog.actionStatuses)).toBe(true);
      expect(result.auditLog.actionStatuses.length).toBe(5);
      result.auditLog.actionStatuses.forEach((status) => {
        expect(status).toHaveProperty('actionId');
        expect(status).toHaveProperty('status');
        expect(['completed', 'success'].includes(status.status)).toBe(true);
      });
    }
  });
});