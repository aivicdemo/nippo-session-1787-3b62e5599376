import { runTx9Imp1Agent, type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('Tx9Imp1Agent audit logging', () => {
  test('SCEN-175: full lifecycle audit events are recorded in chronological order', async () => {
    // Setup: Create mock AI client
    const mockAiClient: Tx9Imp1AiClient = {
      buildAction01Prompt: jest.fn().mockResolvedValue('action_01_prompt'),
      executeAction01: jest.fn().mockResolvedValue({
        aggregatedReports: [
          {
            reportId: 'rep-001',
            teamId: 'team-001',
            memberId: 'mem-001',
            submittedAt: '2024-01-15T10:00:00Z',
            content: 'Daily report content',
          },
        ],
      }),
      buildAction02Prompt: jest.fn().mockResolvedValue('action_02_prompt'),
      executeAction02: jest.fn().mockResolvedValue({
        nonSubmitters: [{ memberId: 'mem-002', teamId: 'team-001' }],
        notificationsSent: 1,
      }),
      buildAction03Prompt: jest.fn().mockResolvedValue('action_03_prompt'),
      executeAction03: jest.fn().mockResolvedValue({
        issueResolutionSpeed: 2.5,
        reportSubmissionRate: 88.5,
        issueRecurrenceRate: 12.3,
      }),
      buildAction04Prompt: jest.fn().mockResolvedValue('action_04_prompt'),
      executeAction04: jest.fn().mockResolvedValue({
        highPriorityIssues: [
          {
            issueId: 'iss-001',
            title: 'Critical bug',
            priorityScore: 95,
          },
        ],
        mediumPriorityIssues: [
          {
            issueId: 'iss-002',
            title: 'Minor issue',
            priorityScore: 45,
          },
        ],
      }),
      buildAction05Prompt: jest.fn().mockResolvedValue('action_05_prompt'),
      executeAction05: jest.fn().mockResolvedValue({
        recurrencePatterns: [
          {
            patternId: 'pat-001',
            issueType: 'API timeout',
            frequency: 5,
            lastOccurrence: '2024-01-14T15:30:00Z',
          },
        ],
      }),
      buildAction06Prompt: jest.fn().mockResolvedValue('action_06_prompt'),
      executeAction06: jest.fn().mockResolvedValue({
        countermeasures: [
          {
            countermeasureId: 'cm-001',
            title: 'Implement circuit breaker',
            estimatedImpact: 'high',
            priority: 1,
          },
        ],
      }),
      buildAction07Prompt: jest.fn().mockResolvedValue('action_07_prompt'),
      executeAction07: jest.fn().mockResolvedValue({
        reportId: 'report-final-001',
        aggregationPeriod: {
          startDate: '2024-01-08',
          endDate: '2024-01-14',
        },
        productivityMetrics: {
          issueResolutionSpeed: 2.5,
          reportSubmissionRate: 88.5,
          issueRecurrenceRate: 12.3,
        },
        prioritizedIssues: [
          {
            issueId: 'iss-001',
            title: 'Critical bug',
            priorityScore: 95,
          },
        ],
        recommendedCountermeasures: [
          {
            countermeasureId: 'cm-001',
            title: 'Implement circuit breaker',
            estimatedImpact: 'high',
            priority: 1,
          },
        ],
        generatedAt: '2024-01-15T11:00:00Z',
      }),
    };

    // Mock audit log storage
    const auditLogs: Array<{
      timestamp: string;
      eventType: string;
      actionId?: string;
      status: string;
      userId: string;
      sessionId: string;
      details: string;
    }> = [];

    const mockAuditLogger = {
      log: jest.fn((entry) => {
        auditLogs.push(entry);
      }),
    };

    // Execute agent with mocked dependencies
    const request = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      targetTeamIds: ['team-001'],
      requestedByUserId: 'user-dept-lead-001',
    };

    const result = await runTx9Imp1Agent(request, mockAiClient, mockAuditLogger);

    // Verify result is returned successfully
    expect(result).toBeDefined();
    expect(result.reportId).toBe('report-final-001');
    expect(result.aggregationPeriod.startDate).toBe('2024-01-08');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-14');
    expect(result.productivityMetrics.issueResolutionSpeed).toBe(2.5);
    expect(result.productivityMetrics.reportSubmissionRate).toBe(88.5);
    expect(result.productivityMetrics.issueRecurrenceRate).toBe(12.3);
    expect(result.prioritizedIssues).toHaveLength(1);
    expect(result.prioritizedIssues[0].priorityScore).toBe(95);
    expect(result.recommendedCountermeasures).toHaveLength(1);
    expect(result.generatedAt).toBe('2024-01-15T11:00:00Z');

    // Verify audit log contains all required events in chronological order
    expect(auditLogs.length).toBe(22);

    // Verify event 1: agent_started
    expect(auditLogs[0].eventType).toBe('agent_started');
    expect(auditLogs[0].status).toBe('started');
    expect(auditLogs[0].userId).toBe('user-dept-lead-001');
    expect(auditLogs[0]).toHaveProperty('timestamp');
    expect(auditLogs[0]).toHaveProperty('sessionId');
    expect(auditLogs[0]).toHaveProperty('details');

    // Verify event 2: action_01_started
    expect(auditLogs[1].eventType).toBe('action_01_started');
    expect(auditLogs[1].actionId).toBe('action_01');
    expect(auditLogs[1].status).toBe('started');
    expect(auditLogs[1].userId).toBe('user-dept-lead-001');
    expect(auditLogs[1]).toHaveProperty('timestamp');

    // Verify event 3: action_01_completed
    expect(auditLogs[2].eventType).toBe('action_01_completed');
    expect(auditLogs[2].actionId).toBe('action_01');
    expect(auditLogs[2].status).toBe('completed');
    expect(auditLogs[2]).toHaveProperty('timestamp');

    // Verify event 4: action_handover (1->2)
    expect(auditLogs[3].eventType).toBe('action_handover');
    expect(auditLogs[3].status).toBe('handover');
    expect(auditLogs[3].details).toContain('action_01');
    expect(auditLogs[3].details).toContain('action_02');

    // Verify event 5: action_02_started
    expect(auditLogs[4].eventType).toBe('action_02_started');
    expect(auditLogs[4].actionId).toBe('action_02');
    expect(auditLogs[4].status).toBe('started');

    // Verify event 6: action_02_completed
    expect(auditLogs[5].eventType).toBe('action_02_completed');
    expect(auditLogs[5].actionId).toBe('action_02');
    expect(auditLogs[5].status).toBe('completed');

    // Verify event 7: action_handover (2->3)
    expect(auditLogs[6].eventType).toBe('action_handover');

    // Verify event 8: action_03_started
    expect(auditLogs[7].eventType).toBe('action_03_started');
    expect(auditLogs[7].actionId).toBe('action_03');
    expect(auditLogs[7].status).toBe('started');

    // Verify event 9: action_03_completed
    expect(auditLogs[8].eventType).toBe('action_03_completed');
    expect(auditLogs[8].actionId).toBe('action_03');
    expect(auditLogs[8].status).toBe('completed');

    // Verify event 10: action_handover (3->4)
    expect(auditLogs[9].eventType).toBe('action_handover');

    // Verify event 11: action_04_started
    expect(auditLogs[10].eventType).toBe('action_04_started');
    expect(auditLogs[10].actionId).toBe('action_04');
    expect(auditLogs[10].status).toBe('started');

    // Verify event 12: action_04_completed
    expect(auditLogs[11].eventType).toBe('action_04_completed');
    expect(auditLogs[11].actionId).toBe('action_04');
    expect(auditLogs[11].status).toBe('completed');

    // Verify event 13: action_handover (4->5)
    expect(auditLogs[12].eventType).toBe('action_handover');

    // Verify event 14: action_05_started
    expect(auditLogs[13].eventType).toBe('action_05_started');
    expect(auditLogs[13].actionId).toBe('action_05');
    expect(auditLogs[13].status).toBe('started');

    // Verify event 15: action_05_completed
    expect(auditLogs[14].eventType).toBe('action_05_completed');
    expect(auditLogs[14].actionId).toBe('action_05');
    expect(auditLogs[14].status).toBe('completed');

    // Verify event 16: action_handover (5->6)
    expect(auditLogs[15].eventType).toBe('action_handover');

    // Verify event 17: action_06_started
    expect(auditLogs[16].eventType).toBe('action_06_started');
    expect(auditLogs[16].actionId).toBe('action_06');
    expect(auditLogs[16].status).toBe('started');

    // Verify event 18: action_06_completed
    expect(auditLogs[17].eventType).toBe('action_06_completed');
    expect(auditLogs[17].actionId).toBe('action_06');
    expect(auditLogs[17].status).toBe('completed');

    // Verify event 19: action_handover (6->7)
    expect(auditLogs[18].eventType).toBe('action_handover');

    // Verify event 20: action_07_started
    expect(auditLogs[19].eventType).toBe('action_07_started');
    expect(auditLogs[19].actionId).toBe('action_07');
    expect(auditLogs[19].status).toBe('started');

    // Verify event 21: action_07_completed
    expect(auditLogs[20].eventType).toBe('action_07_completed');
    expect(auditLogs[20].actionId).toBe('action_07');
    expect(auditLogs[20].status).toBe('completed');

    // Verify event 22: agent_completed
    expect(auditLogs[21].eventType).toBe('agent_completed');
    expect(auditLogs[21].status).toBe('completed');
    expect(auditLogs[21]).toHaveProperty('timestamp');
    expect(auditLogs[21]).toHaveProperty('sessionId');

    // Verify all logs have required audit fields
    for (const log of auditLogs) {
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('eventType');
      expect(log).toHaveProperty('status');
      expect(log).toHaveProperty('userId');
      expect(log).toHaveProperty('sessionId');
      expect(log).toHaveProperty('details');
      expect(typeof log.timestamp).toBe('string');
      expect(typeof log.userId).toBe('string');
      expect(typeof log.sessionId).toBe('string');
    }

    // Verify timestamps are in chronological order
    for (let i = 1; i < auditLogs.length; i++) {
      const prevTimestamp = new Date(auditLogs[i - 1].timestamp).getTime();
      const currTimestamp = new Date(auditLogs[i].timestamp).getTime();
      expect(currTimestamp).toBeGreaterThanOrEqual(prevTimestamp);
    }

    // Verify all AI client methods were called
    expect(mockAiClient.buildAction01Prompt).toHaveBeenCalled();
    expect(mockAiClient.executeAction01).toHaveBeenCalled();
    expect(mockAiClient.buildAction02Prompt).toHaveBeenCalled();
    expect(mockAiClient.executeAction02).toHaveBeenCalled();
    expect(mockAiClient.buildAction03Prompt).toHaveBeenCalled();
    expect(mockAiClient.executeAction03).toHaveBeenCalled();
    expect(mockAiClient.buildAction04Prompt).toHaveBeenCalled();
    expect(mockAiClient.executeAction04).toHaveBeenCalled();
    expect(mockAiClient.buildAction05Prompt).toHaveBeenCalled();
    expect(mockAiClient.executeAction05).toHaveBeenCalled();
    expect(mockAiClient.buildAction06Prompt).toHaveBeenCalled();
    expect(mockAiClient.executeAction06).toHaveBeenCalled();
    expect(mockAiClient.buildAction07Prompt).toHaveBeenCalled();
    expect(mockAiClient.executeAction07).toHaveBeenCalled();
  });
});