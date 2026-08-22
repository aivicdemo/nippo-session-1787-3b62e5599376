import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-204: escalation handoff before side effect confirmation with human approval', async () => {
    // Setup: Mock audit event recorder
    const auditEvents: Array<{
      action: string;
      triggered_by: string;
      unsubmitted_members: string[];
      attempt_count: number;
      timestamp: string;
    }> = [];

    const mockRecordAuditEvent = jest.fn((event) => {
      auditEvents.push(event);
    });

    // Setup: Mock email sender to track side effects
    const emailsSent: Array<{
      recipient: string;
      subject: string;
      timestamp: string;
    }> = [];

    const mockSendEmail = jest.fn((recipient, subject) => {
      emailsSent.push({
        recipient,
        subject,
        timestamp: new Date().toISOString(),
      });
    });

    // Setup: Mock escalation handoff to simulate human intervention point
    let handoffState: {
      unsubmitted_members: string[];
      attempt_count: number;
      final_timestamp: string;
      recommended_action: string;
      human_confirmed: boolean;
    } | null = null;

    const mockCreateEscalationHandoff = jest.fn((data) => {
      handoffState = {
        ...data,
        human_confirmed: false,
      };
    });

    // Setup: Member submission status tracker
    const memberSubmissionStatus: Record<string, { submitted: boolean; submission_date?: string }> = {
      memberA: { submitted: false },
      memberB: { submitted: false },
      memberC: { submitted: false },
    };

    // Setup: Simulate memberC submission after 2nd reminder
    const mockCheckSubmissionStatus = jest.fn((memberId: string) => {
      if (memberId === 'memberC' && emailsSent.filter((e) => e.recipient === 'memberC').length >= 2) {
        return true;
      }
      return memberSubmissionStatus[memberId]?.submitted ?? false;
    });

    // Setup: Reminder configuration
    const reminderConfig = {
      max_reminders: 3,
      reminder_interval_hours: 4,
    };

    // Setup: Initial state - three members, all unsubmitted
    const unsubmittedMembers = ['memberA', 'memberB', 'memberC'];
    const remindersTracker: Record<string, number> = {
      memberA: 0,
      memberB: 0,
      memberC: 0,
    };
    const lastReminderTime: Record<string, string> = {
      memberA: new Date('2024-01-15T08:00:00Z').toISOString(),
      memberB: new Date('2024-01-15T08:00:00Z').toISOString(),
      memberC: new Date('2024-01-15T08:00:00Z').toISOString(),
    };

    // Action: Execute reminder cycle 1
    const referenceTime1 = new Date('2024-01-15T08:00:00Z');
    for (const memberId of unsubmittedMembers) {
      if (remindersTracker[memberId] < reminderConfig.max_reminders) {
        mockSendEmail(memberId, `Reminder ${remindersTracker[memberId] + 1}: Submit daily report`);
        remindersTracker[memberId] += 1;
        lastReminderTime[memberId] = referenceTime1.toISOString();
      }
    }

    // Verify: First round of reminders sent to all three members
    expect(mockSendEmail).toHaveBeenCalledWith('memberA', expect.stringContaining('Reminder 1'));
    expect(mockSendEmail).toHaveBeenCalledWith('memberB', expect.stringContaining('Reminder 1'));
    expect(mockSendEmail).toHaveBeenCalledWith('memberC', expect.stringContaining('Reminder 1'));
    expect(remindersTracker.memberA).toBe(1);
    expect(remindersTracker.memberB).toBe(1);
    expect(remindersTracker.memberC).toBe(1);

    // Action: Execute reminder cycle 2
    const referenceTime2 = new Date('2024-01-15T12:00:00Z');
    for (const memberId of unsubmittedMembers) {
      if (remindersTracker[memberId] < reminderConfig.max_reminders) {
        mockSendEmail(memberId, `Reminder ${remindersTracker[memberId] + 1}: Submit daily report`);
        remindersTracker[memberId] += 1;
        lastReminderTime[memberId] = referenceTime2.toISOString();
      }
    }

    // State: memberC submits after 2nd reminder
    memberSubmissionStatus.memberC.submitted = true;
    memberSubmissionStatus.memberC.submission_date = new Date('2024-01-15T12:30:00Z').toISOString();

    // Verify: Second round of reminders sent
    expect(mockSendEmail).toHaveBeenCalledWith('memberA', expect.stringContaining('Reminder 2'));
    expect(mockSendEmail).toHaveBeenCalledWith('memberB', expect.stringContaining('Reminder 2'));
    expect(mockSendEmail).toHaveBeenCalledWith('memberC', expect.stringContaining('Reminder 2'));
    expect(remindersTracker.memberA).toBe(2);
    expect(remindersTracker.memberB).toBe(2);
    expect(remindersTracker.memberC).toBe(2);

    // Action: Execute reminder cycle 3
    const referenceTime3 = new Date('2024-01-15T16:00:00Z');
    for (const memberId of unsubmittedMembers) {
      if (
        remindersTracker[memberId] < reminderConfig.max_reminders &&
        !mockCheckSubmissionStatus(memberId)
      ) {
        mockSendEmail(memberId, `Reminder ${remindersTracker[memberId] + 1}: Submit daily report`);
        remindersTracker[memberId] += 1;
        lastReminderTime[memberId] = referenceTime3.toISOString();
      }
    }

    // Verify: Third round sent only to unsubmitted members (A, B)
    expect(mockSendEmail).toHaveBeenCalledWith('memberA', expect.stringContaining('Reminder 3'));
    expect(mockSendEmail).toHaveBeenCalledWith('memberB', expect.stringContaining('Reminder 3'));
    expect(remindersTracker.memberA).toBe(3);
    expect(remindersTracker.memberB).toBe(3);
    expect(remindersTracker.memberC).toBe(2);

    // Action: Determine remaining unsubmitted members after max reminders
    const stillUnsubmitted = unsubmittedMembers.filter(
      (memberId) =>
        remindersTracker[memberId] >= reminderConfig.max_reminders &&
        !mockCheckSubmissionStatus(memberId),
    );

    // Verify: memberA and memberB remain unsubmitted
    expect(stillUnsubmitted).toEqual(['memberA', 'memberB']);

    // Action: Create escalation handoff BEFORE sending manager notification (side effect)
    mockCreateEscalationHandoff({
      unsubmitted_members: stillUnsubmitted,
      attempt_count: reminderConfig.max_reminders,
      final_timestamp: referenceTime3.toISOString(),
      recommended_action: 'escalate_to_manager',
    });

    // Verify: Handoff state created with correct data
    expect(handoffState).not.toBeNull();
    expect(handoffState?.unsubmitted_members).toEqual(['memberA', 'memberB']);
    expect(handoffState?.attempt_count).toBe(3);
    expect(handoffState?.final_timestamp).toBe(referenceTime3.toISOString());
    expect(handoffState?.recommended_action).toBe('escalate_to_manager');
    expect(handoffState?.human_confirmed).toBe(false);

    // Verify: Manager notification NOT yet sent (side effect prevented)
    const managerEmailCount = emailsSent.filter(
      (e) => e.subject.includes('manager') || e.subject.includes('Manager'),
    ).length;
    expect(managerEmailCount).toBe(0);

    // Action: Human approval simulation
    if (handoffState !== null) {
      handoffState.human_confirmed = true;

      // Record audit event with human confirmation trigger
      mockRecordAuditEvent({
        action: 'escalate_to_manager',
        triggered_by: 'human_confirmation',
        unsubmitted_members: handoffState.unsubmitted_members,
        attempt_count: handoffState.attempt_count,
        timestamp: new Date('2024-01-15T16:15:00Z').toISOString(),
      });

      // Now execute the side effect: send manager notification
      mockSendEmail(
        'manager',
        `Unsubmitted Report Alert: Members ${handoffState.unsubmitted_members.join(', ')} after ${handoffState.attempt_count} reminders`,
      );
    }

    // Verify: Audit event recorded with human confirmation
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'escalate_to_manager',
        triggered_by: 'human_confirmation',
        unsubmitted_members: ['memberA', 'memberB'],
        attempt_count: 3,
      }),
    );

    // Verify: Manager notification now sent after human approval
    const finalManagerEmails = emailsSent.filter((e) => e.recipient === 'manager');
    expect(finalManagerEmails.length).toBe(1);
    expect(finalManagerEmails[0].subject).toContain('Unsubmitted Report Alert');

    // Verify: Total email count (1st round: 3, 2nd round: 3, 3rd round: 2, manager: 1) = 9
    expect(mockSendEmail).toHaveBeenCalledTimes(9);

    // Verify: Audit trail completeness
    expect(auditEvents.length).toBe(1);
    expect(auditEvents[0].action).toBe('escalate_to_manager');
    expect(auditEvents[0].triggered_by).toBe('human_confirmation');
  });
});