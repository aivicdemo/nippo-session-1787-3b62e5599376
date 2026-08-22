import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('sendUnsubmittedReminder', () => {
  // SCEN-123: [error] 日報収集から分析レポート生成までの自動実行 AIエージェント - 
  // 「日報収集から分析レポート生成までの自動実行」が途中失敗時に完了済みの副作用を巻き戻すか補償する
  test('should rollback all side effects when Action 4 fails with invalid analysis result', async () => {
    const mock_db_daily_reports = jest.fn();
    const mock_db_issues = jest.fn();
    const mock_db_audit_logs = jest.fn();
    const mock_email_queue = jest.fn();
    const mock_memory_cache = jest.fn();

    const mock_daily_report_records = [
      { id: 'dr001', content: 'Report 1', submitted_at: '2024-01-08T09:00:00Z' },
      { id: 'dr002', content: 'Report 2', submitted_at: '2024-01-08T09:15:00Z' },
      { id: 'dr003', content: 'Report 3', submitted_at: '2024-01-08T09:30:00Z' },
      { id: 'dr004', content: 'Report 4', submitted_at: '2024-01-08T09:45:00Z' },
      { id: 'dr005', content: 'Report 5', submitted_at: '2024-01-08T10:00:00Z' },
      { id: 'dr006', content: 'Report 6', submitted_at: '2024-01-08T10:15:00Z' },
      { id: 'dr007', content: 'Report 7', submitted_at: '2024-01-08T10:30:00Z' },
      { id: 'dr008', content: 'Report 8', submitted_at: '2024-01-08T10:45:00Z' },
      { id: 'dr009', content: 'Report 9', submitted_at: '2024-01-08T11:00:00Z' },
      { id: 'dr010', content: 'Report 10', submitted_at: '2024-01-08T11:15:00Z' },
    ];

    const mock_unsubmitted_members = [
      { member_id: 'mem001', email: 'member1@example.com' },
      { member_id: 'mem002', email: 'member2@example.com' },
      { member_id: 'mem003', email: 'member3@example.com' },
    ];

    const mock_issue_records = Array.from({ length: 15 }, (_, i) => ({
      id: `issue_${String(i + 1).padStart(3, '0')}`,
      title: `Issue ${i + 1}`,
      priority: 'HIGH' as const,
      category: 'QUALITY' as const,
    }));

    const mock_reminder_email_records = [
      { id: 'email001', member_id: 'mem001', sent_at: '2024-01-15T07:00:00Z', status: 'QUEUED' as const },
      { id: 'email002', member_id: 'mem002', sent_at: '2024-01-15T07:00:00Z', status: 'QUEUED' as const },
      { id: 'email003', member_id: 'mem003', sent_at: '2024-01-15T07:00:00Z', status: 'QUEUED' as const },
    ];

    const mock_analysis_result_invalid = {
      priority_score: 9999,
      category: 'INVALID_CATEGORY' as const,
      timestamp: '2024-01-15T08:00:00Z',
    };

    const mock_audit_log_entries: Array<{
      event_type: string;
      action_id: string;
      status: string;
      timestamp: string;
      details?: string;
    }> = [];

    const mock_state = {
      daily_reports_in_memory: [...mock_daily_report_records],
      issues_inserted_count: 15,
      reminders_queued_count: 3,
      rollback_started: false,
      rollback_completed: false,
      rollback_status: 'pending' as const,
    };

    const mock_orchestrator_action_1_execute = jest
      .fn()
      .mockResolvedValue({ success: true, records_collected: 10, data: mock_daily_report_records });

    const mock_orchestrator_action_2_execute = jest
      .fn()
      .mockResolvedValue({ success: true, reminders_sent: 3, data: mock_reminder_email_records });

    const mock_orchestrator_action_3_execute = jest
      .fn()
      .mockResolvedValue({ success: true, issues_extracted: 15, data: mock_issue_records });

    const mock_orchestrator_action_4_execute = jest
      .fn()
      .mockRejectedValue(new Error('Invalid priority score detected'));

    const mock_orchestrator_rollback_action_3 = jest
      .fn()
      .mockImplementation(() => {
        mock_state.issues_inserted_count = 0;
        mock_db_issues.mockResolvedValueOnce({ deleted_count: 15 });
        mock_audit_log_entries.push({
          event_type: 'ROLLBACK_ACTION_3_EXECUTED',
          action_id: 'action_03_compensate',
          status: 'COMPLETED',
          timestamp: '2024-01-15T08:01:00Z',
          details: 'Deleted 15 issue records',
        });
        return Promise.resolve({ success: true, deleted_count: 15 });
      });

    const mock_orchestrator_rollback_action_2 = jest
      .fn()
      .mockImplementation(() => {
        mock_state.reminders_queued_count = 0;
        mock_email_queue.mockResolvedValueOnce({ removed_count: 3 });
        mock_audit_log_entries.push({
          event_type: 'ROLLBACK_ACTION_2_EXECUTED',
          action_id: 'action_02_compensate',
          status: 'COMPLETED',
          timestamp: '2024-01-15T08:02:00Z',
          details: 'Removed 3 reminder email records from queue',
        });
        return Promise.resolve({ success: true, removed_count: 3 });
      });

    const mock_orchestrator_rollback_action_1 = jest
      .fn()
      .mockImplementation(() => {
        mock_state.daily_reports_in_memory = [];
        mock_memory_cache.mockResolvedValueOnce({ cleared_count: 10 });
        mock_audit_log_entries.push({
          event_type: 'ROLLBACK_ACTION_1_EXECUTED',
          action_id: 'action_01_compensate',
          status: 'COMPLETED',
          timestamp: '2024-01-15T08:03:00Z',
          details: 'Cleared 10 daily report records from memory',
        });
        return Promise.resolve({ success: true, cleared_count: 10 });
      });

    const mock_orchestrator_record_audit_log = jest
      .fn()
      .mockImplementation((event: { event_type: string; action_id: string; status: string; timestamp: string; details?: string }) => {
        mock_audit_log_entries.push(event);
        mock_db_audit_logs.mockResolvedValueOnce({ inserted_id: `audit_${Date.now()}` });
        return Promise.resolve({ success: true });
      });

    const mock_tx6_imp1_ai_client = {
      executeAction01: mock_orchestrator_action_1_execute,
      executeAction02: mock_orchestrator_action_2_execute,
      executeAction03: mock_orchestrator_action_3_execute,
      executeAction04: mock_orchestrator_action_4_execute,
      compensateAction01: mock_orchestrator_rollback_action_1,
      compensateAction02: mock_orchestrator_rollback_action_2,
      compensateAction03: mock_orchestrator_rollback_action_3,
      recordAuditLog: mock_orchestrator_record_audit_log,
    };

    const test_input_params = {
      week_start_date: '2024-01-08',
      week_end_date: '2024-01-14',
      department_id: 'dept_001',
      org_id: 'org_001',
      request_timestamp: '2024-01-15T08:00:00Z',
    };

    try {
      await sendUnsubmittedReminder(test_input_params, mock_tx6_imp1_ai_client as any);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/Invalid priority score detected/);
    }

    expect(mock_orchestrator_action_1_execute).toHaveBeenCalledTimes(1);
    expect(mock_orchestrator_action_2_execute).toHaveBeenCalledTimes(1);
    expect(mock_orchestrator_action_3_execute).toHaveBeenCalledTimes(1);
    expect(mock_orchestrator_action_4_execute).toHaveBeenCalledTimes(1);

    expect(mock_orchestrator_rollback_action_3).toHaveBeenCalledTimes(1);
    expect(mock_orchestrator_rollback_action_2).toHaveBeenCalledTimes(1);
    expect(mock_orchestrator_rollback_action_1).toHaveBeenCalledTimes(1);

    expect(mock_state.issues_inserted_count).toBe(0);
    expect(mock_state.reminders_queued_count).toBe(0);
    expect(mock_state.daily_reports_in_memory.length).toBe(0);

    const rollback_events = mock_audit_log_entries.filter((entry) =>
      entry.event_type.startsWith('ROLLBACK_')
    );
    expect(rollback_events.length).toBe(3);
    expect(rollback_events[0].event_type).toBe('ROLLBACK_ACTION_3_EXECUTED');
    expect(rollback_events[1].event_type).toBe('ROLLBACK_ACTION_2_EXECUTED');
    expect(rollback_events[2].event_type).toBe('ROLLBACK_ACTION_1_EXECUTED');

    expect(mock_audit_log_entries).toContainEqual(
      expect.objectContaining({
        event_type: 'ROLLBACK_ACTION_3_EXECUTED',
        action_id: 'action_03_compensate',
        status: 'COMPLETED',
      })
    );

    expect(mock_audit_log_entries).toContainEqual(
      expect.objectContaining({
        event_type: 'ROLLBACK_ACTION_2_EXECUTED',
        action_id: 'action_02_compensate',
        status: 'COMPLETED',
      })
    );

    expect(mock_audit_log_entries).toContainEqual(
      expect.objectContaining({
        event_type: 'ROLLBACK_ACTION_1_EXECUTED',
        action_id: 'action_01_compensate',
        status: 'COMPLETED',
      })
    );
  });
});