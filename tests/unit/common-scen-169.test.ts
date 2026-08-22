import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-169: sendUnsubmittedReminder escalates when executive decision required on proposed measures', async () => {
    // Setup: Test data for scenario requiring executive judgment
    const aggregated_report_data = {
      week_start: '2024-01-08',
      week_end: '2024-01-14',
      total_members: 15,
      submitted_members: 13,
      unsubmitted_members: 2,
    };

    const unsubmitted_member_list = [
      {
        member_id: 'M001',
        member_name: 'Yamada Taro',
        team_id: 'T001',
        submission_status: 'unsubmitted',
        notification_count: 1,
        last_notification_at: '2024-01-14T08:00:00Z',
      },
      {
        member_id: 'M002',
        member_name: 'Suzuki Hanako',
        team_id: 'T002',
        submission_status: 'unsubmitted',
        notification_count: 2,
        last_notification_at: '2024-01-14T09:30:00Z',
      },
    ];

    const productivity_metrics = {
      issue_resolution_count: 42,
      average_resolution_days: 4.2,
      issue_recurrence_rate: 0.18,
      submission_rate: 0.867,
    };

    const priority_classified_issues = [
      {
        issue_id: 'ISS001',
        issue_title: 'Database performance degradation',
        priority: 'HIGH',
        impact_scope: 'system_wide',
        recurrence_pattern: 'recurring',
      },
      {
        issue_id: 'ISS002',
        issue_title: 'API response timeout',
        priority: 'MEDIUM',
        impact_scope: 'api_service',
        recurrence_pattern: 'new',
      },
    ];

    const recurrence_pattern_analysis = {
      total_issues_analyzed: 52,
      recurring_issues: 12,
      new_issues: 40,
      top_recurrence_category: 'infrastructure',
      recurrence_rate: 0.23,
    };

    // Action 6 output: Proposed measures with executive judgment requirement
    const proposed_measures_with_escalation = {
      measures: [
        {
          measure_id: 'MEAS001',
          measure_title: 'Introduce monitoring tool for infrastructure',
          measure_type: 'tool_introduction',
          estimated_cost_monthly: 500000,
          expected_reduction_recurrence: 0.15,
          required_approval: 'executive_decision',
        },
        {
          measure_id: 'MEAS002',
          measure_title: 'Reorganize team for cross-department coordination',
          measure_type: 'organizational_change',
          budget_impact: 'headcount_allocation',
          expected_reduction_recurrence: 0.08,
          required_approval: 'executive_decision',
        },
      ],
      executive_decision_required: true,
      executive_judgment_reasons: [
        'Budget approval required: monthly cost increase of 500000 yen',
        'Cross-departmental coordination necessary',
        'Headcount reallocation affects multiple teams',
      ],
      escalation_status: 'awaiting_executive_review',
    };

    // Create mock AI client injected into orchestrator
    const mock_ai_client = {
      action_01_aggregateData: async () => aggregated_report_data,
      action_02_extractUnsubmittedMembers: async () => unsubmitted_member_list,
      action_03_quantifyProductivityMetrics: async () => productivity_metrics,
      action_04_classifyIssuesByPriority: async () => priority_classified_issues,
      action_05_analyzeRecurrencePattern: async () => recurrence_pattern_analysis,
      action_06_proposeMeasures: async () => proposed_measures_with_escalation,
    };

    // Execute function with injected mock client
    // sendUnsubmittedReminder delegates to orchestrator logic which should detect escalation
    const result = await sendUnsubmittedReminder({
      ai_client: mock_ai_client,
      analysis_period_start: '2024-01-08',
      analysis_period_end: '2024-01-14',
      manager_id: 'MGR001',
      timestamp_utc: '2024-01-14T10:00:00Z',
    });

    // Verify escalation condition detected
    expect(result.escalation_detected).toBe(true);
    expect(result.escalation_condition).toBe('executive_decision_required');

    // Verify side effects not executed
    expect(result.side_effects_executed).toBe(false);
    expect(result.report_database_registered).toBe(false);
    expect(result.notification_email_sent).toBe(false);

    // Verify handoff context preserved for manager
    expect(result.handoff_context).toBeDefined();
    expect(result.handoff_context.aggregated_data).toEqual(aggregated_report_data);
    expect(result.handoff_context.unsubmitted_members).toEqual(unsubmitted_member_list);
    expect(result.handoff_context.productivity_metrics).toEqual(productivity_metrics);
    expect(result.handoff_context.prioritized_issues).toEqual(priority_classified_issues);
    expect(result.handoff_context.recurrence_analysis).toEqual(recurrence_pattern_analysis);
    expect(result.handoff_context.proposed_measures).toEqual(proposed_measures_with_escalation.measures);

    // Verify executive judgment reasons documented
    expect(result.handoff_context.executive_judgment_required).toBe(true);
    expect(result.handoff_context.executive_judgment_reasons).toEqual(
      proposed_measures_with_escalation.executive_judgment_reasons,
    );
    expect(result.handoff_context.executive_judgment_reasons.length).toBe(3);
    expect(result.handoff_context.executive_judgment_reasons[0]).toMatch(/Budget approval/);
    expect(result.handoff_context.executive_judgment_reasons[1]).toMatch(/Cross-departmental/);
    expect(result.handoff_context.executive_judgment_reasons[2]).toMatch(/Headcount reallocation/);

    // Verify manager awaiting review status
    expect(result.handoff_context.status).toBe('awaiting_manager_review');
    expect(result.handoff_context.awaiting_review_since).toBe('2024-01-14T10:00:00Z');

    // Verify audit log entry
    expect(result.audit_log_entry).toBeDefined();
    expect(result.audit_log_entry.event_type).toBe('escalation_triggered');
    expect(result.audit_log_entry.escalation_condition).toBe('executive_decision_required');
    expect(result.audit_log_entry.timestamp_utc).toBe('2024-01-14T10:00:00Z');
    expect(result.audit_log_entry.escalation_target_manager_id).toBe('MGR001');
    expect(result.audit_log_entry.intermediate_results_preserved).toBe(true);
  });
});