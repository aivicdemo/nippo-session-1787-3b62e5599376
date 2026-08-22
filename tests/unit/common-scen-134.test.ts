import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { generateMonthlyAnalysisReport } from '../../src/logic/analysis-reporting';

describe('generateMonthlyAnalysisReport', () => {
  // SCEN-134: [error] 月次レポート生成から分析完了までの自動実行 AIエージェント - 異常値検出時の人への引き継ぎプロセス
  test('should escalate to human review when anomalies are detected during analysis', async () => {
    const fake_ai_client = {
      action_01_trigger_confirmation: jest.fn(),
      action_02_data_extraction: jest.fn(),
      action_03_report_generation: jest.fn(),
      action_04_timeseries_analysis: jest.fn(),
      action_05_bottleneck_analysis: jest.fn(),
      action_06_performance_calculation: jest.fn(),
      action_07_priority_analysis: jest.fn(),
      action_08_final_report_creation: jest.fn(),
    };

    const fake_database = {
      analysisReports: [] as Array<{
        report_id: string;
        status: string;
        anomaly_details?: Record<string, unknown>;
        handover_status?: string;
      }>,
      humanReviewNotifications: [] as Array<{
        notification_id: string;
        recipient_role: string;
        anomaly_summary: string;
        timestamp: string;
      }>,
      auditLogs: [] as Array<{
        log_id: string;
        event_type: string;
        escalation_type: string;
        timestamp: string;
      }>,
    };

    const fake_messaging_service = {
      send_notification: jest.fn(),
    };

    // Setup Action 1-6 to succeed
    fake_ai_client.action_01_trigger_confirmation.mockResolvedValue({
      trigger_confirmed: true,
      target_month: '2024-01',
    });

    fake_ai_client.action_02_data_extraction.mockResolvedValue({
      data_extracted: true,
      report_count: 120,
      data_points: 450,
    });

    fake_ai_client.action_03_report_generation.mockResolvedValue({
      report_generated: true,
      report_id: 'rpt_2024_01_001',
    });

    fake_ai_client.action_04_timeseries_analysis.mockResolvedValue({
      timeseries_complete: true,
      issue_trend: 'increasing',
    });

    fake_ai_client.action_05_bottleneck_analysis.mockResolvedValue({
      bottleneck_analysis_complete: true,
      bottleneck_shift_detected: true,
    });

    fake_ai_client.action_06_performance_calculation.mockResolvedValue({
      performance_calculated: true,
      metrics_generated: 5,
    });

    // Setup Action 7 to return anomaly detection signal
    fake_ai_client.action_07_priority_analysis.mockResolvedValue({
      anomaly_detected: true,
      anomaly_type: 'unexpected_pattern',
      detected_items: [
        'issue_spike_250percent',
        'new_category_system_incident',
      ],
      anomaly_details: {
        issue_spike_percentage: 250,
        baseline_monthly_issues: 40,
        current_month_issues: 100,
        new_categories: ['system_incident_response'],
        severity: 'high',
      },
      confidence_score: 0.95,
    });

    // Execute the orchestrator with anomaly detection
    const result = await generateMonthlyAnalysisReport(
      {
        execution_id: 'exec_2024_01_001',
        target_month: '2024-01',
        triggered_at: '2024-02-01T08:00:00Z',
      },
      fake_ai_client,
      fake_database,
      fake_messaging_service
    );

    // Verify escalation response
    expect(result.escalation_type).toBe('ANOMALY_DETECTED');
    expect(result.handover_status).toBe('AWAITING_HUMAN_REVIEW');

    // Verify anomaly details are included
    expect(result.anomaly_details).toEqual({
      detected_items: [
        'issue_spike_250percent',
        'new_category_system_incident',
      ],
      review_required_by: '部長',
      issue_spike_percentage: 250,
      baseline_monthly_issues: 40,
      current_month_issues: 100,
      new_categories: ['system_incident_response'],
      severity: 'high',
    });

    // Verify no automatic action was taken before human review
    expect(fake_ai_client.action_08_final_report_creation).not.toHaveBeenCalled();

    // Verify analysis report is saved with PENDING_HUMAN_REVIEW status
    expect(fake_database.analysisReports.length).toBe(1);
    const saved_report = fake_database.analysisReports[0];
    expect(saved_report.status).toBe('PENDING_HUMAN_REVIEW');
    expect(saved_report.handover_status).toBe('AWAITING_HUMAN_REVIEW');
    expect(saved_report.anomaly_details).toEqual({
      detected_items: [
        'issue_spike_250percent',
        'new_category_system_incident',
      ],
      review_required_by: '部長',
      issue_spike_percentage: 250,
      baseline_monthly_issues: 40,
      current_month_issues: 100,
      new_categories: ['system_incident_response'],
      severity: 'high',
    });

    // Verify human notification is sent
    expect(fake_database.humanReviewNotifications.length).toBe(1);
    const notification = fake_database.humanReviewNotifications[0];
    expect(notification.recipient_role).toBe('部長');
    expect(notification.anomaly_summary).toContain('issue_spike_250percent');
    expect(notification.anomaly_summary).toContain('new_category_system_incident');
    expect(notification.timestamp).toBeDefined();

    // Verify messaging service was called
    expect(fake_messaging_service.send_notification).toHaveBeenCalledWith(
      expect.objectContaining({
        notification_type: 'ANOMALY_DETECTION',
        recipient_role: '部長',
        content: expect.stringContaining('異常値検出'),
      })
    );

    // Verify audit log records the escalation
    expect(fake_database.auditLogs.length).toBeGreaterThan(0);
    const escalation_log = fake_database.auditLogs.find(
      (log) => log.event_type === 'ESCALATION'
    );
    expect(escalation_log).toBeDefined();
    expect(escalation_log?.escalation_type).toBe('ANOMALY_DETECTED');

    // Verify automatic report presentation to manager was not executed
    const auto_presentation_logs = fake_database.auditLogs.filter(
      (log) => log.event_type === 'REPORT_AUTO_PRESENTATION'
    );
    expect(auto_presentation_logs.length).toBe(0);

    // Verify the response indicates system is awaiting human judgment
    expect(result.awaiting_human_decision).toBe(true);
    expect(result.can_proceed_to_auto_presentation).toBe(false);
  });
});