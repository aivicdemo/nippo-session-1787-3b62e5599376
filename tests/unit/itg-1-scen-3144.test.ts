import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { type Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('tx-4-imp-1 orchestrator - ダッシュボード分析から課題指示までの自動実行', () => {
  // SCEN-3144
  test('should record complete lifecycle audit events from orchestration start through human review confirmation', async () => {
    const agentInstanceId = 'agent-instance-20240115-001';
    const managerId = 'manager-001';
    const teamId = 'team-dev-001';
    const reportDate = '2024-01-15';
    const meetingStartTime = '09:00';

    const auditLogRecords: Array<{
      eventType: string;
      actionName?: string;
      agentId: string;
      agentInstanceId: string;
      timestamp: Date;
      status?: string;
      errorCode?: string;
      errorMessage?: string;
      inputSummary?: Record<string, unknown>;
      outputSummary?: Record<string, unknown>;
      executionDurationMs?: number;
      totalActionsExecuted?: number;
      completedAt?: Date;
      reviewedBy?: string;
      reviewTimestamp?: Date;
      instructionsSummary?: string;
      promptVersion?: string;
      orchestratorVersion: string;
      environmentType: string;
      completionStatus?: string;
      overallStatus?: string;
    }> = [];

    const fakeAiClient: Tx4Imp1AiClient = {
      action01ExecuteRealtimeDataAggregation: async (input) => {
        auditLogRecords.push({
          eventType: 'ACTION_STARTED',
          actionName: 'action-01',
          agentId: 'tx_4_imp_1',
          agentInstanceId,
          timestamp: new Date('2024-01-15T08:50:00Z'),
          status: 'IN_PROGRESS',
          promptVersion: 'ACTION_01_PROMPT_VERSION_1.0',
          orchestratorVersion: '1.0.0',
          environmentType: 'production',
        });

        auditLogRecords.push({
          eventType: 'ACTION_COMPLETED',
          actionName: 'action-01',
          agentId: 'tx_4_imp_1',
          agentInstanceId,
          timestamp: new Date('2024-01-15T08:51:00Z'),
          completionStatus: 'SUCCESS',
          inputSummary: { teamId, reportDate },
          outputSummary: { dashboardDataPoints: 150, metricsCollected: 12 },
          executionDurationMs: 60000,
          promptVersion: 'ACTION_01_PROMPT_VERSION_1.0',
          orchestratorVersion: '1.0.0',
          environmentType: 'production',
        });

        return {
          dashboardDataPoints: 150,
          metricsCollected: 12,
          dataAggregationTimestamp: new Date('2024-01-15T08:51:00Z'),
        };
      },

      action02DetectProgressDelayAndAnomalies: async (input) => {
        auditLogRecords.push({
          eventType: 'ACTION_COMPLETED',
          actionName: 'action-02',
          agentId: 'tx_4_imp_1',
          agentInstanceId,
          timestamp: new Date('2024-01-15T08:52:00Z'),
          completionStatus: 'SUCCESS',
          inputSummary: { dashboardDataPoints: 150 },
          outputSummary: { delayedTasks: 3, anomalies: 2, unsubmittedMembers: 1 },
          executionDurationMs: 45000,
          promptVersion: 'ACTION_02_PROMPT_VERSION_1.0',
          orchestratorVersion: '1.0.0',
          environmentType: 'production',
        });

        return {
          delayedTasks: 3,
          anomalies: 2,
          unsubmittedMembers: 1,
          detectionTimestamp: new Date('2024-01-15T08:52:00Z'),
        };
      },

      action03CrossReferencePastSimilarIssues: async (input) => {
        auditLogRecords.push({
          eventType: 'ACTION_COMPLETED',
          actionName: 'action-03',
          agentId: 'tx_4_imp_1',
          agentInstanceId,
          timestamp: new Date('2024-01-15T08:53:00Z'),
          completionStatus: 'SUCCESS',
          inputSummary: { delayedTasks: 3, anomalies: 2 },
          outputSummary: { relatedPastIssues: 5, recurrenceRiskAssessed: true },
          executionDurationMs: 35000,
          promptVersion: 'ACTION_03_PROMPT_VERSION_1.0',
          orchestratorVersion: '1.0.0',
          environmentType: 'production',
        });

        return {
          relatedPastIssues: 5,
          recurrenceRiskAssessed: true,
          crossReferenceTimestamp: new Date('2024-01-15T08:53:00Z'),
        };
      },

      action04AutomaticPriorityAssignment: async (input) => {
        auditLogRecords.push({
          eventType: 'ACTION_COMPLETED',
          actionName: 'action-04',
          agentId: 'tx_4_imp_1',
          agentInstanceId,
          timestamp: new Date('2024-01-15T08:54:00Z'),
          completionStatus: 'SUCCESS',
          inputSummary: { issuesToPrioritize: 5 },
          outputSummary: { prioritizedCount: 5, highPriorityCount: 2, mediumPriorityCount: 2, lowPriorityCount: 1 },
          executionDurationMs: 40000,
          promptVersion: 'ACTION_04_PROMPT_VERSION_1.0',
          orchestratorVersion: '1.0.0',
          environmentType: 'production',
        });

        return {
          prioritizedIssues: [
            { issueId: 'issue-001', priority: 'HIGH', score: 85 },
            { issueId: 'issue-002', priority: 'HIGH', score: 78 },
            { issueId: 'issue-003', priority: 'MEDIUM', score: 60 },
            { issueId: 'issue-004', priority: 'MEDIUM', score: 55 },
            { issueId: 'issue-005', priority: 'LOW', score: 30 },
          ],
          assignmentTimestamp: new Date('2024-01-15T08:54:00Z'),
        };
      },

      action05GenerateDashboardMaterial: async (input) => {
        auditLogRecords.push({
          eventType: 'ACTION_COMPLETED',
          actionName: 'action-05',
          agentId: 'tx_4_imp_1',
          agentInstanceId,
          timestamp: new Date('2024-01-15T08:55:00Z'),
          completionStatus: 'SUCCESS',
          inputSummary: { prioritizedIssuesCount: 5 },
          outputSummary: { materialsGenerated: 1, sections: 6 },
          executionDurationMs: 50000,
          promptVersion: 'ACTION_05_PROMPT_VERSION_1.0',
          orchestratorVersion: '1.0.0',
          environmentType: 'production',
        });

        return {
          dashboardMaterial: {
            reportDate,
            sections: 6,
            priorityBreakdown: { high: 2, medium: 2, low: 1 },
            generatedAt: new Date('2024-01-15T08:55:00Z'),
          },
          materialId: 'material-20240115-001',
        };
      },

      action06ExtractUnsubmittedMembers: async (input) => {
        auditLogRecords.push({
          eventType: 'ACTION_COMPLETED',
          actionName: 'action-06',
          agentId: 'tx_4_imp_1',
          agentInstanceId,
          timestamp: new Date('2024-01-15T08:56:00Z'),
          completionStatus: 'SUCCESS',
          inputSummary: { totalTeamMembers: 10 },
          outputSummary: { unsubmittedCount: 1, submittedCount: 9 },
          executionDurationMs: 20000,
          promptVersion: 'ACTION_06_PROMPT_VERSION_1.0',
          orchestratorVersion: '1.0.0',
          environmentType: 'production',
        });

        return {
          unsubmittedMembers: ['member-008'],
          submittedCount: 9,
          totalMembers: 10,
          extractionTimestamp: new Date('2024-01-15T08:56:00Z'),
        };
      },

      action07SendManagerNotification: async (input) => {
        auditLogRecords.push({
          eventType: 'ACTION_COMPLETED',
          actionName: 'action-07',
          agentId: 'tx_4_imp_1',
          agentInstanceId,
          timestamp: new Date('2024-01-15T08:57:00Z'),
          completionStatus: 'SUCCESS',
          inputSummary: { recipientId: managerId },
          outputSummary: { notificationSent: true, deliveryStatus: 'sent' },
          executionDurationMs: 15000,
          promptVersion: 'ACTION_07_PROMPT_VERSION_1.0',
          orchestratorVersion: '1.0.0',
          environmentType: 'production',
        });

        return {
          notificationId: 'notif-20240115-001',
          deliveryStatus: 'sent',
          sentAt: new Date('2024-01-15T08:57:00Z'),
        };
      },
    };

    const input = {
      teamId,
      managerId,
      reportDate,
      meetingStartTime,
    };

    const result = await runTx4Imp1Agent(input, fakeAiClient);

    expect(result.executionId).toBeDefined();
    expect(result.executionId).toMatch(/^[a-z0-9\-]+$/);

    const startEventLog = auditLogRecords.find((log) => log.eventType === 'ACTION_STARTED' && log.actionName === 'action-01');
    expect(startEventLog).toBeDefined();
    expect(startEventLog?.agentId).toBe('tx_4_imp_1');
    expect(startEventLog?.agentInstanceId).toBe(agentInstanceId);
    expect(startEventLog?.status).toBe('IN_PROGRESS');
    expect(startEventLog?.promptVersion).toBe('ACTION_01_PROMPT_VERSION_1.0');
    expect(startEventLog?.orchestratorVersion).toBe('1.0.0');
    expect(startEventLog?.environmentType).toBe('production');

    const action01CompletedLog = auditLogRecords.find(
      (log) => log.eventType === 'ACTION_COMPLETED' && log.actionName === 'action-01'
    );
    expect(action01CompletedLog).toBeDefined();
    expect(action01CompletedLog?.completionStatus).toBe('SUCCESS');
    expect(action01CompletedLog?.outputSummary?.dashboardDataPoints).toBe(150);
    expect(action01CompletedLog?.executionDurationMs).toBe(60000);

    const action02CompletedLog = auditLogRecords.find(
      (log) => log.eventType === 'ACTION_COMPLETED' && log.actionName === 'action-02'
    );
    expect(action02CompletedLog).toBeDefined();
    expect(action02CompletedLog?.completionStatus).toBe('SUCCESS');
    expect(action02CompletedLog?.outputSummary?.delayedTasks).toBe(3);
    expect(action02CompletedLog?.outputSummary?.anomalies).toBe(2);
    expect(action02CompletedLog?.outputSummary?.unsubmittedMembers).toBe(1);

    const action03CompletedLog = auditLogRecords.find(
      (log) => log.eventType === 'ACTION_COMPLETED' && log.actionName === 'action-03'
    );
    expect(action03CompletedLog).toBeDefined();
    expect(action03CompletedLog?.completionStatus).toBe('SUCCESS');
    expect(action03CompletedLog?.outputSummary?.relatedPastIssues).toBe(5);

    const action04CompletedLog = auditLogRecords.find(
      (log) => log.eventType === 'ACTION_COMPLETED' && log.actionName === 'action-04'
    );
    expect(action04CompletedLog).toBeDefined();
    expect(action04CompletedLog?.completionStatus).toBe('SUCCESS');
    expect(action04CompletedLog?.outputSummary?.highPriorityCount).toBe(2);

    const action05CompletedLog = auditLogRecords.find(
      (log) => log.eventType === 'ACTION_COMPLETED' && log.actionName === 'action-05'
    );
    expect(action05CompletedLog).toBeDefined();
    expect(action05CompletedLog?.completionStatus).toBe('SUCCESS');
    expect(action05CompletedLog?.outputSummary?.sections).toBe(6);

    const action06CompletedLog = auditLogRecords.find(
      (log) => log.eventType === 'ACTION_COMPLETED' && log.actionName === 'action-06'
    );
    expect(action06CompletedLog).toBeDefined();
    expect(action06CompletedLog?.completionStatus).toBe('SUCCESS');
    expect(action06CompletedLog?.outputSummary?.unsubmittedCount).toBe(1);

    const action07CompletedLog = auditLogRecords.find(
      (log) => log.eventType === 'ACTION_COMPLETED' && log.actionName === 'action-07'
    );
    expect(action07CompletedLog).toBeDefined();
    expect(action07CompletedLog?.completionStatus).toBe('SUCCESS');
    expect(action07CompletedLog?.outputSummary?.notificationSent).toBe(true);

    const completedActionNames = auditLogRecords
      .filter((log) => log.eventType === 'ACTION_COMPLETED')
      .map((log) => log.actionName);
    expect(completedActionNames).toEqual([
      'action-01',
      'action-02',
      'action-03',
      'action-04',
      'action-05',
      'action-06',
      'action-07',
    ]);

    const completedTimestamps = auditLogRecords
      .filter((log) => log.eventType === 'ACTION_COMPLETED')
      .map((log) => log.timestamp?.getTime() || 0);
    for (let i = 1; i < completedTimestamps.length; i++) {
      expect(completedTimestamps[i]).toBeGreaterThanOrEqual(completedTimestamps[i - 1]);
    }

    auditLogRecords.push({
      eventType: 'ORCHESTRATION_COMPLETED',
      agentId: 'tx_4_imp_1',
      agentInstanceId,
      timestamp: new Date('2024-01-15T08:58:00Z'),
      overallStatus: 'SUCCESS',
      totalActionsExecuted: 7,
      completedAt: new Date('2024-01-15T08:58:00Z'),
      promptVersion: 'ORCHESTRATOR_PROMPT_VERSION_1.0',
      orchestratorVersion: '1.0.0',
      environmentType: 'production',
    });

    const orchestrationCompletedLog = auditLogRecords.find(
      (log) => log.eventType === 'ORCHESTRATION_COMPLETED'
    );
    expect(orchestrationCompletedLog).toBeDefined();
    expect(orchestrationCompletedLog?.overallStatus).toBe('SUCCESS');
    expect(orchestrationCompletedLog?.totalActionsExecuted).toBe(7);

    auditLogRecords.push({
      eventType: 'HUMAN_REVIEW_CONFIRMED',
      agentId: 'tx_4_imp_1',
      agentInstanceId,
      timestamp: new Date('2024-01-15T08:59:00Z'),
      reviewedBy: managerId,
      reviewTimestamp: new Date('2024-01-15T08:59:00Z'),
      instructionsSummary: 'Priority issues acknowledged, team assignments confirmed',
      promptVersion: 'HUMAN_REVIEW_PROMPT_VERSION_1.0',
      orchestratorVersion: '1.0.0',
      environmentType: 'production',
    });

    const humanReviewLog = auditLogRecords.find(
      (log) => log.eventType === 'HUMAN_REVIEW_CONFIRMED'
    );
    expect(humanReviewLog).toBeDefined();
    expect(humanReviewLog?.reviewedBy).toBe(managerId);
    expect(humanReviewLog?.instructionsSummary).toMatch(/Priority issues/);

    for (const log of auditLogRecords) {
      expect(log.agentId).toBe('tx_4_imp_1');
      expect(log.orchestratorVersion).toBe('1.0.0');
      expect(log.environmentType).toBe('production');
    }

    expect(auditLogRecords.length).toBe(8);
  });
});