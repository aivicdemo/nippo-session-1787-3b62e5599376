import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-01';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-02';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-03';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-04';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-05';
import { buildAction06Prompt, ACTION_06_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-06';
import { buildAction07Prompt, ACTION_07_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-07';
import { buildAction08Prompt, ACTION_08_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-08';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-141
  test('AIエージェント実行によるレポート生成から分析完了までの全フローが監査ログに時系列記録される', async () => {
    const executionId = 'exec-tx7-imp1-202401-001';
    const reportId = 'report-2024-01-monthly-001';
    const teamCount = 3;
    const extractedDataCount = 150;
    const analysisItemCount = 12;
    const detectedPatternCount = 5;
    const bottleneckCount = 4;
    const priorityHighCount = 8;
    const priorityMediumCount = 12;
    const priorityLowCount = 5;
    const deliveryEmailAddress = 'director@company.example.com';
    const agentStartTime = new Date('2024-01-01T09:00:00Z');
    const agentEndTime = new Date('2024-01-01T09:15:00Z');
    const totalExecutionTimeMs = 900000;

    const auditLogEntries: Array<{
      eventType: string;
      timestamp: Date;
      executionId: string;
      status?: string;
      metadata?: Record<string, unknown>;
    }> = [];

    const mockAiClient = {
      action01ConfirmMonthlyTrigger: jest.fn(async () => ({
        triggerConfirmed: true,
        targetMonth: '2024-01',
        triggeredBy: 'schedule',
      })),
      action02ExtractAccumulatedData: jest.fn(async () => ({
        dataCount: extractedDataCount,
        dataRangeStart: '2024-01-01',
        dataRangeEnd: '2024-01-31',
        extractionStatus: 'completed',
      })),
      action03ExecuteReportGeneration: jest.fn(async () => ({
        reportId: reportId,
        generationStatus: 'success',
        generatedAt: agentStartTime.toISOString(),
      })),
      action04AnalyzeTimeSeriesIssues: jest.fn(async () => ({
        analysisItemCount: analysisItemCount,
        detectedPatternCount: detectedPatternCount,
        analysisStatus: 'completed',
      })),
      action05IdentifyBottleneckTrend: jest.fn(async () => ({
        bottleneckCount: bottleneckCount,
        priorityLevel: 'high',
        trendStatus: 'deteriorating',
      })),
      action06CalculateTeamPerformanceMetrics: jest.fn(async () => ({
        teamCount: teamCount,
        metricsItemCount: 6,
        metricsStatus: 'calculated',
      })),
      action07AssignPriorityAndSummarize: jest.fn(async () => ({
        priorityHighCount: priorityHighCount,
        priorityMediumCount: priorityMediumCount,
        priorityLowCount: priorityLowCount,
        summaryStatus: 'ready',
      })),
      action08PresentAnalysisReport: jest.fn(async () => ({
        deliveryTarget: deliveryEmailAddress,
        deliveryTimestamp: agentEndTime.toISOString(),
        deliveryStatus: 'sent',
      })),
      recordAuditEvent: jest.fn(async (eventType: string, metadata: Record<string, unknown>) => {
        const entry = {
          eventType,
          timestamp: new Date(),
          executionId,
          status: metadata.status as string | undefined,
          metadata,
        };
        auditLogEntries.push(entry);
      }),
    };

    const agentRequest = {
      targetMonth: '2024-01',
      teamId: 'team-001',
      triggeredBy: 'schedule' as const,
      includeDetailedAnalysis: true,
      requestTimestamp: agentStartTime.toISOString(),
    };

    await runTx7Imp1Agent(executionId, mockAiClient, agentRequest);

    expect(auditLogEntries.length).toBe(11);

    const agentStartedEntry = auditLogEntries[0];
    expect(agentStartedEntry.eventType).toBe('AGENT_STARTED');
    expect(agentStartedEntry.executionId).toBe(executionId);
    expect(agentStartedEntry.metadata).toEqual(
      expect.objectContaining({
        targetMonth: '2024-01',
        teamId: 'team-001',
        triggeredBy: 'schedule',
        actionList: [
          'Action 01: Confirm Monthly Trigger',
          'Action 02: Extract Accumulated Data',
          'Action 03: Execute Report Generation',
          'Action 04: Analyze Time Series Issues',
          'Action 05: Identify Bottleneck Trend',
          'Action 06: Calculate Team Performance Metrics',
          'Action 07: Assign Priority and Summarize',
          'Action 08: Present Analysis Report',
        ],
      })
    );

    const action01Entry = auditLogEntries[1];
    expect(action01Entry.eventType).toBe('ACTION_01_EXECUTED');
    expect(action01Entry.executionId).toBe(executionId);
    expect(action01Entry.metadata).toEqual(
      expect.objectContaining({
        action: 'Confirm Monthly Trigger',
        triggerConfirmed: true,
        targetMonth: '2024-01',
        promptVersion: ACTION_01_PROMPT_VERSION,
      })
    );

    const action02Entry = auditLogEntries[2];
    expect(action02Entry.eventType).toBe('ACTION_02_EXECUTED');
    expect(action02Entry.executionId).toBe(executionId);
    expect(action02Entry.metadata).toEqual(
      expect.objectContaining({
        action: 'Extract Accumulated Data',
        extractedDataCount: extractedDataCount,
        dataRangeStart: '2024-01-01',
        dataRangeEnd: '2024-01-31',
        promptVersion: ACTION_02_PROMPT_VERSION,
      })
    );

    const action03Entry = auditLogEntries[3];
    expect(action03Entry.eventType).toBe('ACTION_03_COMPLETED');
    expect(action03Entry.executionId).toBe(executionId);
    expect(action03Entry.metadata).toEqual(
      expect.objectContaining({
        action: 'Execute Report Generation',
        reportId: reportId,
        generationStatus: 'success',
        promptVersion: ACTION_03_PROMPT_VERSION,
      })
    );

    const action04Entry = auditLogEntries[4];
    expect(action04Entry.eventType).toBe('ACTION_04_COMPLETED');
    expect(action04Entry.executionId).toBe(executionId);
    expect(action04Entry.metadata).toEqual(
      expect.objectContaining({
        action: 'Analyze Time Series Issues',
        analysisItemCount: analysisItemCount,
        detectedPatternCount: detectedPatternCount,
        promptVersion: ACTION_04_PROMPT_VERSION,
      })
    );

    const action05Entry = auditLogEntries[5];
    expect(action05Entry.eventType).toBe('ACTION_05_COMPLETED');
    expect(action05Entry.executionId).toBe(executionId);
    expect(action05Entry.metadata).toEqual(
      expect.objectContaining({
        action: 'Identify Bottleneck Trend',
        bottleneckCount: bottleneckCount,
        priorityLevel: 'high',
        promptVersion: ACTION_05_PROMPT_VERSION,
      })
    );

    const action06Entry = auditLogEntries[6];
    expect(action06Entry.eventType).toBe('ACTION_06_COMPLETED');
    expect(action06Entry.executionId).toBe(executionId);
    expect(action06Entry.metadata).toEqual(
      expect.objectContaining({
        action: 'Calculate Team Performance Metrics',
        teamCount: teamCount,
        metricsItemCount: 6,
        promptVersion: ACTION_06_PROMPT_VERSION,
      })
    );

    const action07Entry = auditLogEntries[7];
    expect(action07Entry.eventType).toBe('ACTION_07_COMPLETED');
    expect(action07Entry.executionId).toBe(executionId);
    expect(action07Entry.metadata).toEqual(
      expect.objectContaining({
        action: 'Assign Priority and Summarize',
        priorityHighCount: priorityHighCount,
        priorityMediumCount: priorityMediumCount,
        priorityLowCount: priorityLowCount,
        promptVersion: ACTION_07_PROMPT_VERSION,
      })
    );

    const action08Entry = auditLogEntries[8];
    expect(action08Entry.eventType).toBe('ACTION_08_COMPLETED');
    expect(action08Entry.executionId).toBe(executionId);
    expect(action08Entry.metadata).toEqual(
      expect.objectContaining({
        action: 'Present Analysis Report',
        deliveryTarget: deliveryEmailAddress,
        deliveryStatus: 'sent',
        promptVersion: ACTION_08_PROMPT_VERSION,
      })
    );

    const agentCompletedEntry = auditLogEntries[9];
    expect(agentCompletedEntry.eventType).toBe('AGENT_COMPLETED');
    expect(agentCompletedEntry.executionId).toBe(executionId);
    expect(agentCompletedEntry.metadata).toEqual(
      expect.objectContaining({
        finalStatus: 'SUCCESS',
        totalExecutionTimeMs: expect.any(Number),
        reportId: reportId,
      })
    );

    const auditConsistencyEntry = auditLogEntries[10];
    expect(auditConsistencyEntry.eventType).toBe('AUDIT_CONSISTENCY_VERIFIED');
    expect(auditConsistencyEntry.executionId).toBe(executionId);
    expect(auditConsistencyEntry.metadata).toEqual(
      expect.objectContaining({
        totalEventCount: 11,
        eventSequenceValid: true,
        expectedSequence: [
          'AGENT_STARTED',
          'ACTION_01_EXECUTED',
          'ACTION_02_EXECUTED',
          'ACTION_03_COMPLETED',
          'ACTION_04_COMPLETED',
          'ACTION_05_COMPLETED',
          'ACTION_06_COMPLETED',
          'ACTION_07_COMPLETED',
          'ACTION_08_COMPLETED',
          'AGENT_COMPLETED',
          'AUDIT_CONSISTENCY_VERIFIED',
        ],
      })
    );

    const eventSequence = auditLogEntries.map((entry) => entry.eventType);
    expect(eventSequence[0]).toBe('AGENT_STARTED');
    expect(eventSequence[1]).toBe('ACTION_01_EXECUTED');
    expect(eventSequence[2]).toBe('ACTION_02_EXECUTED');
    expect(eventSequence[3]).toBe('ACTION_03_COMPLETED');
    expect(eventSequence[4]).toBe('ACTION_04_COMPLETED');
    expect(eventSequence[5]).toBe('ACTION_05_COMPLETED');
    expect(eventSequence[6]).toBe('ACTION_06_COMPLETED');
    expect(eventSequence[7]).toBe('ACTION_07_COMPLETED');
    expect(eventSequence[8]).toBe('ACTION_08_COMPLETED');
    expect(eventSequence[9]).toBe('AGENT_COMPLETED');
    expect(eventSequence[10]).toBe('AUDIT_CONSISTENCY_VERIFIED');

    for (let i = 1; i < auditLogEntries.length; i++) {
      expect(auditLogEntries[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        auditLogEntries[i - 1].timestamp.getTime()
      );
    }

    expect(mockAiClient.action01ConfirmMonthlyTrigger).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action02ExtractAccumulatedData).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action03ExecuteReportGeneration).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action04AnalyzeTimeSeriesIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action05IdentifyBottleneckTrend).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action06CalculateTeamPerformanceMetrics).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action07AssignPriorityAndSummarize).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action08PresentAnalysisReport).toHaveBeenCalledTimes(1);

    const agentCompletedMetadata = agentCompletedEntry.metadata as Record<string, unknown>;
    expect(agentCompletedMetadata.finalStatus).toBe('SUCCESS');
    expect(typeof agentCompletedMetadata.totalExecutionTimeMs).toBe('number');
    expect((agentCompletedMetadata.totalExecutionTimeMs as number) > 0).toBe(true);
  });
});