import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AgentInput, type Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('tx-3-imp-1 orchestrator', () => {
  test('SCEN-3126: AIエージェント実行の全ライフサイクルが監査テーブルに7件の正確な記録で記録される', async () => {
    // Setup: Mock audit table to capture all audit records in order
    const auditRecords: Array<{
      timestamp: string;
      processId: string;
      userId: string;
      actionName?: string;
      status: string;
      details?: Record<string, unknown>;
    }> = [];

    // Setup: Mock AI client implementation
    const mockAiClient: Tx3Imp1AiClient = {
      extractKeywords: jest.fn(async (reportText: string) => {
        return {
          keywords: [
            { keyword: 'database_performance', frequency: 3, confidence: 0.92 },
            { keyword: 'api_latency', frequency: 2, confidence: 0.85 },
            { keyword: 'memory_leak', frequency: 1, confidence: 0.78 },
          ],
        };
      }),

      classifyIssueCategory: jest.fn(async (keywords: Array<{ keyword: string }>) => {
        return {
          classifications: [
            { keyword: 'database_performance', category: 'infrastructure', severity: 'high' },
            { keyword: 'api_latency', category: 'performance', severity: 'medium' },
            { keyword: 'memory_leak', category: 'quality', severity: 'high' },
          ],
        };
      }),

      assignPriorityScore: jest.fn(async (
        classifiedIssues: Array<{
          keyword: string;
          category: string;
          severity: string;
        }>
      ) => {
        return {
          prioritizedIssues: [
            {
              keyword: 'database_performance',
              category: 'infrastructure',
              severity: 'high',
              impactScore: 85,
              urgencyScore: 90,
              recurrenceRiskScore: 75,
              finalPriorityScore: 83,
              priorityRank: 'HIGH',
              ruleId: 'RULE_20250119_001',
            },
            {
              keyword: 'memory_leak',
              category: 'quality',
              severity: 'high',
              impactScore: 70,
              urgencyScore: 65,
              recurrenceRiskScore: 88,
              finalPriorityScore: 74,
              priorityRank: 'HIGH',
              ruleId: 'RULE_20250119_001',
            },
            {
              keyword: 'api_latency',
              category: 'performance',
              severity: 'medium',
              impactScore: 60,
              urgencyScore: 55,
              recurrenceRiskScore: 62,
              finalPriorityScore: 59,
              priorityRank: 'MEDIUM',
              ruleId: 'RULE_20250119_001',
            },
          ],
        };
      }),

      generatePrioritizedList: jest.fn(async (
        prioritizedIssues: Array<{
          keyword: string;
          finalPriorityScore: number;
          priorityRank: string;
        }>
      ) => {
        return {
          reportId: 'RPT_20250119_001',
          issueCount: 3,
          generatedAt: '2025-01-19T09:30:00Z',
          issues: [
            {
              rank: 1,
              keyword: 'database_performance',
              priorityScore: 83,
              priorityRank: 'HIGH',
              color: 'red',
            },
            {
              rank: 2,
              keyword: 'memory_leak',
              priorityScore: 74,
              priorityRank: 'HIGH',
              color: 'red',
            },
            {
              rank: 3,
              keyword: 'api_latency',
              priorityScore: 59,
              priorityRank: 'MEDIUM',
              color: 'yellow',
            },
          ],
        };
      }),

      sendNotificationEmail: jest.fn(async (emailPayload: {
        recipientUserId: string;
        reportId: string;
        issues: Array<{ rank: number; keyword: string; priorityScore: number }>;
      }) => {
        return {
          messageId: 'MSG_20250119_001',
          recipientUserId: emailPayload.recipientUserId,
          deliveryStatus: 'success',
          sentAt: '2025-01-19T09:30:15Z',
        };
      }),
    };

    // Setup: Mock audit logger to capture records
    const mockAuditLogger = {
      log: jest.fn((record: typeof auditRecords[0]) => {
        auditRecords.push(record);
      }),
    };

    // Setup: Input parameters matching Tx3Imp1AgentInput type
    const agentInput: Tx3Imp1AgentInput = {
      aggregatedReportIds: ['RPT_20250119_001', 'RPT_20250119_002'],
      analysisStartDate: '2025-01-18T00:00:00Z',
      analysisEndDate: '2025-01-19T23:59:59Z',
      managerUserId: 'MGR_00001',
      priorityThresholdScore: 70,
    };

    // Setup: Mock context
    const mockContext = {
      executingUserId: 'SYS_AGENT_001',
      teamId: 'TEAM_DEV_001',
      retryAttempt: 0,
    };

    // Setup: Mock repository or database layer
    const mockRepository = {
      getAggregatedReports: jest.fn(async (ids: string[]) => {
        return [
          {
            id: 'RPT_20250119_001',
            issues: 'database_performance問題が続いている。クエリ最適化が必要。api_latencyも報告。',
          },
          {
            id: 'RPT_20250119_002',
            issues: 'memory_leakを検出。再発リスク高い。database_performanceも関連。',
          },
        ];
      }),
      saveAuditRecord: jest.fn(async (record: typeof auditRecords[0]) => {
        mockAuditLogger.log(record);
        return { success: true };
      }),
    };

    // Execute: Call runTx3Imp1Agent with injected mock AI client
    const executionStartTime = '2025-01-19T09:30:00Z';
    const executionId = 'EXEC_20250119_001';

    // Simulate agent execution with audit capture
    const result = await runTx3Imp1Agent(agentInput, mockAiClient, {
      executionId,
      startTime: executionStartTime,
      auditLogger: mockAuditLogger,
      repository: mockRepository,
      context: mockContext,
    });

    // Verify: Result structure
    expect(result).toMatchObject({
      executionId: expect.any(String),
      extractedIssuesCount: 3,
      prioritizedIssuesList: expect.arrayContaining([
        expect.objectContaining({
          keyword: expect.any(String),
          finalPriorityScore: expect.any(Number),
          priorityRank: expect.stringMatching(/HIGH|MEDIUM|LOW/),
        }),
      ]),
      emailSendStatus: 'success',
      completionTimestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
    });

    // Verify: Audit records were created in exact sequence (7 records total)
    expect(auditRecords).toHaveLength(7);

    // Record 1: START
    expect(auditRecords[0]).toMatchObject({
      status: 'START',
      processId: executionId,
      userId: mockContext.executingUserId,
      actionName: undefined,
      timestamp: executionStartTime,
    });

    // Record 2: extractKeywords COMPLETED
    expect(auditRecords[1]).toMatchObject({
      status: 'COMPLETED',
      processId: executionId,
      actionName: 'extractKeywords',
      details: expect.objectContaining({
        extractedCount: 3,
      }),
    });

    // Record 3: classifyIssueCategory COMPLETED
    expect(auditRecords[2]).toMatchObject({
      status: 'COMPLETED',
      processId: executionId,
      actionName: 'classifyIssueCategory',
      details: expect.objectContaining({
        classificationCount: 3,
      }),
    });

    // Record 4: assignPriority COMPLETED
    expect(auditRecords[3]).toMatchObject({
      status: 'COMPLETED',
      processId: executionId,
      actionName: 'assignPriority',
      details: expect.objectContaining({
        ruleId: 'RULE_20250119_001',
        prioritizedIssueCount: 3,
        scoresApplied: expect.arrayContaining([
          expect.objectContaining({
            keyword: 'database_performance',
            impactScore: 85,
            urgencyScore: 90,
            recurrenceRiskScore: 75,
            finalPriorityScore: 83,
          }),
        ]),
      }),
    });

    // Record 5: generatePrioritizedList COMPLETED
    expect(auditRecords[4]).toMatchObject({
      status: 'COMPLETED',
      processId: executionId,
      actionName: 'generatePrioritizedList',
      details: expect.objectContaining({
        generatedListSize: 3,
        reportId: 'RPT_20250119_001',
      }),
    });

    // Record 6: sendEmail COMPLETED
    expect(auditRecords[5]).toMatchObject({
      status: 'COMPLETED',
      processId: executionId,
      actionName: 'sendEmail',
      details: expect.objectContaining({
        recipientUserId: 'MGR_00001',
        deliveryStatus: 'success',
        messageId: 'MSG_20250119_001',
      }),
    });

    // Record 7: SUCCESS
    expect(auditRecords[6]).toMatchObject({
      status: 'SUCCESS',
      processId: executionId,
      userId: mockContext.executingUserId,
      actionName: undefined,
      details: expect.objectContaining({
        totalProcessingTimeMs: expect.any(Number),
        completedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
      }),
    });

    // Verify: Timestamp ordering (must be strictly increasing or equal)
    for (let i = 1; i < auditRecords.length; i++) {
      const prevTime = new Date(auditRecords[i - 1].timestamp).getTime();
      const currTime = new Date(auditRecords[i].timestamp).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }

    // Verify: AI client methods were called in correct sequence
    expect(mockAiClient.extractKeywords).toHaveBeenCalledTimes(1);
    expect(mockAiClient.classifyIssueCategory).toHaveBeenCalledTimes(1);
    expect(mockAiClient.assignPriorityScore).toHaveBeenCalledTimes(1);
    expect(mockAiClient.generatePrioritizedList).toHaveBeenCalledTimes(1);
    expect(mockAiClient.sendNotificationEmail).toHaveBeenCalledTimes(1);

    // Verify: Email was sent with correct payload
    const emailCall = (mockAiClient.sendNotificationEmail as jest.Mock).mock.calls[0][0];
    expect(emailCall).toMatchObject({
      recipientUserId: 'MGR_00001',
      reportId: expect.any(String),
      issues: expect.arrayContaining([
        expect.objectContaining({
          keyword: 'database_performance',
          priorityScore: 83,
        }),
      ]),
    });

    // Verify: Output contains correct metrics
    expect(result.extractedIssuesCount).toBe(3);
    expect(result.prioritizedIssuesList).toHaveLength(3);
    expect(result.prioritizedIssuesList[0].finalPriorityScore).toBe(83);
    expect(result.prioritizedIssuesList[1].finalPriorityScore).toBe(74);
    expect(result.prioritizedIssuesList[2].finalPriorityScore).toBe(59);
  });
});