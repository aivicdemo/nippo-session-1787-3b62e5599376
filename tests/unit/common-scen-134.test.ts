import { runTx7Imp1Agent, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-134
  test('異常値検出時に副作用確定前に人へ引き継ぐ', async () => {
    const mockDb = {
      analysisReports: [] as Array<{
        reportId: string;
        status: string;
        anomaly_details?: Record<string, unknown>;
      }>,
      escalationLogs: [] as Array<{
        timestamp: Date;
        escalation_type: string;
        handover_status: string;
      }>,
      humanNotifications: [] as Array<{
        notificationId: string;
        recipient: string;
        message: string;
      }>,
    };

    const mockAiClient: Tx7Imp1AiClient = {
      executeAction01TriggerCheck: jest.fn(async () => ({
        triggered: true,
        trigger_type: 'schedule',
      })),
      executeAction02DataExtraction: jest.fn(async () => ({
        extracted_data: {
          report_period: '2024-01',
          total_reports: 45,
          total_issues: 89,
        },
      })),
      executeAction03ReportGeneration: jest.fn(async () => ({
        report_id: 'rpt-202401-001',
        generated_at: new Date('2024-02-01T09:00:00Z'),
      })),
      executeAction04TimeSeriesAnalysis: jest.fn(async () => ({
        timeSeriesData: [
          {
            date: '2024-01-01',
            bottleneck_severity: 2,
            issue_count: 8,
          },
          {
            date: '2024-01-15',
            bottleneck_severity: 5,
            issue_count: 25,
          },
        ],
        trend_analysis: 'deteriorating',
      })),
      executeAction05BottleneckPushTransition: jest.fn(async () => ({
        bottleneck_transitions: [
          { date: '2024-01-01', category: 'delivery', severity: 2 },
          { date: '2024-01-15', category: 'system_incident', severity: 5 },
        ],
      })),
      executeAction06PerformanceMetrics: jest.fn(async () => ({
        team_metrics: {
          issue_resolution_speed: 3.5,
          report_submission_rate: 0.88,
          issue_recurrence_rate: 0.12,
        },
      })),
      executeAction07PrioritizationAndAnalysis: jest.fn(async () => ({
        anomaly_detected: true,
        anomaly_signals: [
          {
            type: 'issue_spike_250percent',
            threshold: 100,
            observed_value: 250,
            previous_period_average: 35,
          },
          {
            type: 'new_category_system_incident',
            detected_at: new Date('2024-01-15T10:30:00Z'),
          },
        ],
        requires_human_review: true,
        analysis_status: 'PENDING_HUMAN_REVIEW',
      })),
      executeAction08ReportDelivery: jest.fn(),
    };

    const result = await runTx7Imp1Agent(
      {
        targetMonth: '2024-01',
        teamId: 'team-engineering',
        triggeredBy: 'schedule',
      },
      mockAiClient,
      mockDb
    );

    expect(result.escalation_type).toBe('ANOMALY_DETECTED');
    expect(result.handover_status).toBe('AWAITING_HUMAN_REVIEW');

    expect(result.anomaly_details).toEqual(
      expect.objectContaining({
        detected_items: [
          'issue_spike_250percent',
          'new_category_system_incident',
        ],
        review_required_by: '部長',
      })
    );

    expect(mockDb.analysisReports).toHaveLength(1);
    expect(mockDb.analysisReports[0]).toEqual(
      expect.objectContaining({
        reportId: 'rpt-202401-001',
        status: 'PENDING_HUMAN_REVIEW',
        anomaly_details: expect.objectContaining({
          detected_items: expect.arrayContaining([
            'issue_spike_250percent',
            'new_category_system_incident',
          ]),
        }),
      })
    );

    expect(mockDb.escalationLogs).toHaveLength(1);
    expect(mockDb.escalationLogs[0]).toEqual(
      expect.objectContaining({
        escalation_type: 'ANOMALY_DETECTED',
        handover_status: 'AWAITING_HUMAN_REVIEW',
      })
    );

    expect(mockDb.humanNotifications.length).toBeGreaterThan(0);
    const humanNotification = mockDb.humanNotifications[0];
    expect(humanNotification).toEqual(
      expect.objectContaining({
        recipient: '部長',
        message: expect.stringContaining('異常値'),
      })
    );

    expect(mockAiClient.executeAction08ReportDelivery).not.toHaveBeenCalled();

    expect(mockAiClient.executeAction07PrioritizationAndAnalysis).toHaveBeenCalled();
  });
});