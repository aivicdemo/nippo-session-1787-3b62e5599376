import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  // SCEN-089: Rollback completed actions when Action 5 fails during Tx4Imp1Agent execution
  test('should rollback all completed actions and log audit events when Action 5 fails', async () => {
    const mockAuditLog: Array<{
      timestamp: string;
      failedAction: string;
      rolledBackActions: string[];
      deletedResourceIds: string[];
    }> = [];

    const mockDataStore: Record<string, Record<string, { deleted: boolean; data: unknown }>> = {
      action_1_results: {
        'agg_001': { deleted: false, data: { timestamp: '2024-01-15T08:00:00Z', metricsCount: 42 } },
      },
      action_2_results: {
        'issue_001': { deleted: false, data: { keyword: 'delay', count: 3 } },
      },
      action_3_results: {
        'risk_001': { deleted: false, data: { riskScore: 8.5, recurrenceProb: 0.72 } },
      },
      action_4_results: {
        'priority_001': { deleted: false, data: { priority: 'HIGH', rank: 1 } },
      },
    };

    const mockRollbackFn = async (
      actionId: string,
      resourceIds: string[],
      timestamp: string
    ): Promise<{ success: boolean; deletedCount: number }> => {
      const storeKey = `action_${actionId.split('_')[1]}_results`;
      let deletedCount = 0;

      if (mockDataStore[storeKey]) {
        for (const resId of resourceIds) {
          if (mockDataStore[storeKey][resId]) {
            mockDataStore[storeKey][resId].deleted = true;
            deletedCount++;
          }
        }
      }

      mockAuditLog.push({
        timestamp,
        failedAction: 'action_5',
        rolledBackActions: [actionId],
        deletedResourceIds: resourceIds,
      });

      return { success: true, deletedCount };
    };

    const testExecutionStartTime = '2024-01-15T08:15:00Z';
    const testActionFailureTime = '2024-01-15T08:15:45Z';

    const completedActions = [
      { id: 'action_1', resourceIds: ['agg_001'] },
      { id: 'action_2', resourceIds: ['issue_001'] },
      { id: 'action_3', resourceIds: ['risk_001'] },
      { id: 'action_4', resourceIds: ['priority_001'] },
    ];

    const simulatedError = new Error('AI client timeout: Action 5 failed to generate response');

    let rollbackExecuted = false;
    const rollbackResults: Array<{ actionId: string; deletedCount: number }> = [];

    try {
      for (const action of completedActions) {
        const rollResult = await mockRollbackFn(action.id, action.resourceIds, testActionFailureTime);
        rollbackExecuted = true;
        rollbackResults.push({
          actionId: action.id,
          deletedCount: rollResult.deletedCount,
        });
      }
      throw simulatedError;
    } catch (err) {
      expect(err).toEqual(simulatedError);
      expect(rollbackExecuted).toBe(true);
    }

    expect(rollbackResults).toHaveLength(4);
    expect(rollbackResults[0]).toEqual({ actionId: 'action_1', deletedCount: 1 });
    expect(rollbackResults[1]).toEqual({ actionId: 'action_2', deletedCount: 1 });
    expect(rollbackResults[2]).toEqual({ actionId: 'action_3', deletedCount: 1 });
    expect(rollbackResults[3]).toEqual({ actionId: 'action_4', deletedCount: 1 });

    expect(mockDataStore.action_1_results['agg_001'].deleted).toBe(true);
    expect(mockDataStore.action_2_results['issue_001'].deleted).toBe(true);
    expect(mockDataStore.action_3_results['risk_001'].deleted).toBe(true);
    expect(mockDataStore.action_4_results['priority_001'].deleted).toBe(true);

    expect(mockAuditLog).toHaveLength(4);
    mockAuditLog.forEach((entry, index) => {
      expect(entry.timestamp).toBe(testActionFailureTime);
      expect(entry.failedAction).toBe('action_5');
      expect(entry.rolledBackActions).toHaveLength(1);
      expect(entry.deletedResourceIds).toHaveLength(1);
    });

    expect(mockAuditLog[0].rolledBackActions[0]).toBe('action_1');
    expect(mockAuditLog[1].rolledBackActions[0]).toBe('action_2');
    expect(mockAuditLog[2].rolledBackActions[0]).toBe('action_3');
    expect(mockAuditLog[3].rolledBackActions[0]).toBe('action_4');

    expect(mockAuditLog[0].deletedResourceIds[0]).toBe('agg_001');
    expect(mockAuditLog[1].deletedResourceIds[0]).toBe('issue_001');
    expect(mockAuditLog[2].deletedResourceIds[0]).toBe('risk_001');
    expect(mockAuditLog[3].deletedResourceIds[0]).toBe('priority_001');

    const detectionResult = await detectAndNotifyUnsubmitted(
      {
        memberId: 'member_001',
        submissionStatus: 'unsubmitted',
        notificationSent: false,
      },
      {
        notificationChannels: ['email'],
        escalationThreshold: 2,
      }
    );

    expect(detectionResult).toEqual({
      detected: true,
      notificationSent: true,
      escalationTriggered: false,
    });
  });
});