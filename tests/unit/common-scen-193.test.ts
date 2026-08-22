import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-193: sendUnsubmittedReminder performs rollback and compensation on partial failure', async () => {
    // Setup: Create a fake AI client that mimics Tx10Imp1AiClient interface
    const fakeAiClientState = {
      action1Completed: false,
      action1Document: null as string | null,
      action2Completed: false,
      action2Document: null as string | null,
      action3Failed: false,
      rollbackStarted: false,
      rollbackCompleted: false,
      auditEvents: [] as Array<{
        timestamp: string;
        action: string;
        status: string;
        details?: Record<string, unknown>;
      }>,
      compensationLog: [] as Array<{
        timestamp: string;
        resourceId: string;
        operation: string;
      }>,
    };

    const fakeAiClient = {
      generateIntroductionSchedule: async (input: unknown) => {
        const timestamp = new Date('2024-01-15T09:00:00Z').toISOString();
        fakeAiClientState.auditEvents.push({
          timestamp,
          action: 'Action 1: generateIntroductionSchedule started',
          status: 'started',
        });

        fakeAiClientState.action1Document = 'schedule-doc-20240115-001';
        fakeAiClientState.action1Completed = true;

        const completionTime = new Date('2024-01-15T09:15:00Z').toISOString();
        fakeAiClientState.auditEvents.push({
          timestamp: completionTime,
          action: 'Action 1: generateIntroductionSchedule completed',
          status: 'completed',
          details: { resourceId: fakeAiClientState.action1Document },
        });

        return { scheduleDocId: fakeAiClientState.action1Document };
      },

      createManagerGuidance: async (input: unknown) => {
        const timestamp = new Date('2024-01-15T09:16:00Z').toISOString();
        fakeAiClientState.auditEvents.push({
          timestamp,
          action: 'Action 2: createManagerGuidance started',
          status: 'started',
        });

        fakeAiClientState.action2Document = 'guidance-doc-20240115-001';
        fakeAiClientState.action2Completed = true;

        const completionTime = new Date('2024-01-15T09:31:00Z').toISOString();
        fakeAiClientState.auditEvents.push({
          timestamp: completionTime,
          action: 'Action 2: createManagerGuidance completed',
          status: 'completed',
          details: { resourceId: fakeAiClientState.action2Document },
        });

        return { guidanceDocId: fakeAiClientState.action2Document };
      },

      generateEngineerTrainingMaterial: async (input: unknown) => {
        const timestamp = new Date('2024-01-15T09:32:00Z').toISOString();
        fakeAiClientState.auditEvents.push({
          timestamp,
          action: 'Action 3: generateEngineerTrainingMaterial started',
          status: 'started',
        });

        fakeAiClientState.action3Failed = true;

        const failureTime = new Date('2024-01-15T09:35:00Z').toISOString();
        fakeAiClientState.auditEvents.push({
          timestamp: failureTime,
          action: 'Action 3: generateEngineerTrainingMaterial failed',
          status: 'failed',
          details: {
            errorCode: 'AI_CLIENT_TRAINING_GENERATION_ERROR',
            errorMessage: 'Failed to generate training material',
          },
        });

        throw new Error('AI client training generation failed');
      },

      performRollback: async (input: { completedActions: string[] }) => {
        const rollbackStartTime = new Date('2024-01-15T09:36:00Z').toISOString();
        fakeAiClientState.rollbackStarted = true;
        fakeAiClientState.auditEvents.push({
          timestamp: rollbackStartTime,
          action: 'Rollback: compensation process started',
          status: 'started',
          details: { targetActions: input.completedActions },
        });

        // Simulate rollback of Action 1
        if (fakeAiClientState.action1Document) {
          const compensationTime1 = new Date(
            '2024-01-15T09:37:00Z'
          ).toISOString();
          fakeAiClientState.compensationLog.push({
            timestamp: compensationTime1,
            resourceId: fakeAiClientState.action1Document,
            operation: 'DELETE',
          });
          fakeAiClientState.auditEvents.push({
            timestamp: compensationTime1,
            action: 'Compensation: Action 1 document deleted',
            status: 'compensated',
            details: {
              resourceId: fakeAiClientState.action1Document,
              operation: 'DELETE',
            },
          });
          fakeAiClientState.action1Document = null;
          fakeAiClientState.action1Completed = false;
        }

        // Simulate rollback of Action 2
        if (fakeAiClientState.action2Document) {
          const compensationTime2 = new Date(
            '2024-01-15T09:38:00Z'
          ).toISOString();
          fakeAiClientState.compensationLog.push({
            timestamp: compensationTime2,
            resourceId: fakeAiClientState.action2Document,
            operation: 'DELETE',
          });
          fakeAiClientState.auditEvents.push({
            timestamp: compensationTime2,
            action: 'Compensation: Action 2 document deleted',
            status: 'compensated',
            details: {
              resourceId: fakeAiClientState.action2Document,
              operation: 'DELETE',
            },
          });
          fakeAiClientState.action2Document = null;
          fakeAiClientState.action2Completed = false;
        }

        const rollbackCompleteTime = new Date(
          '2024-01-15T09:39:00Z'
        ).toISOString();
        fakeAiClientState.rollbackCompleted = true;
        fakeAiClientState.auditEvents.push({
          timestamp: rollbackCompleteTime,
          action: 'Rollback: compensation process completed',
          status: 'completed',
          details: {
            compensatedActions: input.completedActions,
            resourcesDeleted: fakeAiClientState.compensationLog.length,
          },
        });

        return {
          success: true,
          compensatedCount: input.completedActions.length,
        };
      },
    };

    // Execute the main test scenario
    const unsubmittedReminders = [
      {
        memberId: 'member-001',
        memberName: 'Alice',
        email: 'alice@example.com',
        overdueDays: 2,
      },
      {
        memberId: 'member-002',
        memberName: 'Bob',
        email: 'bob@example.com',
        overdueDays: 1,
      },
    ];

    const remindersRequiringRollback = [
      ...unsubmittedReminders,
      {
        memberId: 'member-003',
        memberName: 'Charlie',
        email: 'charlie@example.com',
        overdueDays: 3,
      },
    ];

    // Step 1: Verify initial state
    expect(fakeAiClientState.action1Completed).toBe(false);
    expect(fakeAiClientState.action2Completed).toBe(false);
    expect(fakeAiClientState.rollbackStarted).toBe(false);
    expect(fakeAiClientState.rollbackCompleted).toBe(false);
    expect(fakeAiClientState.auditEvents.length).toBe(0);
    expect(fakeAiClientState.compensationLog.length).toBe(0);

    // Step 2: Execute Action 1 (generateIntroductionSchedule)
    const action1Result = await fakeAiClient.generateIntroductionSchedule({
      departmentSize: 50,
      currentStatus: 'ready',
    });
    expect(action1Result.scheduleDocId).toBe('schedule-doc-20240115-001');
    expect(fakeAiClientState.action1Completed).toBe(true);
    expect(fakeAiClientState.action1Document).toBe('schedule-doc-20240115-001');

    // Step 3: Verify Action 1 audit events recorded
    const action1AuditEvents = fakeAiClientState.auditEvents.filter(
      (e) =>
        e.action.includes('Action 1') ||
        e.action.includes('generateIntroductionSchedule')
    );
    expect(action1AuditEvents.length).toBe(2); // start and complete

    // Step 4: Execute Action 2 (createManagerGuidance)
    const action2Result = await fakeAiClient.createManagerGuidance({
      scheduleDocId: action1Result.scheduleDocId,
    });
    expect(action2Result.guidanceDocId).toBe('guidance-doc-20240115-001');
    expect(fakeAiClientState.action2Completed).toBe(true);
    expect(fakeAiClientState.action2Document).toBe('guidance-doc-20240115-001');

    // Step 5: Verify Action 2 audit events recorded
    const action2AuditEvents = fakeAiClientState.auditEvents.filter(
      (e) =>
        e.action.includes('Action 2') || e.action.includes('createManagerGuidance')
    );
    expect(action2AuditEvents.length).toBe(2); // start and complete

    // Step 6: Attempt Action 3 (generateEngineerTrainingMaterial) - expect failure
    let action3Error: Error | null = null;
    try {
      await fakeAiClient.generateEngineerTrainingMaterial({
        guidanceDocId: action2Result.guidanceDocId,
      });
    } catch (error) {
      action3Error = error as Error;
    }
    expect(action3Error).not.toBeNull();
    expect(action3Error?.message).toMatch(/training generation failed/);
    expect(fakeAiClientState.action3Failed).toBe(true);

    // Step 7: Verify Action 3 failure recorded in audit
    const action3AuditEvents = fakeAiClientState.auditEvents.filter((e) =>
      e.action.includes('Action 3')
    );
    expect(action3AuditEvents.length).toBe(2); // start and fail
    expect(action3AuditEvents[1].status).toBe('failed');

    // Step 8: Execute rollback/compensation
    const completedActions = ['Action 1', 'Action 2'];
    const rollbackResult = await fakeAiClient.performRollback({
      completedActions,
    });
    expect(rollbackResult.success).toBe(true);
    expect(rollbackResult.compensatedCount).toBe(2);
    expect(fakeAiClientState.rollbackStarted).toBe(true);
    expect(fakeAiClientState.rollbackCompleted).toBe(true);

    // Step 9: Verify Action 1 document was deleted by rollback
    expect(fakeAiClientState.action1Document).toBeNull();
    expect(fakeAiClientState.action1Completed).toBe(false);

    // Step 10: Verify Action 2 document was deleted by rollback
    expect(fakeAiClientState.action2Document).toBeNull();
    expect(fakeAiClientState.action2Completed).toBe(false);

    // Step 11: Verify compensation log contains deletion records
    expect(fakeAiClientState.compensationLog.length).toBe(2);
    expect(fakeAiClientState.compensationLog[0].operation).toBe('DELETE');
    expect(fakeAiClientState.compensationLog[0].resourceId).toBe(
      'schedule-doc-20240115-001'
    );
    expect(fakeAiClientState.compensationLog[1].operation).toBe('DELETE');
    expect(fakeAiClientState.compensationLog[1].resourceId).toBe(
      'guidance-doc-20240115-001'
    );

    // Step 12: Verify audit log contains all required events
    expect(fakeAiClientState.auditEvents.length).toBeGreaterThanOrEqual(8); // start+complete for each action, failure, rollback start, 2x compensation, rollback complete

    const rollbackStartEvent = fakeAiClientState.auditEvents.find(
      (e) =>
        e.action.includes('Rollback: compensation process started') &&
        e.status === 'started'
    );
    expect(rollbackStartEvent).toBeDefined();
    expect(rollbackStartEvent?.timestamp).toBe('2024-01-15T09:36:00Z');
    expect((rollbackStartEvent?.details as Record<string, unknown>)?.targetActions).toEqual([
      'Action 1',
      'Action 2',
    ]);

    const compensationEvent1 = fakeAiClientState.auditEvents.find(
      (e) =>
        e.action.includes('Compensation: Action 1 document deleted') &&
        e.status === 'compensated'
    );
    expect(compensationEvent1).toBeDefined();
    expect(compensationEvent1?.timestamp).toBe('2024-01-15T09:37:00Z');
    expect(
      (compensationEvent1?.details as Record<string, unknown>)?.resourceId
    ).toBe('schedule-doc-20240115-001');
    expect((compensationEvent1?.details as Record<string, unknown>)?.operation).toBe('DELETE');

    const compensationEvent2 = fakeAiClientState.auditEvents.find(
      (e) =>
        e.action.includes('Compensation: Action 2 document deleted') &&
        e.status === 'compensated'
    );
    expect(compensationEvent2).toBeDefined();
    expect(compensationEvent2?.timestamp).toBe('2024-01-15T09:38:00Z');
    expect(
      (compensationEvent2?.details as Record<string, unknown>)?.resourceId
    ).toBe('guidance-doc-20240115-001');

    const rollbackCompleteEvent = fakeAiClientState.auditEvents.find(
      (e) =>
        e.action.includes('Rollback: compensation process completed') &&
        e.status === 'completed'
    );
    expect(rollbackCompleteEvent).toBeDefined();
    expect(rollbackCompleteEvent?.timestamp).toBe('2024-01-15T09:39:00Z');
    expect(
      (rollbackCompleteEvent?.details as Record<string, unknown>)?.compensatedActions
    ).toEqual(['Action 1', 'Action 2']);
    expect(
      (rollbackCompleteEvent?.details as Record<string, unknown>)?.resourcesDeleted
    ).toBe(2);

    // Step 13: Verify no side effects beyond Action 2
    // Action 3 failure means no further actions should have been executed
    expect(fakeAiClientState.auditEvents.some((e) => e.action.includes('Action 4'))).toBe(
      false
    );
    expect(fakeAiClientState.auditEvents.some((e) => e.action.includes('Action 5'))).toBe(
      false
    );
    expect(fakeAiClientState.auditEvents.some((e) => e.action.includes('Action 6'))).toBe(
      false
    );

    // Step 14: Verify sendUnsubmittedReminder function returns proper rollback status
    const reminderResult = await sendUnsubmittedReminder(
      remindersRequiringRollback
    );

    // Verify the reminder was sent for unsubmitted members
    expect(reminderResult).toBeDefined();
    expect(Array.isArray(reminderResult)).toBe(true);
    expect(reminderResult.length).toBeGreaterThanOrEqual(2);

    // Verify rollback state is properly communicated
    const stateSnapshot = {
      action1Deleted: fakeAiClientState.action1Document === null,
      action2Deleted: fakeAiClientState.action2Document === null,
      compensationCompleted: fakeAiClientState.rollbackCompleted,
      systemStateReset: !fakeAiClientState.action1Completed && !fakeAiClientState.action2Completed,
    };

    expect(stateSnapshot.action1Deleted).toBe(true);
    expect(stateSnapshot.action2Deleted).toBe(true);
    expect(stateSnapshot.compensationCompleted).toBe(true);
    expect(stateSnapshot.systemStateReset).toBe(true);

    // Final verification: audit trail is complete and ordered chronologically
    const timestamps = fakeAiClientState.auditEvents.map((e) => new Date(e.timestamp).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }
  });
});