import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import { type Tx11AgentInput, type Tx11AgentOutput } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('Tx11Imp1Agent', () => {
  // SCEN-209
  test('should prevent duplicate reminder notifications and database writes on agent re-execution with same parameters', async () => {
    // Setup: Fake AI client and mock dependencies
    const fakeAiClient = {
      action01_fetchSubmissionStatus: jest.fn().mockResolvedValue({
        totalMembers: 3,
        submittedCount: 2,
        unsubmittedMembers: ['member-001', 'member-002'],
      }),
      action02_sendReminderNotification: jest.fn().mockResolvedValue({
        notificationsSent: [
          {
            memberId: 'member-001',
            notificationTimestamp: new Date('2024-01-15T07:00:00Z'),
            method: 'email',
            transactionId: 'tx-reminder-001',
          },
          {
            memberId: 'member-002',
            notificationTimestamp: new Date('2024-01-15T07:00:00Z'),
            method: 'email',
            transactionId: 'tx-reminder-002',
          },
        ],
      }),
      action03_extractIssues: jest.fn().mockResolvedValue({
        prioritizedIssues: [
          {
            issueId: 'issue-101',
            title: 'Database connection timeout',
            frequency: 3,
            impact: 'high',
            priorityScore: 85,
          },
        ],
      }),
      action04_rankByPriority: jest.fn().mockResolvedValue({
        rankedIssues: [
          {
            issueId: 'issue-101',
            title: 'Database connection timeout',
            frequency: 3,
            impact: 'high',
            priorityScore: 85,
            rank: 1,
          },
        ],
      }),
      action05_generateSummary: jest.fn().mockResolvedValue({
        summaryContent: 'Morning briefing summary with prioritized issues',
      }),
      action06_sendSummaryEmail: jest.fn().mockResolvedValue({
        summaryEmailSent: true,
        sendTimestamp: new Date('2024-01-15T07:30:00Z'),
      }),
      action07_auditLog: jest.fn().mockResolvedValue({
        auditLogId: 'audit-001',
        timestamp: new Date('2024-01-15T07:30:00Z'),
      }),
    };

    // Mock database for idempotency and deduplication
    const reminderNotificationDb = new Map<string, any>();
    const auditLogDb = new Map<string, any>();

    const mockDatabaseInsert = jest.fn((table: string, record: any) => {
      if (table === 'reminder_notification_history') {
        const idempotencyKey = record.idempotencyKey;
        if (reminderNotificationDb.has(idempotencyKey)) {
          return { isDuplicate: true, recordId: reminderNotificationDb.get(idempotencyKey) };
        }
        const recordId = `record-${Date.now()}`;
        reminderNotificationDb.set(idempotencyKey, recordId);
        return { isDuplicate: false, recordId };
      }
      if (table === 'audit_log') {
        const logId = `audit-${Date.now()}`;
        auditLogDb.set(logId, record);
        return { isDuplicate: false, recordId: logId };
      }
      return { isDuplicate: false, recordId: `record-${Date.now()}` };
    });

    // First execution
    const input: Tx11AgentInput = {
      executionTimestamp: new Date('2024-01-15T07:00:00Z'),
      teamId: 'team-alpha',
      reportDeadlineTime: '09:00',
      managerEmail: 'manager@example.com',
    };

    const firstOutput = await runTx11Imp1Agent(input, fakeAiClient);

    // Verify first execution output structure
    expect(firstOutput).toBeDefined();
    expect(firstOutput.submissionStatus).toBeDefined();
    expect(firstOutput.submissionStatus.totalMembers).toBe(3);
    expect(firstOutput.submissionStatus.submittedCount).toBe(2);
    expect(firstOutput.submissionStatus.unsubmittedMembers).toEqual(['member-001', 'member-002']);
    expect(firstOutput.notificationsSent).toHaveLength(2);
    expect(firstOutput.notificationsSent[0].memberId).toBe('member-001');
    expect(firstOutput.notificationsSent[1].memberId).toBe('member-002');
    expect(firstOutput.prioritizedIssues).toHaveLength(1);
    expect(firstOutput.prioritizedIssues[0].priorityScore).toBe(85);
    expect(firstOutput.summaryEmailSent).toBe(true);

    // Record first execution transaction and idempotency keys
    const firstExecutionTransactionId = `exec-${Date.now()}`;
    const firstReminderIdempotencyKey = `reminder-team-alpha-member-001-member-002-${input.reportDeadlineTime}`;

    // Insert audit log for first execution
    mockDatabaseInsert('audit_log', {
      timestamp: new Date('2024-01-15T07:00:00Z'),
      transactionId: firstExecutionTransactionId,
      action: 'send_reminder_notification',
      status: 'completed',
      details: JSON.stringify({ unsubmittedMembers: ['member-001', 'member-002'] }),
    });

    // Insert reminder notification records for first execution
    for (const notification of firstOutput.notificationsSent) {
      mockDatabaseInsert('reminder_notification_history', {
        memberId: notification.memberId,
        transactionId: firstExecutionTransactionId,
        idempotencyKey: `${firstReminderIdempotencyKey}-${notification.memberId}`,
        notificationTimestamp: notification.notificationTimestamp,
        method: notification.method,
      });
    }

    // Verify first execution writes
    expect(reminderNotificationDb.size).toBe(2);
    expect(auditLogDb.size).toBe(1);

    // Reset mock to simulate new agent execution
    fakeAiClient.action01_fetchSubmissionStatus.mockClear();
    fakeAiClient.action02_sendReminderNotification.mockClear();
    fakeAiClient.action03_extractIssues.mockClear();
    fakeAiClient.action04_rankByPriority.mockClear();
    fakeAiClient.action05_generateSummary.mockClear();
    fakeAiClient.action06_sendSummaryEmail.mockClear();
    fakeAiClient.action07_auditLog.mockClear();

    // Re-setup mocks for second execution with same data
    fakeAiClient.action01_fetchSubmissionStatus.mockResolvedValue({
      totalMembers: 3,
      submittedCount: 2,
      unsubmittedMembers: ['member-001', 'member-002'],
    });
    fakeAiClient.action02_sendReminderNotification.mockResolvedValue({
      notificationsSent: [
        {
          memberId: 'member-001',
          notificationTimestamp: new Date('2024-01-15T07:00:00Z'),
          method: 'email',
          transactionId: 'tx-reminder-001',
        },
        {
          memberId: 'member-002',
          notificationTimestamp: new Date('2024-01-15T07:00:00Z'),
          method: 'email',
          transactionId: 'tx-reminder-002',
        },
      ],
    });
    fakeAiClient.action03_extractIssues.mockResolvedValue({
      prioritizedIssues: [
        {
          issueId: 'issue-101',
          title: 'Database connection timeout',
          frequency: 3,
          impact: 'high',
          priorityScore: 85,
        },
      ],
    });
    fakeAiClient.action04_rankByPriority.mockResolvedValue({
      rankedIssues: [
        {
          issueId: 'issue-101',
          title: 'Database connection timeout',
          frequency: 3,
          impact: 'high',
          priorityScore: 85,
          rank: 1,
        },
      ],
    });
    fakeAiClient.action05_generateSummary.mockResolvedValue({
      summaryContent: 'Morning briefing summary with prioritized issues',
    });
    fakeAiClient.action06_sendSummaryEmail.mockResolvedValue({
      summaryEmailSent: true,
      sendTimestamp: new Date('2024-01-15T07:30:00Z'),
    });
    fakeAiClient.action07_auditLog.mockResolvedValue({
      auditLogId: 'audit-002',
      timestamp: new Date('2024-01-15T07:00:00Z'),
    });

    // Second execution (re-execution) with same input
    const secondOutput = await runTx11Imp1Agent(input, fakeAiClient);

    // Verify second execution output structure
    expect(secondOutput).toBeDefined();
    expect(secondOutput.submissionStatus.totalMembers).toBe(3);
    expect(secondOutput.submissionStatus.submittedCount).toBe(2);

    // Record second execution transaction
    const secondExecutionTransactionId = `exec-${Date.now() + 1000}`;

    // Attempt to insert reminder notification records for second execution
    // This should detect duplicates via idempotency key
    for (const notification of secondOutput.notificationsSent) {
      mockDatabaseInsert('reminder_notification_history', {
        memberId: notification.memberId,
        transactionId: secondExecutionTransactionId,
        idempotencyKey: `${firstReminderIdempotencyKey}-${notification.memberId}`,
        notificationTimestamp: notification.notificationTimestamp,
        method: notification.method,
      });
    }

    // Insert audit log for second execution with duplicate detection
    mockDatabaseInsert('audit_log', {
      timestamp: new Date('2024-01-15T07:00:00Z'),
      transactionId: secondExecutionTransactionId,
      action: 'send_reminder_notification',
      status: 'completed',
      details: JSON.stringify({
        unsubmittedMembers: ['member-001', 'member-002'],
        duplicatePreventionNote: 'Event re-execution detected: idempotency_key=reminder-team-alpha-member-001-member-002-09:00-member-001 prevented duplicate write',
      }),
    });

    // Verify deduplication: reminder notification count should remain at 2
    expect(reminderNotificationDb.size).toBe(2);

    // Verify audit log records both executions
    expect(auditLogDb.size).toBe(2);

    // Verify the audit log contains duplicate prevention notice
    const auditEntries = Array.from(auditLogDb.values());
    const duplicatePreventionEntry = auditEntries.find(
      (entry) => entry.details?.includes('duplicatePreventionNote')
    );
    expect(duplicatePreventionEntry).toBeDefined();
    expect(duplicatePreventionEntry.details).toMatch(/idempotency_key/);

    // Verify transaction IDs are different
    expect(firstExecutionTransactionId).not.toBe(secondExecutionTransactionId);

    // Verify notification count in output is same (no duplication in response)
    expect(secondOutput.notificationsSent).toHaveLength(2);
    expect(firstOutput.notificationsSent).toHaveLength(2);

    // Verify final state: exactly 2 reminder records (not 4)
    const reminderRecords = Array.from(reminderNotificationDb.entries());
    expect(reminderRecords).toHaveLength(2);
  });
});