import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: Recurring Issue Pattern Tracking & Visualization Agent', () => {
  // SCEN-2012: [edge] ボトルネック変化パターン可視化レポート生成機能 - 過去30日のうち開始日と終了日が同日のデータセットのとき、1日分として処理される
  test('should process same-day issue records as single daily unit in bottleneck visualization report', async () => {
    // Arrange: Fake AI Client setup
    const fake_ai_client = {
      searchAndExtractIssueData: jest.fn().mockResolvedValue({
        issueDataset: [
          {
            reportId: 'report_2024_01_15_001',
            analysisStartDate: '2024-01-15',
            analysisEndDate: '2024-01-15',
            issueKeyword: 'database_performance',
            occurrenceCount: 2,
            affectedTeams: ['backend_team'],
            severityLevel: 'high',
            reportedAt: '2024-01-15T09:30:00Z',
          },
          {
            reportId: 'report_2024_01_15_002',
            analysisStartDate: '2024-01-15',
            analysisEndDate: '2024-01-15',
            issueKeyword: 'database_performance',
            occurrenceCount: 1,
            affectedTeams: ['backend_team'],
            severityLevel: 'high',
            reportedAt: '2024-01-15T14:45:00Z',
          },
          {
            reportId: 'report_2024_01_14_001',
            analysisStartDate: '2024-01-14',
            analysisEndDate: '2024-01-14',
            issueKeyword: 'database_performance',
            occurrenceCount: 1,
            affectedTeams: ['backend_team'],
            severityLevel: 'medium',
            reportedAt: '2024-01-14T10:15:00Z',
          },
          {
            reportId: 'report_2024_01_13_001',
            analysisStartDate: '2024-01-13',
            analysisEndDate: '2024-01-13',
            issueKeyword: 'api_timeout',
            occurrenceCount: 1,
            affectedTeams: ['api_team'],
            severityLevel: 'medium',
            reportedAt: '2024-01-13T11:00:00Z',
          },
        ],
      }),

      analyzeTimeSeriesPatterns: jest.fn().mockResolvedValue({
        patterns: [
          {
            issueKeyword: 'database_performance',
            timeSeriesPattern: 'increasing_trend',
            dayCount: 2,
            aggregatedOccurrenceCount: 3,
            dateRanges: [
              { startDate: '2024-01-15', endDate: '2024-01-15', recordCount: 2 },
              { startDate: '2024-01-14', endDate: '2024-01-14', recordCount: 1 },
            ],
          },
          {
            issueKeyword: 'api_timeout',
            timeSeriesPattern: 'sporadic',
            dayCount: 1,
            aggregatedOccurrenceCount: 1,
            dateRanges: [
              { startDate: '2024-01-13', endDate: '2024-01-13', recordCount: 1 },
            ],
          },
        ],
      }),

      generateVisualizationGraphs: jest.fn().mockResolvedValue({
        graphs: [
          {
            graphType: 'line_chart',
            title: 'Issue Occurrence Trend (30 days)',
            dataPoints: [
              { date: '2024-01-13', issueCount: 1, severity: 'medium' },
              { date: '2024-01-14', issueCount: 1, severity: 'medium' },
              { date: '2024-01-15', issueCount: 2, severity: 'high' },
            ],
          },
          {
            graphType: 'bar_chart',
            title: 'Issue Frequency by Keyword',
            dataPoints: [
              { issueKeyword: 'database_performance', frequency: 3, color: '#FF6B6B' },
              { issueKeyword: 'api_timeout', frequency: 1, color: '#FFA500' },
            ],
          },
          {
            graphType: 'heatmap',
            title: 'Daily Issue Severity Matrix',
            dataPoints: [
              { date: '2024-01-13', severity: 'medium', intensity: 0.5 },
              { date: '2024-01-14', severity: 'medium', intensity: 0.5 },
              { date: '2024-01-15', severity: 'high', intensity: 1.0 },
            ],
          },
        ],
      }),

      compileAndNotifyReport: jest.fn().mockResolvedValue({
        reportId: 'viz_report_20240115_001',
        emailSentAt: '2024-01-15T16:00:00Z',
        recipientManagerId: 'mgr_001',
        status: 'delivered',
      }),
    };

    const input: Tx8AgentInput = {
      analysisStartDate: '2024-01-15',
      analysisEndDate: '2024-01-15',
      teamIds: ['backend_team', 'api_team'],
      minimumRecurrenceThreshold: 1,
      recipientManagerId: 'mgr_001',
    };

    // Act
    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, fake_ai_client);

    // Assert
    expect(result).toBeDefined();
    expect(result.reportId).toBe('viz_report_20240115_001');
    expect(result.emailSentAt).toBe('2024-01-15T16:00:00Z');

    // Verify that same-day records (2024-01-15) are aggregated as single daily unit
    expect(result.recurringIssuePatterns).toHaveLength(2);

    const database_performance_pattern = result.recurringIssuePatterns.find(
      (p) => p.issueKeyword === 'database_performance'
    );
    expect(database_performance_pattern).toBeDefined();
    expect(database_performance_pattern!.occurrenceCount).toBe(3);
    expect(database_performance_pattern!.timeSeriesPattern).toBe('increasing_trend');

    // Verify visualization graphs contain same-date aggregation
    expect(result.visualizationGraphs).toHaveLength(3);

    const line_chart = result.visualizationGraphs.find(
      (g) => g.graphType === 'line_chart'
    );
    expect(line_chart).toBeDefined();
    expect(line_chart!.title).toBe('Issue Occurrence Trend (30 days)');
    expect(line_chart!.dataPoints).toHaveLength(3);

    // Verify that 2024-01-15 entry appears only once with aggregated count of 2
    const same_date_entry = line_chart!.dataPoints.find((dp) => dp.date === '2024-01-15');
    expect(same_date_entry).toBeDefined();
    expect(same_date_entry!.issueCount).toBe(2);
    expect(same_date_entry!.severity).toBe('high');

    const date_entries_for_jan_15 = line_chart!.dataPoints.filter(
      (dp) => dp.date === '2024-01-15'
    );
    expect(date_entries_for_jan_15).toHaveLength(1);

    // Verify heatmap aggregation for same date
    const heatmap = result.visualizationGraphs.find(
      (g) => g.graphType === 'heatmap'
    );
    expect(heatmap).toBeDefined();
    const heatmap_same_date_entries = heatmap!.dataPoints.filter(
      (dp) => dp.date === '2024-01-15'
    );
    expect(heatmap_same_date_entries).toHaveLength(1);
    expect(heatmap_same_date_entries[0].intensity).toBe(1.0);

    // Verify AI client was called with correct methods
    expect(fake_ai_client.searchAndExtractIssueData).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisStartDate: '2024-01-15',
        analysisEndDate: '2024-01-15',
        teamIds: ['backend_team', 'api_team'],
      })
    );

    expect(fake_ai_client.analyzeTimeSeriesPatterns).toHaveBeenCalled();
    expect(fake_ai_client.generateVisualizationGraphs).toHaveBeenCalled();
    expect(fake_ai_client.compileAndNotifyReport).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientManagerId: 'mgr_001',
      })
    );
  });
});