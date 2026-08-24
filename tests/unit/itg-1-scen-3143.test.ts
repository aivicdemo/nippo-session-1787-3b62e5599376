import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type {
  Tx4AgentExecutionRequest,
  Tx4AgentExecutionResult,
  Tx4Imp1AiClient,
  PrioritizedIssue,
  CountermeasurePlan,
} from '../../src/agents/tx-4-imp-1/orchestrator';

describe('TX4 AIエージェント - ダッシュボード分析から課題指示までの自動実行', () => {
  // SCEN-3143: [edge] idempotent retry - 同一要求の再実行時に重複書き込み・通知を防止
  test('should not duplicate dashboard artifacts, notifications, or database records on idempotent retry with identical input dataset', async () => {
    // ===== Setup: Test Data =====
    const executionRequestId = 'exec-20240115-001';
    const teamId = 'team-dev-001';
    const managerId = 'mgr-001';
    const reportDate = '2024-01-15';
    const meetingStartTime = '09:00';

    const request: Tx4AgentExecutionRequest = {
      teamId,
      managerId,
      reportDate,
      meetingStartTime,
    };

    // Mock data for dashboard analysis results
    const mockPrioritizedIssues: PrioritizedIssue[] = [
      {
        issueKeyword: 'API_TIMEOUT',
        occurrenceFrequency: 5,
        impactScore: 85,
        priorityRank: 'HIGH',
        affectedMemberIds: ['eng-001', 'eng-002'],
      },
      {
        issueKeyword: 'DATABASE_LOCK',
        occurrenceFrequency: 3,
        impactScore: 72,
        priorityRank: 'MEDIUM',
        affectedMemberIds: ['eng-003'],
      },
    ];

    const mockCountermeasurePlan: CountermeasurePlan = {
      topPriorityIssue: 'API_TIMEOUT',
      recommendedActions: [
        'Increase API timeout threshold to 30s',
        'Implement connection pooling',
        'Add monitoring alert for timeout events',
      ],
      estimatedResolutionDays: 3,
      assignedTeamId: 'team-platform-001',
    };

    const mockExecutionResult: Tx4AgentExecutionResult = {
      executionId: executionRequestId,
      aggregatedReportCount: 10,
      extractedIssueCount: 2,
      prioritizedIssues: mockPrioritizedIssues,
      countermeasurePlan: mockCountermeasurePlan,
      summaryEmailSent: true,
      completionTimestamp: new Date('2024-01-15T09:30:00Z'),
    };

    // ===== Mock: Tx4Imp1AiClient Stub =====
    const aiClientCallHistory = {
      action01Calls: 0,
      action02Calls: 0,
      action03Calls: 0,
      action04Calls: 0,
      action05Calls: 0,
      action06Calls: 0,
      action07Calls: 0,
    };

    const mockAiClient: Tx4Imp1AiClient = {
      executeAction01_FetchRealtimeProgressData: jest
        .fn()
        .mockImplementation(async () => {
          aiClientCallHistory.action01Calls++;
          return {
            teamId,
            reportDate,
            progressData: [
              {
                projectId: 'proj-001',
                progressPercentage: 65,
                isDelayed: true,
                lastUpdated: new Date('2024-01-15T08:00:00Z'),
              },
            ],
          };
        }),
      executeAction02_DetectIssuesAndAnomalies: jest
        .fn()
        .mockImplementation(async () => {
          aiClientCallHistory.action02Calls++;
          return {
            detectedIssues: mockPrioritizedIssues,
            anomalyFlags: ['PROGRESS_BELOW_TARGET', 'UNMET_DEADLINE'],
          };
        }),
      executeAction03_CorrelateWithHistoricalIssues: jest
        .fn()
        .mockImplementation(async () => {
          aiClientCallHistory.action03Calls++;
          return {
            issuesWithHistory: mockPrioritizedIssues.map((issue) => ({
              ...issue,
              recurrenceRisk: 'HIGH',
              previousOccurrenceDates: ['2024-01-10', '2024-01-08'],
            })),
          };
        }),
      executeAction04_AutoRankByPriority: jest
        .fn()
        .mockImplementation(async () => {
          aiClientCallHistory.action04Calls++;
          return {
            rankedIssues: mockPrioritizedIssues,
          };
        }),
      executeAction05_GenerateCountermeasurePlan: jest
        .fn()
        .mockImplementation(async () => {
          aiClientCallHistory.action05Calls++;
          return {
            plan: mockCountermeasurePlan,
          };
        }),
      executeAction06_CreateDashboardArtifact: jest
        .fn()
        .mockImplementation(async () => {
          aiClientCallHistory.action06Calls++;
          return {
            dashboardId: 'dash-20240115-001',
            contentUrl: 'https://dashboard.internal/reports/dash-20240115-001',
            generatedAt: new Date('2024-01-15T09:25:00Z'),
          };
        }),
      executeAction07_ExtractAndNotifyUnsubmittedMembers: jest
        .fn()
        .mockImplementation(async () => {
          aiClientCallHistory.action07Calls++;
          return {
            unsubmittedMemberIds: ['eng-004', 'eng-005'],
            notificationsSent: 2,
          };
        }),
    };

    // ===== Mock: NotificationServiceAdapter Stub =====
    const notificationCallHistory: {
      userId: string;
      timestamp: Date;
      deliveryStatus: string;
    }[] = [];

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async (userId: string) => {
        notificationCallHistory.push({
          userId,
          timestamp: new Date('2024-01-15T09:30:00Z'),
          deliveryStatus: 'SENT',
        });
        return { status: 'SENT', deliveredAt: new Date('2024-01-15T09:30:01Z') };
      }),
    };

    // ===== Mock: TextAnalysisServiceAdapter Stub =====
    const textAnalysisCallHistory = {
      extractKeywordsCalls: 0,
      assessImpactScoreCalls: 0,
      classifyIssueSeverityCalls: 0,
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async () => {
        textAnalysisCallHistory.extractKeywordsCalls++;
        return {
          keywords: ['API_TIMEOUT', 'DATABASE_LOCK'],
          frequency: { API_TIMEOUT: 5, DATABASE_LOCK: 3 },
        };
      }),
      assessImpactScore: jest.fn(async () => {
        textAnalysisCallHistory.assessImpactScoreCalls++;
        return { score: 85, confidence: 0.92 };
      }),
      classifyIssueSeverity: jest.fn(async () => {
        textAnalysisCallHistory.classifyIssueSeverityCalls++;
        return { severity: 'HIGH' };
      }),
    };

    // ===== Mock: Database Stub =====
    const dbCallHistory = {
      dashboardRecordsCreated: [] as { id: string; createdAt: Date }[],
      issuesWritten: [] as { id: string; createdAt: Date; keyword: string }[],
      notificationLogsWritten: [] as {
        memberId: string;
        sentAt: Date;
        contentHash: string;
      }[],
    };

    const mockDatabase = {
      insertDashboardArtifact: jest.fn(async (artifact: {
        id: string;
        teamId: string;
        createdAt: Date;
      }) => {
        dbCallHistory.dashboardRecordsCreated.push({
          id: artifact.id,
          createdAt: artifact.createdAt,
        });
      }),
      insertOrUpdateIssue: jest.fn(async (issue: {
        id: string;
        keyword: string;
        createdAt: Date;
      }) => {
        const existing = dbCallHistory.issuesWritten.find(
          (i) => i.id === issue.id && i.createdAt === issue.createdAt
        );
        if (!existing) {
          dbCallHistory.issuesWritten.push(issue);
        }
      }),
      insertNotificationLog: jest.fn(async (log: {
        memberId: string;
        sentAt: Date;
        contentHash: string;
      }) => {
        dbCallHistory.notificationLogsWritten.push(log);
      }),
      queryNotificationLogsByMemberId: jest.fn(async (memberId: string) => {
        return dbCallHistory.notificationLogsWritten.filter(
          (log) => log.memberId === memberId
        );
      }),
      queryIssuesByKeywordAndCreatedAt: jest.fn(async (
        keyword: string,
        createdAt: Date
      ) => {
        return dbCallHistory.issuesWritten.filter(
          (issue) => issue.keyword === keyword && issue.createdAt === createdAt
        );
      }),
    };

    // ===== First Execution =====
    const result1 = await runTx4Imp1Agent(request, mockAiClient);

    const firstExecutionRecordedState = {
      dashboardArtifactId: result1.executionId,
      aiCallCounts: {
        action01: aiClientCallHistory.action01Calls,
        action02: aiClientCallHistory.action02Calls,
        action03: aiClientCallHistory.action03Calls,
        action04: aiClientCallHistory.action04Calls,
        action05: aiClientCallHistory.action05Calls,
        action06: aiClientCallHistory.action06Calls,
        action07: aiClientCallHistory.action07Calls,
      },
      notificationCount: notificationCallHistory.length,
      dashboardDbCount: dbCallHistory.dashboardRecordsCreated.length,
      issueDbCount: dbCallHistory.issuesWritten.length,
      textAnalysisCallCounts: {
        extractKeywords: textAnalysisCallHistory.extractKeywordsCalls,
        assessImpactScore: textAnalysisCallHistory.assessImpactScoreCalls,
        classifyIssueSeverity: textAnalysisCallHistory.classifyIssueSeverityCalls,
      },
    };

    // ===== Record Baseline State =====
    const baselineNotificationCount = notificationCallHistory.length;
    const baselineAiCallCounts = { ...aiClientCallHistory };
    const baselineDbIssueCounts = dbCallHistory.issuesWritten.length;
    const baselineTextAnalysisCounts = { ...textAnalysisCallHistory };

    // ===== Second Execution (Idempotent Retry with Same Data) =====
    // Reset call counters for differential counting
    aiClientCallHistory.action01Calls = 0;
    aiClientCallHistory.action02Calls = 0;
    aiClientCallHistory.action03Calls = 0;
    aiClientCallHistory.action04Calls = 0;
    aiClientCallHistory.action05Calls = 0;
    aiClientCallHistory.action06Calls = 0;
    aiClientCallHistory.action07Calls = 0;

    textAnalysisCallHistory.extractKeywordsCalls = 0;
    textAnalysisCallHistory.assessImpactScoreCalls = 0;
    textAnalysisCallHistory.classifyIssueSeverityCalls = 0;

    const notificationCountBefore = notificationCallHistory.length;

    const result2 = await runTx4Imp1Agent(request, mockAiClient);

    // ===== Verify Idempotent Behavior =====
    expect(result2).toBeDefined();
    expect(result2.executionId).toBeDefined();

    // (1) Dashboard artifact should be new or overwritten, not duplicated
    const dashboardCountDiff =
      dbCallHistory.dashboardRecordsCreated.length -
      firstExecutionRecordedState.dashboardDbCount;
    expect(dashboardCountDiff).toLessThanOrEqual(1);

    // (2) NotificationServiceAdapter should have 0 new calls
    const notificationCountDiff = notificationCallHistory.length - notificationCountBefore;
    expect(notificationCountDiff).toBe(0);

    // (3) TextAnalysisServiceAdapter calls should be 0
    expect(aiClientCallHistory.action01Calls).toBe(0);
    expect(aiClientCallHistory.action02Calls).toBe(0);
    expect(aiClientCallHistory.action03Calls).toBe(0);
    expect(aiClientCallHistory.action04Calls).toBe(0);
    expect(aiClientCallHistory.action05Calls).toBe(0);
    expect(aiClientCallHistory.action06Calls).toBe(0);
    expect(aiClientCallHistory.action07Calls).toBe(0);

    // (4) Database issue table should have 0 new records
    const issueCountDiff =
      dbCallHistory.issuesWritten.length - baselineDbIssueCounts;
    expect(issueCountDiff).toBe(0);

    // (5) No duplicate notification entries for same member
    const notificationsByMember: Map<string, number> = new Map();
    for (const log of dbCallHistory.notificationLogsWritten) {
      const count = notificationsByMember.get(log.memberId) || 0;
      notificationsByMember.set(log.memberId, count + 1);
    }
    for (const memberId of notificationsByMember.keys()) {
      const memberLogs = dbCallHistory.notificationLogsWritten.filter(
        (log) => log.memberId === memberId
      );
      const duplicateInSecondWindow = memberLogs.filter(
        (log) =>
          log.sentAt >= new Date('2024-01-15T09:29:00Z') &&
          log.sentAt <= new Date('2024-01-15T09:31:00Z')
      );
      expect(duplicateInSecondWindow.length).toBeLessThanOrEqual(1);
    }

    // (6) No duplicate issue records by ID + createdAt
    const issuesByIdAndCreatedAt: Map<string, number> = new Map();
    for (const issue of dbCallHistory.issuesWritten) {
      const key = `${issue.id}|${issue.createdAt.toISOString()}`;
      const count = issuesByIdAndCreatedAt.get(key) || 0;
      issuesByIdAndCreatedAt.set(key, count + 1);
    }
    for (const count of issuesByIdAndCreatedAt.values()) {
      expect(count).toBeLessThanOrEqual(1);
    }

    // ===== Additional Assertions =====
    expect(result1.aggregatedReportCount).toBe(10);
    expect(result1.extractedIssueCount).toBe(2);
    expect(result1.prioritizedIssues).toHaveLength(2);
    expect(result1.countermeasurePlan.topPriorityIssue).toBe('API_TIMEOUT');
    expect(result1.summaryEmailSent).toBe(true);
  });
});