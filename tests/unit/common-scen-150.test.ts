import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  // SCEN-150: [error] 課題検索から可視化レポート作成までの自動実行 AIエージェント
  // - 新規の未分類パターンが検出された場合に副作用の確定前に人へ引き継ぐ
  test('should escalate to human review when unclassified pattern detected during analysis', async () => {
    const audit_log_entries: Array<{
      timestamp: string;
      escalation_condition: string;
      status: string;
      pattern_id: string;
      related_issue_count: number;
      classification_proposals: string[];
    }> = [];

    const mock_audit_log = {
      record: (entry: {
        timestamp: string;
        escalation_condition: string;
        status: string;
        pattern_id: string;
        related_issue_count: number;
        classification_proposals: string[];
      }) => {
        audit_log_entries.push(entry);
      },
      get_entries: () => audit_log_entries,
    };

    const mock_system_db = {
      get_unsubmitted_members: () => [
        { member_id: 'M001', name: 'Alice', team_id: 'T001' },
        { member_id: 'M002', name: 'Bob', team_id: 'T001' },
      ],
      get_issue_data: () => [
        {
          issue_id: 'I001',
          pattern: 'known_production_issue',
          detected_at: '2024-01-15T08:00:00Z',
          related_members: ['M001'],
        },
        {
          issue_id: 'I002',
          pattern: 'known_deployment_issue',
          detected_at: '2024-01-15T08:30:00Z',
          related_members: ['M002'],
        },
        {
          issue_id: 'I003',
          pattern: 'unknown_pattern_xyz',
          detected_at: '2024-01-15T09:00:00Z',
          related_members: ['M001', 'M002'],
        },
      ],
      get_notification_status: (member_id: string) =>
        !audit_log_entries.some((e) => e.status === 'notified' && e.escalation_condition.includes(member_id)),
    };

    const mock_notification_service = {
      send_reminder: jest.fn(async (member_id: string, message: string) => ({
        success: true,
        member_id,
        sent_at: '2024-01-15T09:15:00Z',
      })),
      send_escalation: jest.fn(async (escalation_data: object) => ({
        success: true,
        escalation_id: 'ESC-001',
        sent_at: '2024-01-15T09:20:00Z',
      })),
    };

    const unsubmitted_members = mock_system_db.get_unsubmitted_members();
    const issue_data = mock_system_db.get_issue_data();

    const result = await detectAndNotifyUnsubmitted({
      unsubmitted_members,
      issue_data,
      audit_log: mock_audit_log,
      notification_service: mock_notification_service,
      execution_timestamp: '2024-01-15T09:25:00Z',
    });

    // Verify that unsubmitted members were identified
    expect(result.members_notified).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ member_id: 'M001', notification_sent: true }),
        expect.objectContaining({ member_id: 'M002', notification_sent: true }),
      ])
    );

    // Verify that unclassified pattern (unknown_pattern_xyz) was detected
    const detected_unclassified = result.detected_patterns.filter((p) => p.classification_status === 'unclassified');
    expect(detected_unclassified.length).toBeGreaterThan(0);

    const unknown_pattern = detected_unclassified.find((p) => p.pattern_type === 'unknown_pattern_xyz');
    expect(unknown_pattern).toBeDefined();
    expect(unknown_pattern?.related_issue_count).toBe(2);

    // Verify escalation event was recorded in audit log
    const escalation_entries = audit_log_entries.filter(
      (e) => e.escalation_condition === '新規の未分類パターン検出'
    );
    expect(escalation_entries.length).toBeGreaterThan(0);

    const primary_escalation = escalation_entries[0];
    expect(primary_escalation.status).toBe('awaiting_human_review');
    expect(primary_escalation.pattern_id).toBe('unknown_pattern_xyz');
    expect(primary_escalation.related_issue_count).toBe(2);
    expect(primary_escalation.classification_proposals.length).toBeGreaterThan(0);

    // Verify that workflow transitioned to human review state
    expect(result.workflow_status).toBe('awaiting_human_review');
    expect(result.is_auto_report_generated).toBe(false);

    // Verify that report generation was not completed (side effect not confirmed)
    expect(result.report_output).toBeNull();

    // Verify notification service was called for unsubmitted members but not for escalation yet
    expect(mock_notification_service.send_reminder).toHaveBeenCalledTimes(2);
    expect(mock_notification_service.send_escalation).not.toHaveBeenCalled();

    // Verify audit trail contains escalation record with all required fields
    const audit_record = audit_log_entries.find((e) => e.escalation_condition === '新規の未分類パターン検出');
    expect(audit_record).toMatchObject({
      timestamp: expect.any(String),
      escalation_condition: '新規の未分類パターン検出',
      status: 'awaiting_human_review',
      pattern_id: 'unknown_pattern_xyz',
      related_issue_count: 2,
      classification_proposals: expect.any(Array),
    });
  });
});