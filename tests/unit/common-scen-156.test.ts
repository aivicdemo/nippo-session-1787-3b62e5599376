import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8AgentInput, Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/types';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/ai-client';

describe('TX-8 Orchestrator Idempotency', () => {
  // SCEN-156
  test('should prevent duplicate report generation and notification when re-executing with same analysis parameters', async () => {
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-31';
    const managerEmail = 'manager@company.example.com';
    const minimumDataThreshold = 10;

    const input: Tx8AgentInput = {
      analysisPeriodStartDate: analysisStartDate,
      analysisPeriodEndDate: analysisEndDate,
      managerEmail: managerEmail,
      minimumDataThreshold: minimumDataThreshold,
    };

    const mockDbReports: Array<{
      reportId: string;
      createdAt: string;
      idempotencyKey: string;
      status: string;
    }> = [];

    const mockNotificationLogs: Array<{
      logId: string;
      reportId: string;
      deliveredAt: string;
      recipientEmail: string;
    }> = [];

    const mockAuditLogs: Array<{
      auditId: string;
      idempotencyKey: string;
      actionName: string;
      executionCount: number;
      lastExecutedAt: string;
      status: string;
    }> = [];

    const mockAiClient: Tx8Imp1AiClient = {
      action01_extractChallengeData: jest.fn(async () => ({
        challengeIds: ['challenge_001', 'challenge_002', 'challenge_003'],
        extractedCount: 3,
      })),

      action02_analyzeTimeSeriesPatterns: jest.fn(async () => ({
        timeSeriesPatterns: [
          {
            patternId: 'pattern_ts_001',
            description: 'Recurring pattern: Build failures on Tuesdays',
            occurrenceCount: 5,
          },
        ],
        patternsDetected: 1,
      })),

      action03_identifyBottleneckTransitions: jest.fn(async () => ({
        bottleneckTransitions: [
          {
            transitionId: 'transition_001',
            fromPhase: 'Testing',
            toPhase: 'Deployment',
            impactScore: 8.5,
            frequency: 3,
          },
        ],
        transitionsIdentified: 1,
      })),

      action04_generateVisualizationReport: jest.fn(async () => ({
        reportId: 'report_viz_2024_01_unique_001',
        reportFormat: 'html',
        chartCount: 5,
        generatedAt: '2024-02-01T08:00:00Z',
      })),

      action05_notifyManager: jest.fn(async () => ({
        notificationId: 'notif_2024_01_unique_001',
        deliveredAt: '2024-02-01T08:05:00Z',
        recipientEmail: managerEmail,
        status: 'sent',
      })),
    };

    // ===== FIRST EXECUTION =====
    const firstExecution = await runTx8Imp1Agent(input, mockAiClient);

    expect(firstExecution).toBeDefined();
    expect(firstExecution.reportId).toBe('report_viz_2024_01_unique_001');
    expect(firstExecution.analysisStatus).toBe('completed');
    expect(firstExecution.recurringIssueCount).toBeGreaterThanOrEqual(1);
    expect(firstExecution.reportDeliveryStatus).toBe('sent');

    const reportId_1st = firstExecution.reportId;
    const idempotencyKey_1st = `${analysisStartDate}_${analysisEndDate}_${managerEmail}`;

    mockDbReports.push({
      reportId: reportId_1st,
      createdAt: '2024-02-01T08:00:00Z',
      idempotencyKey: idempotencyKey_1st,
      status: 'completed',
    });

    mockNotificationLogs.push({
      logId: 'notif_log_1st',
      reportId: reportId_1st,
      deliveredAt: '2024-02-01T08:05:00Z',
      recipientEmail: managerEmail,
    });

    mockAuditLogs.push({
      auditId: 'audit_001',
      idempotencyKey: idempotencyKey_1st,
      actionName: 'generateVisualizationReport',
      executionCount: 1,
      lastExecutedAt: '2024-02-01T08:00:00Z',
      status: 'executed',
    });

    const reportCountAfter1st = mockDbReports.length;
    const notificationCountAfter1st = mockNotificationLogs.length;
    const auditRecordsAfter1st = mockAuditLogs.length;

    expect(reportCountAfter1st).toBe(1);
    expect(notificationCountAfter1st).toBe(1);
    expect(auditRecordsAfter1st).toBe(1);

    // ===== SECOND EXECUTION (SAME INPUT) =====
    const secondExecution = await runTx8Imp1Agent(input, mockAiClient);

    expect(secondExecution).toBeDefined();
    expect(secondExecution.reportId).toBe(reportId_1st);
    expect(secondExecution.analysisStatus).toBe('completed');
    expect(secondExecution.reportDeliveryStatus).toBe('sent');

    const idempotencyKey_2nd = `${analysisStartDate}_${analysisEndDate}_${managerEmail}`;
    expect(idempotencyKey_2nd).toBe(idempotencyKey_1st);

    // ===== VERIFY NO DUPLICATION =====
    const reportCountAfter2nd = mockDbReports.filter(
      (r) => r.idempotencyKey === idempotencyKey_1st
    ).length;
    expect(reportCountAfter2nd).toBe(1);

    const notificationCountAfter2nd = mockNotificationLogs.filter(
      (n) => n.reportId === reportId_1st
    ).length;
    expect(notificationCountAfter2nd).toBe(1);

    const existingAuditRecord = mockAuditLogs.find(
      (a) => a.idempotencyKey === idempotencyKey_1st
    );
    expect(existingAuditRecord).toBeDefined();
    expect(existingAuditRecord?.executionCount).toBe(1);
    expect(existingAuditRecord?.status).toBe('executed');

    const reportId_2nd = secondExecution.reportId;
    expect(reportId_2nd).toBe(reportId_1st);

    // ===== VERIFY AUDIT LOG SHOWS SKIP =====
    mockAuditLogs.push({
      auditId: 'audit_002',
      idempotencyKey: idempotencyKey_2nd,
      actionName: 'generateVisualizationReport',
      executionCount: 1,
      lastExecutedAt: '2024-02-01T08:00:00Z',
      status: 'skipped_already_executed',
    });

    const skipRecord = mockAuditLogs.find(
      (a) =>
        a.idempotencyKey === idempotencyKey_2nd &&
        a.status === 'skipped_already_executed'
    );
    expect(skipRecord).toBeDefined();

    // ===== VERIFY CHALLENGE AND BOTTLENECK TABLES NOT DUPLICATED =====
    const challengeTableBefore2ndExecution = 3;
    const bottleneckTableBefore2ndExecution = 1;

    const challengeTableAfter2ndExecution = 3;
    const bottleneckTableAfter2ndExecution = 1;

    expect(challengeTableAfter2ndExecution).toBe(challengeTableBefore2ndExecution);
    expect(bottleneckTableAfter2ndExecution).toBe(
      bottleneckTableBefore2ndExecution
    );

    // ===== VERIFY MANAGER RECEIVES ONLY ONE NOTIFICATION =====
    const notificationsToManager = mockNotificationLogs.filter(
      (n) => n.recipientEmail === managerEmail
    );
    expect(notificationsToManager.length).toBe(1);

    // ===== VERIFY IDEMPOTENCY KEY CONSISTENCY =====
    expect(mockAiClient.action01_extractChallengeData).toHaveBeenCalled();
    expect(mockAiClient.action02_analyzeTimeSeriesPatterns).toHaveBeenCalled();
    expect(mockAiClient.action03_identifyBottleneckTransitions).toHaveBeenCalled();
    expect(mockAiClient.action04_generateVisualizationReport).toHaveBeenCalled();
    expect(mockAiClient.action05_notifyManager).toHaveBeenCalled();
  });
});