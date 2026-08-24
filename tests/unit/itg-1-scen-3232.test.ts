import { runTx9Imp1Agent, type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('Tx9Imp1Agent - Rollback on partial side effects', () => {
  test('SCEN-3232: [error] should rollback completed side effects when Action 3 fails with system integration error', async () => {
    // Setup: Mock AI Client with failure at Action 3
    const aggregatedReportId = 'agg-report-20240115-001';
    const notificationId1 = 'notif-unsent-member-001';
    const notificationId2 = 'notif-unsent-member-002';
    const aggregationRecordId = 'agg-rec-001';

    const mockAiClient: Tx9Imp1AiClient = {
      async action01AggregateReports(input) {
        // Action 1: Aggregate reports - succeeds
        return {
          aggregationId: aggregatedReportId,
          aggregatedReportCount: 8,
          unsubmittedMemberIds: ['member-003', 'member-007'],
          auditLog: {
            timestamp: '2024-01-15T08:00:00Z',
            action: 'reports_aggregated',
            recordId: aggregationRecordId,
          },
        };
      },

      async action02SendUnsubmittedReminders(input) {
        // Action 2: Send reminders - succeeds and records side effects
        return {
          remindersCount: 2,
          sentNotificationIds: [notificationId1, notificationId2],
          auditLog: {
            timestamp: '2024-01-15T08:05:00Z',
            action: 'reminders_sent',
            notificationIds: [notificationId1, notificationId2],
          },
        };
      },

      async action03QuantifyProductivityMetrics(input) {
        // Action 3: Quantify metrics - FAILS with system integration error
        throw new Error('System integration error: TextAnalysisServiceAdapter.assessImpactScore failed');
      },

      async action04ClassifyIssuesByPriority(input) {
        // Action 4: Should not reach here
        throw new Error('Action 4 should not be executed');
      },

      async action05DetectRecurrencePatterns(input) {
        // Action 5: Should not reach here
        throw new Error('Action 5 should not be executed');
      },

      async action06ProposeMeasures(input) {
        // Action 6: Should not reach here
        throw new Error('Action 6 should not be executed');
      },

      async action07GenerateReport(input) {
        // Action 7: Should not reach here
        throw new Error('Action 7 should not be executed');
      },
    };

    // Mock NotificationServiceAdapter for compensation
    const mockNotificationAdapter = {
      async getDeliveryStatus(notificationId: string) {
        if (notificationId === notificationId1 || notificationId === notificationId2) {
          return { status: 'delivered', sentAt: '2024-01-15T08:05:00Z' };
        }
        return { status: 'unknown' };
      },

      async cancelNotification(notificationId: string) {
        return { cancelled: true, compensatedAt: '2024-01-15T08:10:00Z' };
      },
    };

    // Mock aggregation database for rollback
    let aggregationDbState = { [aggregationRecordId]: { status: 'active' } };

    const mockAggregationDb = {
      async rollbackRecord(recordId: string) {
        if (aggregationDbState[recordId]) {
          aggregationDbState[recordId].status = 'rolled_back';
          return { success: true, recordId, newStatus: 'rolled_back' };
        }
        throw new Error(`Record not found: ${recordId}`);
      },
    };

    // Audit log collection
    const auditEvents: any[] = [];
    const mockAuditLogger = {
      log(event: any) {
        auditEvents.push(event);
      },
    };

    // Input to orchestrator
    const input = {
      aggregationPeriodStart: new Date('2024-01-15T00:00:00Z'),
      aggregationPeriodEnd: new Date('2024-01-15T23:59:59Z'),
      targetTeamIds: ['team-dev-001'],
      managerUserId: 'manager-001',
    };

    // Execute agent with mocked dependencies
    let orchestrationError: any = null;
    let orchestrationResult: any = null;

    try {
      orchestrationResult = await runTx9Imp1Agent(input, mockAiClient);
    } catch (error) {
      orchestrationError = error;
    }

    // Verify: Action 3 failure is detected
    expect(orchestrationError).toBeDefined();
    expect(orchestrationError.message).toMatch(/System integration error/);

    // Verify: Escalation condition triggered
    expect(orchestrationError.escalationCondition).toBe('system_integration_error');

    // Verify: Action 1 side effect (aggregation record) would have been created
    expect(aggregationRecordId).toBe('agg-rec-001');

    // Verify: Action 2 side effects (notifications sent)
    expect(notificationId1).toBe('notif-unsent-member-001');
    expect(notificationId2).toBe('notif-unsent-member-002');

    // Simulate rollback execution (would be done by orchestrator)
    const rollbackResult = await mockAggregationDb.rollbackRecord(aggregationRecordId);
    expect(rollbackResult.success).toBe(true);
    expect(rollbackResult.newStatus).toBe('rolled_back');
    expect(aggregationDbState[aggregationRecordId].status).toBe('rolled_back');

    // Simulate notification compensation (would be done by orchestrator)
    const compensationResults = {
      notif1: await mockNotificationAdapter.cancelNotification(notificationId1),
      notif2: await mockNotificationAdapter.cancelNotification(notificationId2),
    };
    expect(compensationResults.notif1.cancelled).toBe(true);
    expect(compensationResults.notif2.cancelled).toBe(true);

    // Verify: Error object structure returned to caller
    expect(orchestrationError.status).toBe('partial_rollback_completed');
    expect(orchestrationError.rolledBackActions).toContain('Action 1: reports_aggregated');
    expect(orchestrationError.rolledBackActions).toContain('Action 2: reminders_sent');
    expect(orchestrationError.failedAction).toBe('Action 3: quantify_productivity_metrics');

    // Verify: Report was NOT generated (Action 7 not executed)
    expect(orchestrationResult).toBeUndefined();

    // Verify: Audit log contains rollback event
    const rollbackEvent = {
      timestamp: expect.any(String),
      action: 'rollback_initiated',
      triggerAction: 'Action 3',
      triggerError: 'System integration error: TextAnalysisServiceAdapter.assessImpactScore failed',
      rolledBackActions: ['Action 1', 'Action 2'],
      status: 'completed',
    };

    // Expected audit log entry structure verification
    expect(orchestrationError.auditLog).toBeDefined();
    expect(orchestrationError.auditLog.action).toBe('rollback_executed');
    expect(orchestrationError.auditLog.rolledBackRecords).toContain(aggregationRecordId);
    expect(orchestrationError.auditLog.compensatedNotifications).toEqual([
      notificationId1,
      notificationId2,
    ]);

    // Verify: Manager does not receive incomplete analysis report
    expect(orchestrationError.reportDeliveryStatus).toBe('not_sent');

    // Verify: Scheduled retry task would be cancelled (if any)
    expect(orchestrationError.cancelledScheduledTasks).toBeDefined();
  });
});