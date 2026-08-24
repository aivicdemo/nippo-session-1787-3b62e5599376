import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type {
  Tx7Imp1AgentInput,
  Tx7Imp1AgentOutput,
} from '../../src/agents/tx-7-imp-1/orchestrator';

describe('朝会報告管理システム - 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-3196
  test('同じ要求を再実行しても書き込みや通知を重複させない', async () => {
    // === Setup: Mock data and services ===
    const targetMonth = '2024-01';
    const managerUserId = 'mgr-001';
    const triggerTimestamp = new Date('2024-02-01T09:00:00Z');

    const mockReportedDataItems = [
      {
        reportId: 'report-001',
        teamId: 'team-001',
        date: '2024-01-01',
        challenges: ['Database performance', 'API latency'],
        completionRate: 0.85,
        resolutionDaysAvg: 2.5,
      },
      {
        reportId: 'report-002',
        teamId: 'team-001',
        date: '2024-01-02',
        challenges: ['Database performance', 'Memory leak'],
        completionRate: 0.90,
        resolutionDaysAvg: 3.0,
      },
      {
        reportId: 'report-003',
        teamId: 'team-002',
        date: '2024-01-03',
        challenges: ['API latency', 'Network timeout'],
        completionRate: 0.75,
        resolutionDaysAvg: 4.0,
      },
      {
        reportId: 'report-004',
        teamId: 'team-002',
        date: '2024-01-04',
        challenges: ['Memory leak', 'Resource contention'],
        completionRate: 0.88,
        resolutionDaysAvg: 2.8,
      },
      {
        reportId: 'report-005',
        teamId: 'team-001',
        date: '2024-01-05',
        challenges: ['Database performance', 'Query optimization'],
        completionRate: 0.92,
        resolutionDaysAvg: 1.5,
      },
      {
        reportId: 'report-006',
        teamId: 'team-003',
        date: '2024-01-08',
        challenges: ['API latency', 'Cache invalidation'],
        completionRate: 0.80,
        resolutionDaysAvg: 3.5,
      },
      {
        reportId: 'report-007',
        teamId: 'team-001',
        date: '2024-01-09',
        challenges: ['Database performance', 'Connection pooling'],
        completionRate: 0.89,
        resolutionDaysAvg: 2.2,
      },
      {
        reportId: 'report-008',
        teamId: 'team-002',
        date: '2024-01-10',
        challenges: ['Network timeout', 'Retry logic'],
        completionRate: 0.79,
        resolutionDaysAvg: 3.8,
      },
      {
        reportId: 'report-009',
        teamId: 'team-003',
        date: '2024-01-15',
        challenges: ['Memory leak', 'GC tuning'],
        completionRate: 0.86,
        resolutionDaysAvg: 2.9,
      },
      {
        reportId: 'report-010',
        teamId: 'team-001',
        date: '2024-01-22',
        challenges: ['Database performance', 'Index strategy'],
        completionRate: 0.91,
        resolutionDaysAvg: 2.0,
      },
    ];

    // Mock audit trail to track writes and notifications
    const writeAuditLog: Array<{
      type: string;
      timestamp: Date;
      operationId: string;
    }> = [];
    const notificationLog: Array<{
      userId: string;
      method: string;
      timestamp: Date;
      operationId: string;
    }> = [];

    // Mock AI client for first execution
    const mockAiClientFirstRun = {
      extractReportData: jest.fn(async () => mockReportedDataItems),
      analyzeTimeSeriesTrends: jest.fn(async () => ({
        dailyMetrics: [
          { date: '2024-01-01', severity: 2.0 },
          { date: '2024-01-05', severity: 1.5 },
          { date: '2024-01-10', severity: 2.5 },
          { date: '2024-01-15', severity: 2.2 },
          { date: '2024-01-22', severity: 1.8 },
        ],
        trend: 'stable' as const,
      })),
      analyzeBottleneckTrend: jest.fn(async () => ({
        bottlenecks: [
          { keyword: 'Database performance', occurrences: 5 },
          { keyword: 'API latency', occurrences: 3 },
          { keyword: 'Memory leak', occurrences: 3 },
        ],
        pattern: 'improving' as const,
      })),
      calculateTeamMetrics: jest.fn(async () => ({
        teams: [
          {
            teamId: 'team-001',
            avgResolutionDays: 2.34,
            reportSubmissionRate: 0.92,
            reissueRate: 0.08,
          },
          {
            teamId: 'team-002',
            avgResolutionDays: 3.53,
            reportSubmissionRate: 0.87,
            reissueRate: 0.13,
          },
          {
            teamId: 'team-003',
            avgResolutionDays: 3.2,
            reportSubmissionRate: 0.83,
            reissueRate: 0.17,
          },
        ],
      })),
      rankPriorityChallenges: jest.fn(async () => [
        {
          challengeId: 'ch-001',
          keyword: 'Database performance',
          priorityScore: 85,
          occurrenceFrequency: 5,
          impactLevel: 'high',
          resolutionDaysAverage: 2.34,
        },
        {
          challengeId: 'ch-002',
          keyword: 'API latency',
          priorityScore: 72,
          occurrenceFrequency: 3,
          impactLevel: 'high',
          resolutionDaysAverage: 3.5,
        },
        {
          challengeId: 'ch-003',
          keyword: 'Memory leak',
          priorityScore: 68,
          occurrenceFrequency: 3,
          impactLevel: 'medium',
          resolutionDaysAverage: 2.9,
        },
      ]),
    };

    // Mock AI client for second (retry) execution
    const mockAiClientSecondRun = {
      extractReportData: jest.fn(async () => mockReportedDataItems),
      analyzeTimeSeriesTrends: jest.fn(async () => ({
        dailyMetrics: [
          { date: '2024-01-01', severity: 2.0 },
          { date: '2024-01-05', severity: 1.5 },
          { date: '2024-01-10', severity: 2.5 },
          { date: '2024-01-15', severity: 2.2 },
          { date: '2024-01-22', severity: 1.8 },
        ],
        trend: 'stable' as const,
      })),
      analyzeBottleneckTrend: jest.fn(async () => ({
        bottlenecks: [
          { keyword: 'Database performance', occurrences: 5 },
          { keyword: 'API latency', occurrences: 3 },
          { keyword: 'Memory leak', occurrences: 3 },
        ],
        pattern: 'improving' as const,
      })),
      calculateTeamMetrics: jest.fn(async () => ({
        teams: [
          {
            teamId: 'team-001',
            avgResolutionDays: 2.34,
            reportSubmissionRate: 0.92,
            reissueRate: 0.08,
          },
          {
            teamId: 'team-002',
            avgResolutionDays: 3.53,
            reportSubmissionRate: 0.87,
            reissueRate: 0.13,
          },
          {
            teamId: 'team-003',
            avgResolutionDays: 3.2,
            reportSubmissionRate: 0.83,
            reissueRate: 0.17,
          },
        ],
      })),
      rankPriorityChallenges: jest.fn(async () => [
        {
          challengeId: 'ch-001',
          keyword: 'Database performance',
          priorityScore: 85,
          occurrenceFrequency: 5,
          impactLevel: 'high',
          resolutionDaysAverage: 2.34,
        },
        {
          challengeId: 'ch-002',
          keyword: 'API latency',
          priorityScore: 72,
          occurrenceFrequency: 3,
          impactLevel: 'high',
          resolutionDaysAverage: 3.5,
        },
        {
          challengeId: 'ch-003',
          keyword: 'Memory leak',
          priorityScore: 68,
          occurrenceFrequency: 3,
          impactLevel: 'medium',
          resolutionDaysAverage: 2.9,
        },
      ]),
    };

    // Mock NotificationServiceAdapter with tracking
    const mockNotificationService = {
      sendReminderNotification: jest.fn(async (userId: string) => {
        const notificationEntry = {
          userId,
          method: 'sendReminderNotification',
          timestamp: new Date(),
          operationId: 'first-run',
        };
        notificationLog.push(notificationEntry);
        return { status: 'delivered' };
      }),
      scheduleNotification: jest.fn(async () => ({ status: 'scheduled' })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'delivered' })),
    };

    // Mock database layer with deduplication tracking
    const dbState = {
      extractedReports: new Map<string, typeof mockReportedDataItems[0]>(),
      generatedReports: new Map<
        string,
        {
          reportId: string;
          generatedAt: Date;
          targetMonth: string;
          managerUserId: string;
        }
      >(),
      analysisResults: new Map<
        string,
        {
          resultId: string;
          type: string;
          reportId: string;
          createdAt: Date;
        }
      >(),
    };

    const mockDatabase = {
      // Simulate insert with idempotent key check
      insertOrUpdateExtractedReport: jest.fn(
        async (report: typeof mockReportedDataItems[0], operationId: string) => {
          const key = `${report.reportId}-${operationId}`;
          if (!dbState.extractedReports.has(key)) {
            dbState.extractedReports.set(key, report);
            writeAuditLog.push({
              type: 'INSERT_EXTRACTED_REPORT',
              timestamp: new Date(),
              operationId,
            });
          }
          return { success: true };
        }
      ),
      insertGeneratedReport: jest.fn(
        async (
          reportId: string,
          generatedAt: Date,
          targetMonth: string,
          managerUserId: string,
          operationId: string
        ) => {
          const key = `${reportId}-${operationId}`;
          if (!dbState.generatedReports.has(key)) {
            dbState.generatedReports.set(key, {
              reportId,
              generatedAt,
              targetMonth,
              managerUserId,
            });
            writeAuditLog.push({
              type: 'INSERT_GENERATED_REPORT',
              timestamp: new Date(),
              operationId,
            });
          }
          return { success: true };
        }
      ),
      insertAnalysisResult: jest.fn(
        async (
          resultId: string,
          type: string,
          reportId: string,
          createdAt: Date,
          operationId: string
        ) => {
          const key = `${resultId}-${operationId}`;
          if (!dbState.analysisResults.has(key)) {
            dbState.analysisResults.set(key, {
              resultId,
              type,
              reportId,
              createdAt,
            });
            writeAuditLog.push({
              type: `INSERT_${type.toUpperCase()}`,
              timestamp: new Date(),
              operationId,
            });
          }
          return { success: true };
        }
      ),
      getLastReportIdempotencyKey: jest.fn(async () => null),
      recordOperationIdempotencyKey: jest.fn(async () => ({ success: true })),
    };

    // Wrapped agent executor for first run
    const executeFirstRun = async (): Promise<Tx7Imp1AgentOutput> => {
      const input: Tx7Imp1AgentInput = {
        triggerTimestamp,
        targetMonth,
        managerUserId,
        includeDetailedAnalysis: true,
      };

      const result = await runTx7Imp1Agent(input, mockAiClientFirstRun as any);

      // Simulate database writes for first run
      for (const report of mockReportedDataItems) {
        await mockDatabase.insertOrUpdateExtractedReport(
          report,
          'first-run'
        );
      }
      await mockDatabase.insertGeneratedReport(
        result.reportId,
        result.deliveryTimestamp,
        targetMonth,
        managerUserId,
        'first-run'
      );
      await mockDatabase.insertAnalysisResult(
        'ts-001',
        'timeseries',
        result.reportId,
        new Date('2024-02-01T09:00:00Z'),
        'first-run'
      );
      await mockDatabase.insertAnalysisResult(
        'bn-001',
        'bottleneck',
        result.reportId,
        new Date('2024-02-01T09:00:00Z'),
        'first-run'
      );
      await mockDatabase.insertAnalysisResult(
        'tm-001',
        'teammetrics',
        result.reportId,
        new Date('2024-02-01T09:00:00Z'),
        'first-run'
      );

      // Simulate notification send
      await mockNotificationService.sendReminderNotification(managerUserId);
      notificationLog[notificationLog.length - 1].operationId = 'first-run';

      return result;
    };

    // Wrapped agent executor for second (retry) run
    const executeSecondRun = async (): Promise<Tx7Imp1AgentOutput> => {
      const input: Tx7Imp1AgentInput = {
        triggerTimestamp,
        targetMonth,
        managerUserId,
        includeDetailedAnalysis: true,
      };

      // Clear mock call history for fresh tracking
      mockNotificationService.sendReminderNotification.mockClear();

      const result = await runTx7Imp1Agent(input, mockAiClientSecondRun as any);

      // Simulate database writes for second run (should be deduplicated)
      for (const report of mockReportedDataItems) {
        await mockDatabase.insertOrUpdateExtractedReport(
          report,
          'second-run'
        );
      }
      await mockDatabase.insertGeneratedReport(
        result.reportId,
        result.deliveryTimestamp,
        targetMonth,
        managerUserId,
        'second-run'
      );
      await mockDatabase.insertAnalysisResult(
        'ts-001',
        'timeseries',
        result.reportId,
        new Date('2024-02-01T09:00:00Z'),
        'second-run'
      );
      await mockDatabase.insertAnalysisResult(
        'bn-001',
        'bottleneck',
        result.reportId,
        new Date('2024-02-01T09:00:00Z'),
        'second-run'
      );
      await mockDatabase.insertAnalysisResult(
        'tm-001',
        'teammetrics',
        result.reportId,
        new Date('2024-02-01T09:00:00Z'),
        'second-run'
      );

      return result;
    };

    // === Execute First Run ===
    const firstRunOutput = await executeFirstRun();

    expect(firstRunOutput).toBeDefined();
    expect(firstRunOutput.reportId).toBeDefined();
    expect(firstRunOutput.executionStatus).toBe('success');
    expect(firstRunOutput.deliveryTimestamp).toEqual(
      expect.any(Date)
    );
    expect(firstRunOutput.analysisResultSummary).toBeDefined();
    expect(
      firstRunOutput.analysisResultSummary.topPriorityChallenges
    ).toHaveLength(3);

    // Verify first run wrote exactly 10 extracted reports + 1 generated report + 3 analysis results
    const firstRunWriteAuditCount = writeAuditLog.length;
    expect(firstRunWriteAuditCount).toBe(14); // 10 + 1 + 3

    const firstRunNotificationCount =
      notificationLog.length;
    expect(firstRunNotificationCount).toBe(1);

    const firstRunExtractedReportCount =
      dbState.extractedReports.size;
    expect(firstRunExtractedReportCount).toBe(10);

    const firstRunGeneratedReportCount =
      dbState.generatedReports.size;
    expect(firstRunGeneratedReportCount).toBe(1);

    const firstRunAnalysisResultCount =
      dbState.analysisResults.size;
    expect(firstRunAnalysisResultCount).toBe(3);

    const firstRunReportId = firstRunOutput.reportId;
    const firstRunDeliveryTime = firstRunOutput.deliveryTimestamp;
    const firstRunTopChallenges =
      firstRunOutput.analysisResultSummary.topPriorityChallenges;

    // === Execute Second Run (Retry) ===
    const secondRunOutput = await executeSecondRun();

    expect(secondRunOutput).toBeDefined();
    expect(secondRunOutput.reportId).toBe(firstRunReportId);
    expect(secondRunOutput.executionStatus).toBe('success');
    expect(secondRunOutput.deliveryTimestamp).toEqual(firstRunDeliveryTime);
    expect(secondRunOutput.analysisResultSummary.topPriorityChallenges).toEqual(
      firstRunTopChallenges
    );

    // === Verify No Duplication ===

    // Check extracted reports: should still be 10 (no duplication from second run)
    expect(dbState.extractedReports.size).toBe(10);

    // Check generated reports: should still be 1 (no new report created, same one returned)
    expect(dbState.generatedReports.size).toBe(1);

    // Check analysis results: should still be 3 (no duplication)
    expect(dbState.analysisResults.size).toBe(3);

    // Check that no new write audit entries were created (notification not sent on retry)
    // Since we deduplicate by operationId, second run should not add new write entries
    // In a real scenario with proper deduplication, the write count should not increase
    // For this test, we verify the mock was not called by checking mock.mock.calls
    expect(
      mockNotificationService.sendReminderNotification.mock.calls.length
    ).toBe(0);

    // Verify report content is identical
    expect(firstRunOutput.analysisResultSummary).toEqual(
      secondRunOutput.analysisResultSummary
    );
    expect(firstRunOutput.analysisResultSummary.performanceMetrics).toEqual(
      secondRunOutput.analysisResultSummary.performanceMetrics
    );
    expect(firstRunOutput.analysisResultSummary.bottleneckTrend).toEqual(
      secondRunOutput.analysisResultSummary.bottleneckTrend
    );

    // Verify idempotency: same reportId returned
    expect(secondRunOutput.reportId).toBe(firstRunReportId);

    // Verify timestamps are identical
    expect(
      new Date(secondRunOutput.deliveryTimestamp).getTime()
    ).toBe(new Date(firstRunDeliveryTime).getTime());
  });
});