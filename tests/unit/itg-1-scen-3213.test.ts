import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-3213
  test('should record complete audit trail from issue search to visualization report generation with all 6 actions', async () => {
    // Setup: Mock AI client with all 5 action prompts
    const mockAiClient: Tx8Imp1AiClient = {
      action01_SearchAndExtract: jest.fn().mockResolvedValue({
        issuesExtracted: 10,
        searchStartTime: '2024-01-15T09:00:00Z',
        searchEndTime: '2024-01-15T09:05:00Z',
        extractedIssueIds: [
          'issue-001', 'issue-002', 'issue-003', 'issue-004', 'issue-005',
          'issue-006', 'issue-007', 'issue-008', 'issue-009', 'issue-010'
        ]
      }),
      action02_AnalyzeTimeSeriesPattern: jest.fn().mockResolvedValue({
        patternsIdentified: 3,
        patterns: [
          { issueKeyword: 'database_delay', occurrenceCount: 5, timeSeriesPattern: 'increasing_trend' },
          { issueKeyword: 'api_timeout', occurrenceCount: 4, timeSeriesPattern: 'cyclic' },
          { issueKeyword: 'memory_leak', occurrenceCount: 3, timeSeriesPattern: 'spike' }
        ]
      }),
      action03_IdentifyBottleneckPattern: jest.fn().mockResolvedValue({
        bottleneckPatternsFound: 3,
        bottlenecks: [
          { pattern: 'db_bottleneck', severity: 'high', affectedIssueCount: 5 },
          { pattern: 'api_bottleneck', severity: 'medium', affectedIssueCount: 4 },
          { pattern: 'resource_bottleneck', severity: 'medium', affectedIssueCount: 3 }
        ]
      }),
      action04_GenerateVisualizationReport: jest.fn().mockResolvedValue({
        reportId: 'report-tx8-2024-01-15-001',
        reportFilePath: '/reports/tx8-imp-1/2024-01-15/visualization_report.pdf',
        graphTypes: ['line_chart', 'bar_chart', 'heatmap'],
        generatedAt: '2024-01-15T09:15:00Z'
      }),
      action05_HighlightPriorityIssues: jest.fn().mockResolvedValue({
        priorityIssuesCount: 4,
        highlightedIssues: [
          { issueKeyword: 'database_delay', priorityScore: 95, colorCode: 'red' },
          { issueKeyword: 'api_timeout', priorityScore: 85, colorCode: 'red' },
          { issueKeyword: 'memory_leak', priorityScore: 72, colorCode: 'yellow' },
          { issueKeyword: 'connection_pool', priorityScore: 68, colorCode: 'yellow' }
        ]
      })
    };

    // Setup: Mock audit log storage
    const auditLogs: any[] = [];
    const mockAuditLogger = {
      recordStart: jest.fn((actionName: string, executor: string, timestamp: string) => {
        const record = {
          id: `audit-${Date.now()}`,
          status: 'START',
          actionName,
          executor,
          timestamp,
          details: { stage: 'action_start' }
        };
        auditLogs.push(record);
        return record;
      }),
      recordActionComplete: jest.fn((actionName: string, processedCount: number, details: any, timestamp: string) => {
        const record = {
          id: `audit-${Date.now()}-${Math.random()}`,
          status: 'COMPLETED',
          actionName,
          processedCount,
          executor: 'SYSTEM',
          timestamp,
          details
        };
        auditLogs.push(record);
        return record;
      }),
      recordAgentComplete: jest.fn((totalTime: number, outputUrl: string, timestamp: string) => {
        const record = {
          id: `audit-${Date.now()}-final`,
          status: 'COMPLETED',
          actionName: 'AGENT_EXECUTION',
          executor: 'SYSTEM',
          timestamp,
          details: {
            totalProcessingTime: totalTime,
            reportOutputUrl: outputUrl,
            stage: 'agent_complete'
          }
        };
        auditLogs.push(record);
        return record;
      })
    };

    // Verify initial audit log is empty
    expect(auditLogs.length).toBe(0);

    // Execute: Call runTx8Imp1Agent
    const executionStartTime = '2024-01-15T09:00:00Z';
    const result = await runTx8Imp1Agent(
      {
        analysisStartDate: '2024-01-08T00:00:00Z',
        analysisEndDate: '2024-01-15T23:59:59Z',
        teamIds: ['team-001', 'team-002'],
        minimumRecurrenceThreshold: 3,
        recipientManagerId: 'manager-001'
      },
      mockAiClient,
      mockAuditLogger
    );

    // Verify: Result structure
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('recurringIssuePatterns');
    expect(result).toHaveProperty('visualizationGraphs');
    expect(result).toHaveProperty('emailSentAt');

    // Verify: Result content
    expect(result.reportId).toBe('report-tx8-2024-01-15-001');
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);
    expect(result.recurringIssuePatterns.length).toBe(3);

    // Verify: Recurring issue patterns contain expected structure
    expect(result.recurringIssuePatterns[0]).toHaveProperty('issueKeyword');
    expect(result.recurringIssuePatterns[0]).toHaveProperty('occurrenceCount');
    expect(result.recurringIssuePatterns[0]).toHaveProperty('timeSeriesPattern');
    expect(result.recurringIssuePatterns[0]).toHaveProperty('priorityScore');

    // Verify: First pattern details
    expect(result.recurringIssuePatterns[0].issueKeyword).toBe('database_delay');
    expect(result.recurringIssuePatterns[0].occurrenceCount).toBe(5);
    expect(result.recurringIssuePatterns[0].timeSeriesPattern).toBe('increasing_trend');

    // Verify: Visualization graphs
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    // Verify: Email sent timestamp
    expect(result.emailSentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Verify: Audit log records - total count should be 7
    // 1 START + 5 action COMPLETEDs + 1 agent COMPLETED
    expect(auditLogs.length).toBe(7);

    // Verify: First record is START
    expect(auditLogs[0].status).toBe('START');
    expect(auditLogs[0].actionName).toBe('action_01_search_extract');
    expect(auditLogs[0].executor).toBe('SYSTEM');
    expect(auditLogs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Verify: Timestamp ordering T1 < T2 < T3 < T4 < T5 < T6
    const timestamps = auditLogs.map(log => new Date(log.timestamp).getTime());
    for (let i = 0; i < timestamps.length - 1; i++) {
      expect(timestamps[i]).toBeLessThanOrEqual(timestamps[i + 1]);
    }

    // Verify: Action-1 completion record (record index 1)
    expect(auditLogs[1].status).toBe('COMPLETED');
    expect(auditLogs[1].actionName).toBe('action_01_search_extract');
    expect(auditLogs[1].processedCount).toBe(10);
    expect(auditLogs[1].details).toHaveProperty('extractedIssueIds');
    expect(auditLogs[1].details.extractedIssueIds.length).toBe(10);

    // Verify: Action-2 completion record (record index 2)
    expect(auditLogs[2].status).toBe('COMPLETED');
    expect(auditLogs[2].actionName).toBe('action_02_analyze_time_series');
    expect(auditLogs[2].processedCount).toBe(3);
    expect(auditLogs[2].details).toHaveProperty('patternsIdentified');

    // Verify: Action-3 completion record (record index 3)
    expect(auditLogs[3].status).toBe('COMPLETED');
    expect(auditLogs[3].actionName).toBe('action_03_identify_bottleneck');
    expect(auditLogs[3].processedCount).toBe(3);
    expect(auditLogs[3].details).toHaveProperty('bottleneckPatternsFound');

    // Verify: Action-4 completion record (record index 4)
    expect(auditLogs[4].status).toBe('COMPLETED');
    expect(auditLogs[4].actionName).toBe('action_04_generate_visualization');
    expect(auditLogs[4].details).toHaveProperty('reportFilePath');
    expect(auditLogs[4].details.reportFilePath).toMatch(/\/reports\/tx8-imp-1\//);

    // Verify: Action-5 completion record (record index 5)
    expect(auditLogs[5].status).toBe('COMPLETED');
    expect(auditLogs[5].actionName).toBe('action_05_highlight_priority');
    expect(auditLogs[5].processedCount).toBe(4);
    expect(auditLogs[5].details).toHaveProperty('highlightedIssuesCount');

    // Verify: Final agent completion record (record index 6)
    expect(auditLogs[6].status).toBe('COMPLETED');
    expect(auditLogs[6].actionName).toBe('AGENT_EXECUTION');
    expect(auditLogs[6].executor).toBe('SYSTEM');
    expect(auditLogs[6].details).toHaveProperty('totalProcessingTime');
    expect(auditLogs[6].details).toHaveProperty('reportOutputUrl');

    // Verify: All audit log records contain required fields
    for (const log of auditLogs) {
      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('status');
      expect(log).toHaveProperty('actionName');
      expect(log).toHaveProperty('executor');
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('details');
      expect(log.executor).toBe('SYSTEM');
      expect(log.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    }

    // Verify: Order sequence is exact
    const expectedSequence = [
      'START',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED'
    ];
    const actualSequence = auditLogs.map(log => log.status);
    expect(actualSequence).toEqual(expectedSequence);

    // Verify: All 10 extracted issues are referenced in audit logs
    const extractedIssueIds = auditLogs[1].details.extractedIssueIds;
    expect(extractedIssueIds).toContain('issue-001');
    expect(extractedIssueIds).toContain('issue-010');
    expect(extractedIssueIds.length).toBe(10);

    // Verify: All mock AI client methods were called
    expect(mockAiClient.action01_SearchAndExtract).toHaveBeenCalled();
    expect(mockAiClient.action02_AnalyzeTimeSeriesPattern).toHaveBeenCalled();
    expect(mockAiClient.action03_IdentifyBottleneckPattern).toHaveBeenCalled();
    expect(mockAiClient.action04_GenerateVisualizationReport).toHaveBeenCalled();
    expect(mockAiClient.action05_HighlightPriorityIssues).toHaveBeenCalled();

    // Verify: Audit logger methods were called with correct parameters
    expect(mockAuditLogger.recordStart).toHaveBeenCalled();
    expect(mockAuditLogger.recordActionComplete).toHaveBeenCalledTimes(5);
    expect(mockAuditLogger.recordAgentComplete).toHaveBeenCalledTimes(1);

    // Verify: Report output URL is present and valid
    expect(auditLogs[6].details.reportOutputUrl).toBeDefined();
    expect(auditLogs[6].details.reportOutputUrl).toMatch(/tx8-imp-1/);
  });
});