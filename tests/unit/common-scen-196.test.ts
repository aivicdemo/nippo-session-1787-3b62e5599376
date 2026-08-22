import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import type { Tx11AgentInput, Tx11AgentOutput, SubmissionStatusSummary, PrioritizedIssue, NotificationRecord } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('Tx11Imp1Agent - 日報収集・確認・催促の自動化エージェント', () => {
  // SCEN-196: [normal] 期限までに未提出のメンバーに自動催促通知を送る
  test('should send reminder notifications to unsubmitted members by deadline', async () => {
    // Setup: In-memory DB for submission status
    const executionTimestamp = new Date('2024-01-15T09:30:00Z');
    const reportDeadlineTime = '09:00';
    const teamId = 'team-001';
    const managerEmail = 'manager@company.com';

    // Member data: 10 members, all unsubmitted as of 09:30 (30 minutes after deadline)
    const unsubmittedMembers = [
      'member-a@company.com',
      'member-b@company.com',
      'member-c@company.com',
      'member-d@company.com',
      'member-e@company.com',
      'member-f@company.com',
      'member-g@company.com',
      'member-h@company.com',
      'member-i@company.com',
      'member-j@company.com'
    ];

    // Track audit log events
    const auditLog: Array<{
      timestamp: Date;
      action: string;
      targetCount: number;
      result: string;
      details: Record<string, unknown>;
    }> = [];

    // Track notification history
    const notificationHistory: Array<{
      sentAt: Date;
      recipientEmail: string;
      recipientName: string;
      subject: string;
      body: string;
      reason: string;
    }> = [];

    // Track sent emails for verification
    const sentEmails: Array<{
      to: string;
      subject: string;
      body: string;
    }> = [];

    // Stub AI client for Tx11Imp1AiClient interface
    const stubAiClient = {
      // Action 1: Fetch submission status
      fetchSubmissionStatus: jest.fn().mockResolvedValue({
        totalMembers: 10,
        submittedCount: 0,
        unsubmittedMembers: unsubmittedMembers
      }),

      // Action 2: Send reminder notifications
      sendReminderNotifications: jest.fn().mockImplementation(async (unsubmitted: string[]) => {
        const sentRecords: NotificationRecord[] = [];
        for (const memberEmail of unsubmitted) {
          const memberName = memberEmail.split('@')[0];
          const subject = '【重要】本日の日報提出のお願い';
          const body = `${memberName}さん\n\nお疲れさまです。本日09:00までに日報をご提出ください。\n\n現在、ご提出がお済みでないようです。\nお手数ですが、早急にご提出ください。\n\nよろしくお願いいたします。`;
          
          sentEmails.push({
            to: memberEmail,
            subject: subject,
            body: body
          });

          notificationHistory.push({
            sentAt: executionTimestamp,
            recipientEmail: memberEmail,
            recipientName: memberName,
            subject: subject,
            body: body,
            reason: '期限超過未提出'
          });

          sentRecords.push({
            recipientEmail: memberEmail,
            sentAt: executionTimestamp,
            subject: subject,
            status: 'success'
          });
        }

        auditLog.push({
          timestamp: executionTimestamp,
          action: 'action_2_send_reminder_notifications',
          targetCount: sentRecords.length,
          result: 'success',
          details: {
            recipientCount: sentRecords.length,
            recipients: unsubmitted
          }
        });

        return sentRecords;
      }),

      // Action 3: Extract issues
      extractIssues: jest.fn().mockResolvedValue([]),

      // Action 4: Prioritize issues
      prioritizeIssues: jest.fn().mockResolvedValue([]),

      // Action 5: Generate summary report
      generateSummaryReport: jest.fn().mockResolvedValue({
        submittedCount: 0,
        unsubmittedCount: 10,
        submissionRate: 0
      }),

      // Action 6: Send manager summary
      sendManagerSummary: jest.fn().mockResolvedValue({
        sent: true,
        timestamp: executionTimestamp
      }),

      // Action 7: Log audit event
      logAuditEvent: jest.fn().mockImplementation(async (event) => {
        auditLog.push({
          timestamp: event.timestamp,
          action: event.action,
          targetCount: event.targetCount,
          result: event.result,
          details: event.details
        });
      })
    };

    // Input for orchestrator
    const input: Tx11AgentInput = {
      executionTimestamp: executionTimestamp,
      teamId: teamId,
      reportDeadlineTime: reportDeadlineTime,
      managerEmail: managerEmail
    };

    // Execute orchestrator
    const output: Tx11AgentOutput = await runTx11Imp1Agent(input, stubAiClient);

    // === ASSERTIONS ===

    // 1. Verify output structure
    expect(output).toBeDefined();
    expect(output.submissionStatus).toBeDefined();
    expect(output.notificationsSent).toBeDefined();
    expect(output.summaryEmailSent).toBeDefined();

    // 2. Verify submission status
    expect(output.submissionStatus.totalMembers).toBe(10);
    expect(output.submissionStatus.submittedCount).toBe(0);
    expect(output.submissionStatus.unsubmittedMembers).toHaveLength(10);
    expect(output.submissionStatus.unsubmittedMembers).toEqual(unsubmittedMembers);

    // 3. Verify reminder notifications were sent
    expect(output.notificationsSent).toHaveLength(10);
    expect(sentEmails).toHaveLength(10);

    // 4. Verify each email sent to correct recipient
    for (let i = 0; i < sentEmails.length; i++) {
      const email = sentEmails[i];
      expect(email.to).toBe(unsubmittedMembers[i]);
    }

    // 5. Verify subject line contains required keywords
    for (const email of sentEmails) {
      expect(email.subject).toMatch(/日報提出/);
      expect(email.subject).toMatch(/お願い/);
    }

    // 6. Verify body content includes deadline and member names
    for (const email of sentEmails) {
      const memberName = email.to.split('@')[0];
      expect(email.body).toMatch(new RegExp(memberName));
      expect(email.body).toMatch(/09:00/);
      expect(email.body).toMatch(/提出/);
    }

    // 7. Verify notification history recorded correctly
    expect(notificationHistory).toHaveLength(10);
    for (let i = 0; i < notificationHistory.length; i++) {
      const record = notificationHistory[i];
      expect(record.sentAt).toEqual(executionTimestamp);
      expect(record.reason).toBe('期限超過未提出');
      expect(unsubmittedMembers).toContain(record.recipientEmail);
    }

    // 8. Verify audit log contains action 2 execution
    const action2Log = auditLog.find(log => log.action === 'action_2_send_reminder_notifications');
    expect(action2Log).toBeDefined();
    expect(action2Log?.targetCount).toBe(10);
    expect(action2Log?.result).toBe('success');
    expect(action2Log?.timestamp).toEqual(executionTimestamp);
    expect(action2Log?.details.recipientCount).toBe(10);

    // 9. Verify no duplicate notifications for same member
    const recipientEmails = sentEmails.map(e => e.to);
    const uniqueRecipients = new Set(recipientEmails);
    expect(uniqueRecipients.size).toBe(10);

    // 10. Verify all unsubmitted members received notification
    for (const memberEmail of unsubmittedMembers) {
      expect(sentEmails.map(e => e.to)).toContain(memberEmail);
    }

    // 11. Verify AI client was called with correct parameters
    expect(stubAiClient.fetchSubmissionStatus).toHaveBeenCalled();
    expect(stubAiClient.sendReminderNotifications).toHaveBeenCalledWith(unsubmittedMembers);

    // 12. Verify submission status in output matches expected
    expect(output.submissionStatus.submissionRate).toBeDefined();
    expect(output.submissionStatus.submissionRate).toBe(0);
  });
});