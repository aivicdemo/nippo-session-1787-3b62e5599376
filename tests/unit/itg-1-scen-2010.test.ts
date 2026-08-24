import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1 orchestrator', () => {
  // SCEN-2010: [edge] ボトルネック変化パターン可視化レポート生成機能 - 影響度スコアが閾値超過（51/100）のとき、ボトルネック重大と判定される
  test('should mark bottleneck as CRITICAL when impact score exceeds 50', async () => {
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-31T23:59:59Z';
    const teamIds = ['team-001', 'team-002'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const mockIssueDataset = [
      {
        issueId: 'issue-001',
        issueKeyword: 'database_slowdown',
        occurrenceCount: 5,
        firstOccurrenceDate: '2024-01-15T09:30:00Z',
        lastOccurrenceDate: '2024-01-28T14:20:00Z',
        affectedTeams: ['team-001', 'team-002'],
        description: 'Database query performance degradation affecting multiple services',
        impactScore: 51
      },
      {
        issueId: 'issue-002',
        issueKeyword: 'api_timeout',
        occurrenceCount: 4,
        firstOccurrenceDate: '2024-01-10T10:15:00Z',
        lastOccurrenceDate: '2024-01-25T16:45:00Z',
        affectedTeams: ['team-001'],
        description: 'API gateway timeout issues',
        impactScore: 35
      },
      {
        issueId: 'issue-003',
        issueKeyword: 'deployment_failure',
        occurrenceCount: 2,
        firstOccurrenceDate: '2024-01-20T11:00:00Z',
        lastOccurrenceDate: '2024-01-22T15:30:00Z',
        affectedTeams: ['team-002'],
        description: 'Deployment pipeline failures',
        impactScore: 25
      }
    ];

    const mockTimeSeriesAnalysis = {
      pattern: 'escalating_trend',
      dayCount: 30,
      peakOccurrenceDate: '2024-01-28T14:20:00Z',
      frequencyPerWeek: 2.5,
      volatilityScore: 0.72
    };

    const mockBottleneckPatterns = [
      {
        keyword: 'database_slowdown',
        severity: 'CRITICAL',
        impactScore: 51,
        trend: 'increasing',
        affectedTeamCount: 2,
        weeklyOccurrence: 2.5
      },
      {
        keyword: 'api_timeout',
        severity: 'HIGH',
        impactScore: 35,
        trend: 'stable',
        affectedTeamCount: 1,
        weeklyOccurrence: 1.3
      }
    ];

    const mockVisualizationReport = {
      reportId: 'report-20240131-001',
      generatedAt: '2024-01-31T09:00:00Z',
      analysisStartDate: analysisStartDate,
      analysisEndDate: analysisEndDate,
      severityMetadata: {
        bottleneckLevel: 'CRITICAL',
        criticalIssueCount: 1,
        highIssueCount: 1,
        mediumIssueCount: 0
      },
      recurringIssuePatterns: [
        {
          issueKeyword: 'database_slowdown',
          occurrenceCount: 5,
          timeSeriesPattern: 'increasing',
          priorityScore: 51,
          bottleneckSeverity: 'CRITICAL',
          priorityFlag: true,
          displayColor: 'red',
          displayStyle: 'bold'
        },
        {
          issueKeyword: 'api_timeout',
          occurrenceCount: 4,
          timeSeriesPattern: 'stable',
          priorityScore: 35,
          bottleneckSeverity: 'HIGH',
          priorityFlag: false,
          displayColor: 'yellow',
          displayStyle: 'normal'
        }
      ],
      visualizationGraphs: [
        {
          graphType: 'line',
          title: 'Issue Frequency Trend (30 days)',
          dataPoints: [
            { date: '2024-01-15', database_slowdown: 1, api_timeout: 0 },
            { date: '2024-01-20', database_slowdown: 2, api_timeout: 1 },
            { date: '2024-01-25', database_slowdown: 1, api_timeout: 2 },
            { date: '2024-01-28', database_slowdown: 1, api_timeout: 1 }
          ]
        },
        {
          graphType: 'bar',
          title: 'Impact Score Distribution',
          dataPoints: [
            { keyword: 'database_slowdown', score: 51 },
            { keyword: 'api_timeout', score: 35 },
            { keyword: 'deployment_failure', score: 25 }
          ]
        }
      ],
      emailSentAt: '2024-01-31T09:15:00Z'
    };

    const mockAiClient: Tx8Imp1AiClient = {
      action01_searchAndExtractIssueData: async () => ({
        success: true,
        issueDataset: mockIssueDataset,
        totalIssueCount: mockIssueDataset.length,
        analysisScope: {
          startDate: analysisStartDate,
          endDate: analysisEndDate,
          teams: teamIds
        }
      }),
      action02_analyzeRecurringPatterns: async () => ({
        success: true,
        timeSeriesAnalysis: mockTimeSeriesAnalysis,
        matchedHistoricalPatterns: 2,
        confidenceScore: 0.85
      }),
      action03_identifyBottleneckPatterns: async () => ({
        success: true,
        bottleneckPatterns: mockBottleneckPatterns,
        criticalPatternCount: 1,
        escalationRequired: true
      }),
      action04_generateVisualizationReport: async () => ({
        success: true,
        report: mockVisualizationReport
      }),
      action05_extractAndHighlightPriorityIssues: async () => ({
        success: true,
        priorityIssues: [
          {
            keyword: 'database_slowdown',
            priority: 'HIGH',
            highlighted: true,
            color: 'red'
          }
        ],
        highlightedCount: 1
      })
    };

    const result = await runTx8Imp1Agent(
      {
        analysisStartDate,
        analysisEndDate,
        teamIds,
        minimumRecurrenceThreshold,
        recipientManagerId
      },
      mockAiClient
    );

    expect(result.reportId).toBe('report-20240131-001');
    expect(result.recurringIssuePatterns).toHaveLength(2);

    const criticalIssue = result.recurringIssuePatterns[0];
    expect(criticalIssue.issueKeyword).toBe('database_slowdown');
    expect(criticalIssue.priorityScore).toBe(51);
    expect(criticalIssue.timeSeriesPattern).toBe('increasing');

    const highIssue = result.recurringIssuePatterns[1];
    expect(highIssue.issueKeyword).toBe('api_timeout');
    expect(highIssue.priorityScore).toBe(35);

    expect(result.visualizationGraphs).toHaveLength(2);
    const lineGraph = result.visualizationGraphs[0];
    expect(lineGraph.graphType).toBe('line');
    expect(lineGraph.title).toBe('Issue Frequency Trend (30 days)');
    expect(lineGraph.dataPoints).toHaveLength(4);

    const barGraph = result.visualizationGraphs[1];
    expect(barGraph.graphType).toBe('bar');
    expect(barGraph.title).toBe('Impact Score Distribution');

    expect(result.emailSentAt).toBe('2024-01-31T09:15:00Z');
  });
});