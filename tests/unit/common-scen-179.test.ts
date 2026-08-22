import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-179: sendUnsubmittedReminder sends reminder to unsubmitted members', async () => {
    const unsubmitted_members = [
      { member_id: 'M001', member_name: 'Alice', email: 'alice@example.com' },
      { member_id: 'M002', member_name: 'Bob', email: 'bob@example.com' }
    ];
    
    const reminder_config = {
      subject_line: '【朝会報告】本日の報告がまだお済みではありません',
      body_template: 'こんにちは${member_name}さん。本日の朝会報告をお願いします。',
      sender_email: 'noreply@morning-meeting.example.com',
      send_timestamp: new Date('2024-01-15T08:00:00Z').toISOString(),
      max_retry_count: 3
    };

    const audit_log_entries: Array<{
      event_type: string;
      timestamp: string;
      member_id: string;
      status: string;
    }> = [];

    const mock_send_email = jest.fn(async (email_params: {
      to: string;
      subject: string;
      body: string;
    }) => {
      audit_log_entries.push({
        event_type: 'REMINDER_SENT',
        timestamp: reminder_config.send_timestamp,
        member_id: unsubmitted_members.find(m => m.email === email_params.to)?.member_id || 'UNKNOWN',
        status: 'SUCCESS'
      });
      return { success: true, message_id: `msg_${Date.now()}` };
    });

    const result = await sendUnsubmittedReminder(
      unsubmitted_members,
      reminder_config,
      mock_send_email
    );

    expect(result).toEqual({
      total_count: 2,
      sent_count: 2,
      failed_count: 0,
      status: 'COMPLETED'
    });

    expect(mock_send_email).toHaveBeenCalledTimes(2);
    
    expect(mock_send_email).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alice@example.com',
        subject: '【朝会報告】本日の報告がまだお済みではありません',
        body: expect.stringContaining('Aliceさん')
      })
    );

    expect(mock_send_email).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'bob@example.com',
        subject: '【朝会報告】本日の報告がまだお済みではありません',
        body: expect.stringContaining('Bobさん')
      })
    );

    expect(audit_log_entries.length).toBe(2);
    expect(audit_log_entries[0]).toEqual({
      event_type: 'REMINDER_SENT',
      timestamp: '2024-01-15T08:00:00Z',
      member_id: 'M001',
      status: 'SUCCESS'
    });
    expect(audit_log_entries[1]).toEqual({
      event_type: 'REMINDER_SENT',
      timestamp: '2024-01-15T08:00:00Z',
      member_id: 'M002',
      status: 'SUCCESS'
    });
  });
});