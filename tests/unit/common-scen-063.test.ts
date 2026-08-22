import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

const fetchMock = require('jest-fetch-mock');

describe('submission-status-management: detectAndNotifyUnsubmitted', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-063
  test('should escalate to human when action-03 detects rule-unmatched anomalous issue and prevent email send', async () => {
    // Prepare aggregated daily report data with anomalous issue
    const aggregated_daily_reports = [
      {
        report_id: 'RPT-2024-001',
        submitted_by: 'user-001',
        submission_timestamp: '2024-01-15T09:00:00Z',
        tasks: [
          {
            task_id: 'TASK-001',
            title: 'Standard task',
            description: 'Normal priority task',
            priority_indicators: {
              impact_range: 'single_team',
              urgency_level: 'medium',
              recurrence_risk: 'low'
            }
          },
          {
            task_id: 'TASK-002',
            title: 'Anomalous external factor issue',
            description: 'Unpredictable problem caused by unknown external factor',
            priority_indicators: {
              impact_range: null,
              urgency_level: null,
              recurrence_risk: null
            }
          }
        ]
      }
    ];

    // Mock action-01: fetch aggregated reports
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 'success',
        data: aggregated_daily_reports
      }),
      { status: 200 }
    );

    // Mock action-02: identify unsubmitted members
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 'success',
        unsubmitted_members: []
      }),
      { status: 200 }
    );

    // Mock action-03: priority auto-judgment with rule-mismatch flag
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 'success',
        prioritized_tasks: [
          {
            task_id: 'TASK-001',
            priority_score: 5,
            category: 'standard',
            rule_matched: true
          },
          {
            task_id: 'TASK-002',
            priority_score: null,
            category: null,
            rule_matched: false,
            rule_mismatch_reason: 'unknown_external_factor',
            escalation_required: true
          }
        ],
        has_rule_unmatched_issue: true
      }),
      { status: 200 }
    );

    // Prepare mock AI client
    const mock_ai_client = {
      action_01_fetch_aggregated_reports: jest.fn(async () => ({
        status: 'success',
        data: aggregated_daily_reports
      })),
      action_02_identify_unsubmitted_members: jest.fn(async () => ({
        status: 'success',
        unsubmitted_members: []
      })),
      action_03_priority_auto_judgment: jest.fn(async () => ({
        status: 'success',
        prioritized_tasks: [
          {
            task_id: 'TASK-001',
            priority_score: 5,
            category: 'standard',
            rule_matched: true
          },
          {
            task_id: 'TASK-002',
            priority_score: null,
            category: null,
            rule_matched: false,
            rule_mismatch_reason: 'unknown_external_factor',
            escalation_required: true
          }
        ],
        has_rule_unmatched_issue: true
      })),
      action_04_generate_task_list: jest.fn(async () => {
        throw new Error('action-04 should not be called');
      }),
      action_05_send_email: jest.fn(async () => {
        throw new Error('action-05 should not be called');
      }),
      record_audit_event: jest.fn(async (event_data) => ({
        status: 'success',
        audit_log_id: 'AUDIT-2024-001',
        event_timestamp: event_data.timestamp,
        event_type: event_data.event_type,
        task_id: event_data.task_id,
        reason: event_data.reason
      }))
    };

    // Execute orchestrator
    const result = await detectAndNotifyUnsubmitted(
      aggregated_daily_reports,
      mock_ai_client as any
    );

    // Verify escalation status
    expect(result.status).toBe('escalated_to_human');
    expect(result.escalation_reason).toBe('rule_unmatched_anomalous_issue');

    // Verify anomalous task is identified
    expect(result.escalated_tasks).toBeDefined();
    expect(result.escalated_tasks.length).toBe(1);
    expect(result.escalated_tasks[0].task_id).toBe('TASK-002');
    expect(result.escalated_tasks[0].rule_matched).toBe(false);

    // Verify action-03 was called
    expect(mock_ai_client.action_03_priority_auto_judgment).toHaveBeenCalledTimes(1);

    // Verify action-04 and action-05 were not called
    expect(mock_ai_client.action_04_generate_task_list).not.toHaveBeenCalled();
    expect(mock_ai_client.action_05_send_email).not.toHaveBeenCalled();

    // Verify audit event was recorded
    expect(mock_ai_client.record_audit_event).toHaveBeenCalled();
    const audit_call = mock_ai_client.record_audit_event.mock.calls[0][0];
    expect(audit_call.event_type).toBe('anomalous_task_detected');
    expect(audit_call.task_id).toBe('TASK-002');
    expect(audit_call.reason).toBe('unknown_external_factor');
    expect(audit_call.timestamp).toBeDefined();

    // Verify no email was sent
    expect(result.email_sent_count).toBe(0);

    // Verify return indicates human review state
    expect(result.requires_human_review).toBe(true);
  });
});