import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-01';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-02';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-03';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-04';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-05';
import { buildAction06Prompt, ACTION_06_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-06';
import { buildAction07Prompt, ACTION_07_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-07';
import { buildAction08Prompt, ACTION_08_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-08';

describe('tx-7-imp-1 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-3197
  test('should record complete audit trail from started to completed for monthly report generation workflow', async () => {
    const auditLogs: any[] = [];
    const mockAuditLogStore = {
      recordAuditEvent: jest.fn((event: any) => {
        auditLogs.push(event);
      }),
      fetchAuditLogs: jest.fn((sessionId: string) => {
        return auditLogs.filter((log) => log.sessionId === sessionId);
      }),
    };

    const agentId = 'agent-tx-7-imp-1-001';
    const sessionId = 'session-20240301-001';
    const executionId = 'exec-20240301-001';
    const triggerTimestamp = new Date('2024-03-01T09:00:00Z');
    const targetMonth = '2024-02';
    const managerUserId = 'manager-001';

    const mockAiClient = {
      callAction01: jest.fn(async () => {
        mockAuditLogStore.recordAuditEvent({
          agentId,
          sessionId,
          executionId,
          eventType: 'in_progress',
          actionIndex: 1,
          eventTimestamp: new Date('2024-03-01T09:00:05Z').toISOString(),
          message: 'Action 1: Confirmed monthly report generation trigger',
        });
        return {
          triggerConfirmed: true,
          triggerTime: triggerTimestamp.toISOString(),
          actionMessage: 'Trigger confirmed',
        };
      }),

      callAction02: jest.fn(async () => {
        const extractedRecordCount = 10;
        mockAuditLogStore.recordAuditEvent({
          agentId,
          sessionId,
          executionId,
          eventType: 'in_progress',
          actionIndex: 2,
          eventTimestamp: new Date('2024-03-01T09:00:10Z').toISOString(),
          extractedRecordCount,
          message: `Action 2: Extracted ${extractedRecordCount} report records for target month`,
        });
        return {
          extractedRecordCount,
          dataValidationPassed: true,
          actionMessage: 'Data extraction successful',
        };
      }),

      callAction03: jest.fn(async () => {
        const generatedReportId = 'report-20240228-001';
        mockAuditLogStore.recordAuditEvent({
          agentId,
          sessionId,
          executionId,
          eventType: 'in_progress',
          actionIndex: 3,
          eventTimestamp: new Date('2024-03-01T09:00:15Z').toISOString(),
          generatedReportId,
          message: `Action 3: Generated report with ID ${generatedReportId}`,
        });
        return {
          generatedReportId,
          reportGenerationSuccess: true,
          actionMessage: 'Report generation completed',
        };
      }),

      callAction04: jest.fn(async () => {
        const analysisMetrics = {
          timeSeriesDataPoints: 28,
          averageBottleneckDepth: 6.5,
          trendDirection: 'improving',
        };
        mockAuditLogStore.recordAuditEvent({
          agentId,
          sessionId,
          executionId,
          eventType: 'in_progress',
          actionIndex: 4,
          eventTimestamp: new Date('2024-03-01T09:00:20Z').toISOString(),
          analysisMetrics,
          message: 'Action 4: Analyzed time-series issue changes',
        });
        return {
          analysisMetrics,
          actionMessage: 'Time-series analysis completed',
        };
      }),

      callAction05: jest.fn(async () => {
        const analysisMetrics = {
          improvementTrend: 'improving',
          bottleneckSeverityChangePercent: -12.5,
        };
        mockAuditLogStore.recordAuditEvent({
          agentId,
          sessionId,
          executionId,
          eventType: 'in_progress',
          actionIndex: 5,
          eventTimestamp: new Date('2024-03-01T09:00:25Z').toISOString(),
          analysisMetrics,
          message: 'Action 5: Analyzed bottleneck trend transitions',
        });
        return {
          analysisMetrics,
          actionMessage: 'Bottleneck trend analysis completed',
        };
      }),

      callAction06: jest.fn(async () => {
        const analysisMetrics = {
          teamCount: 3,
          averageChallengeResolutionDays: 2.8,
          reportSubmissionRate: 0.92,
          challengeRecurrenceRate: 0.18,
        };
        mockAuditLogStore.recordAuditEvent({
          agentId,
          sessionId,
          executionId,
          eventType: 'in_progress',
          actionIndex: 6,
          eventTimestamp: new Date('2024-03-01T09:00:30Z').toISOString(),
          analysisMetrics,
          message: 'Action 6: Calculated team-wise performance metrics',
        });
        return {
          analysisMetrics,
          actionMessage: 'Team performance metrics calculated',
        };
      }),

      callAction07: jest.fn(async () => {
        const prioritizedIssueCount = 5;
        mockAuditLogStore.recordAuditEvent({
          agentId,
          sessionId,
          executionId,
          eventType: 'in_progress',
          actionIndex: 7,
          eventTimestamp: new Date('2024-03-01T09:00:35Z').toISOString(),
          prioritizedIssueCount,
          message: `Action 7: Prioritized and organized ${prioritizedIssueCount} top issues`,
        });
        return {
          prioritizedIssueCount,
          topPriorityChallenges: [
            { challengeId: 'ch-001', priorityScore: 92, occurrenceFrequency: 8 },
            { challengeId: 'ch-002', priorityScore: 85, occurrenceFrequency: 6 },
            { challengeId: 'ch-003', priorityScore: 78, occurrenceFrequency: 5 },
            { challengeId: 'ch-004', priorityScore: 71, occurrenceFrequency: 4 },
            { challengeId: 'ch-005', priorityScore: 64, occurrenceFrequency: 3 },
          ],
          actionMessage: 'Analysis results prioritized',
        };
      }),

      callAction08: jest.fn(async () => {
        const reportDeliveryStatus = 'success';
        const completedAt = new Date('2024-03-01T09:00:40Z').toISOString();
        const totalExecutionTimeMs = 40000;

        mockAuditLogStore.recordAuditEvent({
          agentId,
          sessionId,
          executionId,
          eventType: 'completed',
          actionIndex: 8,
          eventTimestamp: completedAt,
          reportDeliveryStatus,
          totalExecutionTimeMs,
          message: `Action 8: Report delivered to manager. Status: ${reportDeliveryStatus}`,
        });
        return {
          reportDeliveryStatus,
          deliveryTimestamp: completedAt,
          actionMessage: 'Report delivered to manager',
        };
      }),
    };

    mockAuditLogStore.recordAuditEvent({
      agentId,
      sessionId,
      executionId,
      eventType: 'started',
      actionIndex: 1,
      eventTimestamp: triggerTimestamp.toISOString(),
      message: 'Monthly report generation workflow started',
    });

    const tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    const result = await runTx7Imp1Agent(tx7Imp1AgentInput, mockAiClient as any);

    const sessionAuditLogs = mockAuditLogStore.fetchAuditLogs(sessionId);

    expect(sessionAuditLogs.length).toBeGreaterThanOrEqual(10);

    expect(sessionAuditLogs[0]).toMatchObject({
      eventType: 'started',
      actionIndex: 1,
      agentId,
      sessionId,
      executionId,
    });
    expect(sessionAuditLogs[0].eventTimestamp).toBe('2024-03-01T09:00:00Z');

    expect(sessionAuditLogs[1]).toMatchObject({
      eventType: 'in_progress',
      actionIndex: 1,
      agentId,
      sessionId,
      executionId,
    });

    expect(sessionAuditLogs[2]).toMatchObject({
      eventType: 'in_progress',
      actionIndex: 2,
      agentId,
      sessionId,
      executionId,
      extractedRecordCount: 10,
    });

    expect(sessionAuditLogs[3]).toMatchObject({
      eventType: 'in_progress',
      actionIndex: 3,
      agentId,
      sessionId,
      executionId,
      generatedReportId: 'report-20240228-001',
    });

    expect(sessionAuditLogs[4]).toMatchObject({
      eventType: 'in_progress',
      actionIndex: 4,
      agentId,
      sessionId,
      executionId,
    });
    expect(sessionAuditLogs[4].analysisMetrics).toMatchObject({
      timeSeriesDataPoints: 28,
      averageBottleneckDepth: 6.5,
      trendDirection: 'improving',
    });

    expect(sessionAuditLogs[5]).toMatchObject({
      eventType: 'in_progress',
      actionIndex: 5,
      agentId,
      sessionId,
      executionId,
    });
    expect(sessionAuditLogs[5].analysisMetrics).toMatchObject({
      improvementTrend: 'improving',
      bottleneckSeverityChangePercent: -12.5,
    });

    expect(sessionAuditLogs[6]).toMatchObject({
      eventType: 'in_progress',
      actionIndex: 6,
      agentId,
      sessionId,
      executionId,
    });
    expect(sessionAuditLogs[6].analysisMetrics).toMatchObject({
      teamCount: 3,
      averageChallengeResolutionDays: 2.8,
      reportSubmissionRate: 0.92,
      challengeRecurrenceRate: 0.18,
    });

    expect(sessionAuditLogs[7]).toMatchObject({
      eventType: 'in_progress',
      actionIndex: 7,
      agentId,
      sessionId,
      executionId,
      prioritizedIssueCount: 5,
    });

    expect(sessionAuditLogs[8]).toMatchObject({
      eventType: 'completed',
      actionIndex: 8,
      agentId,
      sessionId,
      executionId,
      reportDeliveryStatus: 'success',
      totalExecutionTimeMs: 40000,
    });
    expect(sessionAuditLogs[8].eventTimestamp).toBe('2024-03-01T09:00:40Z');

    for (let i = 1; i < sessionAuditLogs.length; i++) {
      const prevTimestamp = new Date(sessionAuditLogs[i - 1].eventTimestamp).getTime();
      const currTimestamp = new Date(sessionAuditLogs[i].eventTimestamp).getTime();
      expect(currTimestamp).toBeGreaterThanOrEqual(prevTimestamp);
    }

    for (const log of sessionAuditLogs) {
      expect(log.agentId).toBe(agentId);
      expect(log.sessionId).toBe(sessionId);
      expect(log.executionId).toBe(executionId);
    }

    expect(result).toMatchObject({
      reportId: expect.any(String),
      executionStatus: 'success',
      analysisResultSummary: expect.objectContaining({
        topPriorityChallenges: expect.arrayContaining([
          expect.objectContaining({
            challengeId: expect.any(String),
            priorityScore: expect.any(Number),
            occurrenceFrequency: expect.any(Number),
          }),
        ]),
        performanceMetrics: expect.objectContaining({
          teamCount: 3,
        }),
        bottleneckTrend: expect.objectContaining({
          improvementTrend: expect.stringMatching(/improving|stable|deteriorating/),
        }),
      }),
      deliveryTimestamp: expect.any(Date),
    });

    expect(mockAiClient.callAction01).toHaveBeenCalled();
    expect(mockAiClient.callAction02).toHaveBeenCalled();
    expect(mockAiClient.callAction03).toHaveBeenCalled();
    expect(mockAiClient.callAction04).toHaveBeenCalled();
    expect(mockAiClient.callAction05).toHaveBeenCalled();
    expect(mockAiClient.callAction06).toHaveBeenCalled();
    expect(mockAiClient.callAction07).toHaveBeenCalled();
    expect(mockAiClient.callAction08).toHaveBeenCalled();

    expect(ACTION_01_PROMPT_VERSION).toBeDefined();
    expect(ACTION_02_PROMPT_VERSION).toBeDefined();
    expect(ACTION_03_PROMPT_VERSION).toBeDefined();
    expect(ACTION_04_PROMPT_VERSION).toBeDefined();
    expect(ACTION_05_PROMPT_VERSION).toBeDefined();
    expect(ACTION_06_PROMPT_VERSION).toBeDefined();
    expect(ACTION_07_PROMPT_VERSION).toBeDefined();
    expect(ACTION_08_PROMPT_VERSION).toBeDefined();

    expect(typeof buildAction01Prompt).toBe('function');
    expect(typeof buildAction02Prompt).toBe('function');
    expect(typeof buildAction03Prompt).toBe('function');
    expect(typeof buildAction04Prompt).toBe('function');
    expect(typeof buildAction05Prompt).toBe('function');
    expect(typeof buildAction06Prompt).toBe('function');
    expect(typeof buildAction07Prompt).toBe('function');
    expect(typeof buildAction08Prompt).toBe('function');
  });
});