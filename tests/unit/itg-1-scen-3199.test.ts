import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-3199
  test('AIエージェントが通常案件に対して手動承認なしで朝会報告管理システムからの課題データ検索からレポート生成まで完全に自動実行される', async () => {
    const analysisStartDate = '2024-01-08T00:00:00Z';
    const analysisEndDate = '2024-01-14T23:59:59Z';
    const teamIds = ['team-001', 'team-002'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const mockIssueData = [
      {
        id: 'issue-001',
        keyword: 'database-connection',
        occurrenceCount: 5,
        firstOccurrenceDate: '2024-01-08T09:00:00Z',
        lastOccurrenceDate: '2024-01-12T14:30:00Z',
        impactScore: 85,
        affectedTeams: ['team-001', 'team-002'],
      },
      {
        id: 'issue-002',
        keyword: 'api-timeout',
        occurrenceCount: 4,
        firstOccurrenceDate: '2024-01-09T10:15:00Z',
        lastOccurrenceDate: '2024-01-13T11:00:00Z',
        impactScore: 72,
        affectedTeams: ['team-001'],
      },
      {
        id: 'issue-003',
        keyword: 'memory-leak',
        occurrenceCount: 6,
        firstOccurrenceDate: '2024-01-08T08:00:00Z',
        lastOccurrenceDate: '2024-01-14T16:45:00Z',
        impactScore: 90,
        affectedTeams: ['team-002'],
      },
      {
        id: 'issue-004',
        keyword: 'cache-invalidation',
        occurrenceCount: 3,
        firstOccurrenceDate: '2024-01-10T12:30:00Z',
        lastOccurrenceDate: '2024-01-12T09:15:00Z',
        impactScore: 65,
        affectedTeams: ['team-001'],
      },
      {
        id: 'issue-005',
        keyword: 'deployment-failure',
        occurrenceCount: 5,
        firstOccurrenceDate: '2024-01-08T13:00:00Z',
        lastOccurrenceDate: '2024-01-13T15:30:00Z',
        impactScore: 88,
        affectedTeams: ['team-001', 'team-002'],
      },
      {
        id: 'issue-006',
        keyword: 'sql-injection-risk',
        occurrenceCount: 4,
        firstOccurrenceDate: '2024-01-09T14:20:00Z',
        lastOccurrenceDate: '2024-01-12T10:45:00Z',
        impactScore: 95,
        affectedTeams: ['team-001'],
      },
      {
        id: 'issue-007',
        keyword: 'performance-degradation',
        occurrenceCount: 7,
        firstOccurrenceDate: '2024-01-08T11:00:00Z',
        lastOccurrenceDate: '2024-01-14T14:15:00Z',
        impactScore: 78,
        affectedTeams: ['team-002'],
      },
      {
        id: 'issue-008',
        keyword: 'authentication-failure',
        occurrenceCount: 3,
        firstOccurrenceDate: '2024-01-11T09:30:00Z',
        lastOccurrenceDate: '2024-01-13T16:00:00Z',
        impactScore: 70,
        affectedTeams: ['team-001'],
      },
      {
        id: 'issue-009',
        keyword: 'data-consistency',
        occurrenceCount: 5,
        firstOccurrenceDate: '2024-01-09T15:45:00Z',
        lastOccurrenceDate: '2024-01-14T10:30:00Z',
        impactScore: 82,
        affectedTeams: ['team-001', 'team-002'],
      },
      {
        id: 'issue-010',
        keyword: 'logging-overhead',
        occurrenceCount: 3,
        firstOccurrenceDate: '2024-01-10T13:15:00Z',
        lastOccurrenceDate: '2024-01-12T14:00:00Z',
        impactScore: 58,
        affectedTeams: ['team-002'],
      },
      {
        id: 'issue-011',
        keyword: 'network-latency',
        occurrenceCount: 4,
        firstOccurrenceDate: '2024-01-08T16:30:00Z',
        lastOccurrenceDate: '2024-01-13T12:45:00Z',
        impactScore: 75,
        affectedTeams: ['team-001', 'team-002'],
      },
    ];

    const mockRecurringPatterns = [
      {
        issueKeyword: 'database-connection',
        occurrenceCount: 5,
        timeSeriesPattern: 'steady-increase',
        priorityScore: 85,
        datePoints: [
          { date: '2024-01-08', count: 1 },
          { date: '2024-01-09', count: 1 },
          { date: '2024-01-10', count: 1 },
          { date: '2024-01-11', count: 1 },
          { date: '2024-01-12', count: 1 },
        ],
      },
      {
        issueKeyword: 'memory-leak',
        occurrenceCount: 6,
        timeSeriesPattern: 'exponential-growth',
        priorityScore: 90,
        datePoints: [
          { date: '2024-01-08', count: 1 },
          { date: '2024-01-09', count: 1 },
          { date: '2024-01-10', count: 1 },
          { date: '2024-01-11', count: 1 },
          { date: '2024-01-12', count: 1 },
          { date: '2024-01-14', count: 1 },
        ],
      },
      {
        issueKeyword: 'performance-degradation',
        occurrenceCount: 7,
        timeSeriesPattern: 'cyclical',
        priorityScore: 78,
        datePoints: [
          { date: '2024-01-08', count: 1 },
          { date: '2024-01-09', count: 1 },
          { date: '2024-01-10', count: 1 },
          { date: '2024-01-11', count: 1 },
          { date: '2024-01-12', count: 1 },
          { date: '2024-01-13', count: 1 },
          { date: '2024-01-14', count: 1 },
        ],
      },
    ];

    const mockVisualizationGraphs = [
      {
        graphType: 'line-chart',
        title: 'Issue Occurrence Trend Over Time',
        dataPoints: [
          {
            date: '2024-01-08',
            'database-connection': 1,
            'memory-leak': 1,
            'performance-degradation': 1,
          },
          {
            date: '2024-01-09',
            'database-connection': 1,
            'memory-leak': 1,
            'performance-degradation': 1,
          },
          {
            date: '2024-01-10',
            'database-connection': 1,
            'memory-leak': 1,
            'performance-degradation': 1,
          },
          {
            date: '2024-01-11',
            'database-connection': 1,
            'memory-leak': 1,
            'performance-degradation': 1,
          },
          {
            date: '2024-01-12',
            'database-connection': 1,
            'memory-leak': 1,
            'performance-degradation': 1,
          },
          {
            date: '2024-01-13',
            'database-connection': 0,
            'memory-leak': 0,
            'performance-degradation': 1,
          },
          {
            date: '2024-01-14',
            'database-connection': 0,
            'memory-leak': 1,
            'performance-degradation': 1,
          },
        ],
      },
      {
        graphType: 'bar-chart',
        title: 'Issue Frequency Ranking',
        dataPoints: [
          { issueKeyword: 'performance-degradation', count: 7, priority: 'high' },
          { issueKeyword: 'memory-leak', count: 6, priority: 'critical' },
          { issueKeyword: 'database-connection', count: 5, priority: 'high' },
          { issueKeyword: 'deployment-failure', count: 5, priority: 'high' },
          { issueKeyword: 'data-consistency', count: 5, priority: 'high' },
        ],
      },
      {
        graphType: 'heatmap',
        title: 'Issue Impact by Team and Time',
        dataPoints: [
          {
            team: 'team-001',
            'database-connection': 85,
            'api-timeout': 72,
            'cache-invalidation': 65,
          },
          {
            team: 'team-002',
            'memory-leak': 90,
            'performance-degradation': 78,
            'logging-overhead': 58,
          },
        ],
      },
    ];

    let action1Called = false;
    let action2Called = false;
    let action3Called = false;
    let action4Called = false;
    let action5Called = false;

    const mockAiClient: Tx8Imp1AiClient = {
      executeAction1SearchAndExtract: async (_input) => {
        action1Called = true;
        return {
          extractedIssues: mockIssueData,
          totalCount: mockIssueData.length,
          extractionTimestamp: '2024-01-15T09:00:00Z',
        };
      },

      executeAction2TimeSeriesAnalysis: async (_input) => {
        action2Called = true;
        return {
          recurringPatterns: mockRecurringPatterns,
          analysisTimestamp: '2024-01-15T09:05:00Z',
        };
      },

      executeAction3BottleneckPattern: async (_input) => {
        action3Called = true;
        return {
          bottleneckPatterns: [
            {
              pattern: 'steady-increase',
              affectedIssues: ['database-connection'],
              severity: 'medium',
            },
            {
              pattern: 'exponential-growth',
              affectedIssues: ['memory-leak'],
              severity: 'critical',
            },
            {
              pattern: 'cyclical',
              affectedIssues: ['performance-degradation'],
              severity: 'high',
            },
          ],
          patternTimestamp: '2024-01-15T09:10:00Z',
        };
      },

      executeAction4GenerateVisualization: async (_input) => {
        action4Called = true;
        return {
          visualizationGraphs: mockVisualizationGraphs,
          generationTimestamp: '2024-01-15T09:15:00Z',
        };
      },

      executeAction5HighlightPriority: async (_input) => {
        action5Called = true;
        return {
          highlightedIssues: [
            {
              issueKeyword: 'memory-leak',
              priorityScore: 90,
              highlight: 'critical-red',
            },
            {
              issueKeyword: 'sql-injection-risk',
              priorityScore: 95,
              highlight: 'critical-red',
            },
            {
              issueKeyword: 'database-connection',
              priorityScore: 85,
              highlight: 'high-orange',
            },
            {
              issueKeyword: 'deployment-failure',
              priorityScore: 88,
              highlight: 'high-orange',
            },
          ],
          highlightTimestamp: '2024-01-15T09:20:00Z',
        };
      },
    };

    const auditLog: Array<{
      action: string;
      timestamp: string;
      inputDataCount?: number;
      outputId?: string;
    }> = [];

    const mockAuditLogger = (
      action: string,
      timestamp: string,
      inputDataCount?: number,
      outputId?: string
    ) => {
      auditLog.push({
        action,
        timestamp,
        inputDataCount,
        outputId,
      });
    };

    const result = await runTx8Imp1Agent(
      {
        analysisStartDate,
        analysisEndDate,
        teamIds,
        minimumRecurrenceThreshold,
        recipientManagerId,
      },
      mockAiClient,
      mockAuditLogger
    );

    expect(action1Called).toBe(true);
    expect(action2Called).toBe(true);
    expect(action3Called).toBe(true);
    expect(action4Called).toBe(true);
    expect(action5Called).toBe(true);

    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^report-tx8-/);

    expect(result.recurringIssuePatterns).toEqual(mockRecurringPatterns);
    expect(result.recurringIssuePatterns.length).toBe(3);

    expect(result.recurringIssuePatterns[0]).toEqual({
      issueKeyword: 'database-connection',
      occurrenceCount: 5,
      timeSeriesPattern: 'steady-increase',
      priorityScore: 85,
      datePoints: expect.arrayContaining([
        expect.objectContaining({ date: '2024-01-08', count: 1 }),
      ]),
    });

    expect(result.recurringIssuePatterns[1]).toEqual({
      issueKeyword: 'memory-leak',
      occurrenceCount: 6,
      timeSeriesPattern: 'exponential-growth',
      priorityScore: 90,
      datePoints: expect.arrayContaining([
        expect.objectContaining({ date: '2024-01-08', count: 1 }),
      ]),
    });

    expect(result.recurringIssuePatterns[2]).toEqual({
      issueKeyword: 'performance-degradation',
      occurrenceCount: 7,
      timeSeriesPattern: 'cyclical',
      priorityScore: 78,
      datePoints: expect.arrayContaining([
        expect.objectContaining({ date: '2024-01-08', count: 1 }),
      ]),
    });

    expect(result.visualizationGraphs).toEqual(mockVisualizationGraphs);
    expect(result.visualizationGraphs.length).toBe(3);

    expect(result.visualizationGraphs[0]).toEqual({
      graphType: 'line-chart',
      title: 'Issue Occurrence Trend Over Time',
      dataPoints: expect.any(Array),
    });

    expect(result.visualizationGraphs[0].dataPoints.length).toBe(7);

    expect(result.visualizationGraphs[1]).toEqual({
      graphType: 'bar-chart',
      title: 'Issue Frequency Ranking',
      dataPoints: expect.any(Array),
    });

    expect(result.visualizationGraphs[2]).toEqual({
      graphType: 'heatmap',
      title: 'Issue Impact by Team and Time',
      dataPoints: expect.any(Array),
    });

    expect(result.emailSentAt).toBeDefined();
    expect(result.emailSentAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    expect(auditLog.length).toBeGreaterThanOrEqual(5);

    expect(auditLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'action-01-search-extract',
          timestamp: '2024-01-15T09:00:00Z',
          inputDataCount: 11,
        }),
        expect.objectContaining({
          action: 'action-02-time-series-analysis',
          timestamp: '2024-01-15T09:05:00Z',
        }),
        expect.objectContaining({
          action: 'action-03-bottleneck-pattern',
          timestamp: '2024-01-15T09:10:00Z',
        }),
        expect.objectContaining({
          action: 'action-04-generate-visualization',
          timestamp: '2024-01-15T09:15:00Z',
        }),
        expect.objectContaining({
          action: 'action-05-highlight-priority',
          timestamp: '2024-01-15T09:20:00Z',
        }),
      ])
    );

    expect(auditLog[0].inputDataCount).toBe(11);
    expect(auditLog[auditLog.length - 1].outputId).toBe(result.reportId);
  });
});