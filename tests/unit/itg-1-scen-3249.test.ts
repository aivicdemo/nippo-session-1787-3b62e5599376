import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import { type Tx11Imp1AiClient } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('TX11 Agent Orchestrator - Audit Logging', () => {
  test('SCEN-3249: runTx11Imp1Agent records audit events for agent lifecycle and all actions', async () => {
    // Setup: Initialize fake AI client that implements Tx11Imp1AiClient interface
    const auditLog: Array<{
      eventId: string;
      eventType: string;
      timestamp: string;
      agentId: string;
      status: string;
      details: Record<string, unknown>;
    }> = [];

    const fakeAiClient: Tx11Imp1AiClient = {
      // Action 1: Confirm submission status for 10 members
      confirmSubmissionStatus: async () => ({
        totalMembers: 10,
        submittedCount: 7,
        unsubmittedMembers: ['mem-003', 'mem-005', 'mem-008', 'mem-009', 'mem-010'],
      }),
      // Action 2: Send reminder notifications to unsubmitted members
      sendReminderNotifications: async (unsubmitted: string[]) => ({
        notificationsSent: unsubmitted.length,
        failedRecipients: [],
      }),
      // Action 3: Extract issues from submitted reports
      extractIssuesFromReports: async () => ({
        extractedKeywords: ['database-lock', 'memory-leak', 'api-timeout', 'database-lock'],
        issueFrequency: {
          'database-lock': 2,
          'memory-leak': 1,
          'api-timeout': 1,
        },
      }),
      // Action 4: Calculate priority scores for extracted issues
      calculatePriorityScores: async () => ({
        prioritizedIssues: [
          { keyword: 'database-lock', frequency: 2, impactScore: 85, priorityScore: 90 },
          { keyword: 'memory-leak', frequency: 1, impactScore: 75, priorityScore: 78 },
          { keyword: 'api-timeout', frequency: 1, impactScore: 60, priorityScore: 65 },
        ],
      }),
      // Action 5: Retrieve past similar issues for reference
      retrievePastSimilarIssues: async () => ({
        similarIssuesFound: 3,
        references: [
          { keyword: 'database-lock', lastOccurrence: '2024-01-10', resolutionDays: 5 },
          { keyword: 'memory-leak', lastOccurrence: '2024-01-08', resolutionDays: 3 },
        ],
      }),
      // Action 6: Generate morning meeting summary
      generateMorningMeetingSummary: async () => ({
        summaryGenerated: true,
        summaryContent: 'Morning meeting summary with prioritized issues',
      }),
      // Action 7: Send summary to manager
      sendSummaryToManager: async () => ({
        emailSent: true,
        deliveryTimestamp: '2024-01-15T09:00:00Z',
      }),
    };

    // Mock audit logging function
    const recordAuditEvent = (event: {
      eventId?: string;
      eventType: string;
      timestamp: string;
      agentId: string;
      status: string;
      details: Record<string, unknown>;
    }) => {
      const auditRecord = {
        eventId: event.eventId || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        eventType: event.eventType,
        timestamp: event.timestamp,
        agentId: event.agentId,
        status: event.status,
        details: event.details,
      };
      auditLog.push(auditRecord);
    };

    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const input = {
      executionTimestamp,
      teamId: 'team-001',
      reportDeadlineTime: '09:00',
      managerEmail: 'manager@example.com',
    };

    // Execute orchestrator with audit logging
    const result = await runTx11Imp1Agent(input, fakeAiClient, recordAuditEvent);

    // Verify AGENT_STARTED event is recorded
    const startedEvent = auditLog.find((e) => e.eventType === 'AGENT_STARTED');
    expect(startedEvent).toBeDefined();
    expect(startedEvent?.status).toBe('STARTED');
    expect(startedEvent?.agentId).toBe('tx-11-imp-1');
    expect(startedEvent?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(startedEvent?.details).toHaveProperty('teamId', 'team-001');

    // Verify ACTION_EXECUTED events for each action (1-7)
    const actionEvents = auditLog.filter((e) => e.eventType === 'ACTION_EXECUTED');
    expect(actionEvents.length).toBe(7);

    // Action 1: SubmissionStatus confirmation
    const action1Event = actionEvents[0];
    expect(action1Event.details).toHaveProperty('actionNumber', 1);
    expect(action1Event.details).toHaveProperty('actionName', 'confirmSubmissionStatus');
    expect(action1Event.status).toBe('COMPLETED');
    expect(action1Event.details).toHaveProperty('submittedCount', 7);
    expect(action1Event.details).toHaveProperty('unsubmittedCount', 3);

    // Action 2: ReminderNotifications
    const action2Event = actionEvents[1];
    expect(action2Event.details).toHaveProperty('actionNumber', 2);
    expect(action2Event.details).toHaveProperty('actionName', 'sendReminderNotifications');
    expect(action2Event.status).toBe('COMPLETED');
    expect(action2Event.details).toHaveProperty('notificationsSent', 3);

    // Action 3: IssueExtraction
    const action3Event = actionEvents[2];
    expect(action3Event.details).toHaveProperty('actionNumber', 3);
    expect(action3Event.details).toHaveProperty('actionName', 'extractIssuesFromReports');
    expect(action3Event.status).toBe('COMPLETED');
    expect(action3Event.details).toHaveProperty('keywordsExtracted', 3);
    expect(action3Event.details).toHaveProperty('totalFrequency', 4);

    // Action 4: PriorityScoreCalculation
    const action4Event = actionEvents[3];
    expect(action4Event.details).toHaveProperty('actionNumber', 4);
    expect(action4Event.details).toHaveProperty('actionName', 'calculatePriorityScores');
    expect(action4Event.status).toBe('COMPLETED');
    expect(action4Event.details).toHaveProperty('prioritizedIssueCount', 3);

    // Action 5: RetrieveSimilarIssues
    const action5Event = actionEvents[4];
    expect(action5Event.details).toHaveProperty('actionNumber', 5);
    expect(action5Event.details).toHaveProperty('actionName', 'retrievePastSimilarIssues');
    expect(action5Event.status).toBe('COMPLETED');
    expect(action5Event.details).toHaveProperty('similarIssuesCount', 2);

    // Action 6: GenerateMorningMeetingSummary
    const action6Event = actionEvents[5];
    expect(action6Event.details).toHaveProperty('actionNumber', 6);
    expect(action6Event.details).toHaveProperty('actionName', 'generateMorningMeetingSummary');
    expect(action6Event.status).toBe('COMPLETED');

    // Action 7: SendSummaryToManager
    const action7Event = actionEvents[6];
    expect(action7Event.details).toHaveProperty('actionNumber', 7);
    expect(action7Event.details).toHaveProperty('actionName', 'sendSummaryToManager');
    expect(action7Event.status).toBe('COMPLETED');
    expect(action7Event.details).toHaveProperty('emailSent', true);

    // Verify AGENT_COMPLETED event is recorded with success count
    const completedEvent = auditLog.find((e) => e.eventType === 'AGENT_COMPLETED');
    expect(completedEvent).toBeDefined();
    expect(completedEvent?.status).toBe('COMPLETED');
    expect(completedEvent?.agentId).toBe('tx-11-imp-1');
    expect(completedEvent?.details).toHaveProperty('successCount', 7);
    expect(completedEvent?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Verify all audit records have required fields
    auditLog.forEach((record) => {
      expect(record).toHaveProperty('eventId');
      expect(record).toHaveProperty('eventType');
      expect(record).toHaveProperty('timestamp');
      expect(record).toHaveProperty('agentId');
      expect(record).toHaveProperty('status');
      expect(record).toHaveProperty('details');
      expect(typeof record.eventId).toBe('string');
      expect(typeof record.eventType).toBe('string');
      expect(typeof record.timestamp).toBe('string');
      expect(typeof record.agentId).toBe('string');
      expect(typeof record.status).toBe('string');
      expect(typeof record.details).toBe('object');
    });

    // Verify timestamps are in chronological order
    for (let i = 1; i < auditLog.length; i++) {
      const prevTimestamp = new Date(auditLog[i - 1].timestamp).getTime();
      const currTimestamp = new Date(auditLog[i].timestamp).getTime();
      expect(currTimestamp).toBeGreaterThanOrEqual(prevTimestamp);
    }

    // Verify orchestrator output structure
    expect(result).toHaveProperty('submissionStatus');
    expect(result.submissionStatus).toHaveProperty('totalMembers', 10);
    expect(result.submissionStatus).toHaveProperty('submittedCount', 7);
    expect(result.submissionStatus.unsubmittedMembers).toEqual(['mem-003', 'mem-005', 'mem-008', 'mem-009', 'mem-010']);

    expect(result).toHaveProperty('prioritizedIssues');
    expect(result.prioritizedIssues.length).toBe(3);
    expect(result.prioritizedIssues[0]).toHaveProperty('keyword', 'database-lock');
    expect(result.prioritizedIssues[0]).toHaveProperty('priorityScore', 90);

    expect(result).toHaveProperty('notificationsSent');
    expect(result.notificationsSent.length).toBe(3);

    expect(result).toHaveProperty('summaryEmailSent', true);

    // Final audit log structure verification
    expect(auditLog.length).toBeGreaterThanOrEqual(9); // STARTED + 7 ACTIONS + COMPLETED
    const eventTypes = auditLog.map((e) => e.eventType);
    expect(eventTypes).toContain('AGENT_STARTED');
    expect(eventTypes).toContain('ACTION_EXECUTED');
    expect(eventTypes).toContain('AGENT_COMPLETED');
  });
});