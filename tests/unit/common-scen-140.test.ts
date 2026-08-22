import { generateMonthlyAnalysisReport } from "../../src/logic/analysis-reporting";

describe("共通: 月次レポート生成から分析完了までの自動実行 - Idempotent Retry", () => {
  test("SCEN-140: 同一の月次レポート生成要求を再実行しても書き込みや通知を重複させない", async () => {
    // Setup: テスト用のモック DB と Email クライアント
    const mockDatabase = {
      monthlyReportRequests: [] as Array<{
        requestId: string;
        timestamp: string;
        targetMonth: string;
      }>,
      monthlyReports: [] as Array<{
        id: string;
        requestId: string;
        generatedAt: string;
        status: string;
      }>,
      analysisResults: [] as Array<{
        id: string;
        reportId: string;
        requestId: string;
        timeSeriesChanges: object;
        bottleneckTransition: object;
        teamPerformanceMetrics: object;
        prioritizedIssues: object;
      }>,
      notificationLogs: [] as Array<{
        id: string;
        requestId: string;
        recipientId: string;
        messageContent: string;
        sentAt: string;
      }>,
      auditLogs: [] as Array<{
        id: string;
        requestId: string;
        executionSequence: number;
        status: string;
        executedAt: string;
      }>,
    };

    const mockEmailClient = {
      sentEmails: [] as Array<{
        recipientId: string;
        subject: string;
        content: string;
      }>,
      sendReport: (recipientId: string, subject: string, content: string) => {
        mockEmailClient.sentEmails.push({
          recipientId,
          subject,
          content,
        });
      },
    };

    // Pre-register test request data
    const testRequestId = "REQ-2024-01-001";
    const testTimestamp = "2024-01-01T00:00:00Z";
    const testTargetMonth = "2024年1月";

    mockDatabase.monthlyReportRequests.push({
      requestId: testRequestId,
      timestamp: testTimestamp,
      targetMonth: testTargetMonth,
    });

    // Mock AI client for report generation
    const mockAiClient = {
      async callAnalyzeReportData(params: {
        requestId: string;
        targetMonth: string;
      }) {
        return {
          success: true,
          data: {
            extractedReports: [
              {
                memberId: "M001",
                reportDate: "2024-01-15",
                issues: ["Database connection timeout", "API latency"],
                status: "completed",
              },
              {
                memberId: "M002",
                reportDate: "2024-01-15",
                issues: ["Memory leak in service A"],
                status: "pending",
              },
            ],
          },
        };
      },

      async callExtractTimeSeriesChanges(params: { reportData: object }) {
        return {
          success: true,
          data: {
            timeline: [
              { date: "2024-01-01", issueCount: 2, resolvedCount: 0 },
              { date: "2024-01-15", issueCount: 5, resolvedCount: 1 },
            ],
          },
        };
      },

      async callAnalyzeBottlenecks(params: { reportData: object }) {
        return {
          success: true,
          data: {
            bottlenecks: [
              {
                name: "Database Performance",
                frequency: 3,
                impact: "high",
              },
              {
                name: "API Response Time",
                frequency: 2,
                impact: "medium",
              },
            ],
          },
        };
      },

      async callComputeTeamMetrics(params: { reportData: object }) {
        return {
          success: true,
          data: {
            teamMetrics: [
              {
                teamId: "T001",
                issueResolutionTime: 180,
                responseCapacity: 0.85,
              },
              {
                teamId: "T002",
                issueResolutionTime: 240,
                responseCapacity: 0.72,
              },
            ],
          },
        };
      },

      async callPrioritizeIssues(params: { analysisData: object }) {
        return {
          success: true,
          data: {
            prioritizedIssues: [
              {
                issueId: "I001",
                priority: "HIGH",
                confidence: 0.95,
                rationale: "Affects multiple teams",
              },
              {
                issueId: "I002",
                priority: "MEDIUM",
                confidence: 0.78,
                rationale: "Single team impact",
              },
            ],
          },
        };
      },

      async callGenerateReportContent(params: { analysisData: object }) {
        return {
          success: true,
          data: {
            reportContent:
              "Monthly analysis for 2024年1月: Critical issues identified in database layer.",
          },
        };
      },

      async callNotifyManager(params: {
        managerId: string;
        reportContent: string;
        prioritizedIssues: object;
      }) {
        return {
          success: true,
          data: {
            notificationId: `NOTIF-${Date.now()}`,
          },
        };
      },
    };

    // First execution
    const firstExecutionResult = await generateMonthlyAnalysisReport({
      requestId: testRequestId,
      targetMonth: testTargetMonth,
      database: mockDatabase as any,
      aiClient: mockAiClient as any,
      emailClient: mockEmailClient as any,
    });

    // Verify first execution success
    expect(firstExecutionResult.success).toBe(true);
    expect(firstExecutionResult.status).toBe("COMPLETED");

    // Record first execution state
    const firstExecutionReportCount = mockDatabase.monthlyReports.length;
    const firstExecutionAnalysisCount = mockDatabase.analysisResults.length;
    const firstExecutionEmailCount = mockEmailClient.sentEmails.length;
    const firstExecutionAnalysisId =
      mockDatabase.analysisResults[0]?.id || "ANALYSIS-001";

    expect(firstExecutionReportCount).toBe(1);
    expect(firstExecutionAnalysisCount).toBe(1);
    expect(firstExecutionEmailCount).toBe(1);

    // Verify audit log for first execution
    expect(mockDatabase.auditLogs.length).toBe(1);
    expect(mockDatabase.auditLogs[0].requestId).toBe(testRequestId);
    expect(mockDatabase.auditLogs[0].status).toBe("COMPLETED");
    expect(mockDatabase.auditLogs[0].executionSequence).toBe(1);

    // Second execution (idempotent retry)
    const secondExecutionResult = await generateMonthlyAnalysisReport({
      requestId: testRequestId,
      targetMonth: testTargetMonth,
      database: mockDatabase as any,
      aiClient: mockAiClient as any,
      emailClient: mockEmailClient as any,
    });

    // Verify second execution returns same result without duplication
    expect(secondExecutionResult.success).toBe(true);
    expect(secondExecutionResult.status).toMatch(
      /IDEMPOTENT_NOOP|RETRY_SKIPPED/
    );

    // Verify no new report record created
    expect(mockDatabase.monthlyReports.length).toBe(firstExecutionReportCount);

    // Verify no duplicate analysis results
    expect(mockDatabase.analysisResults.length).toBe(
      firstExecutionAnalysisCount
    );
    expect(mockDatabase.analysisResults[0]?.id).toBe(firstExecutionAnalysisId);

    // Verify no duplicate email notifications
    expect(mockEmailClient.sentEmails.length).toBe(firstExecutionEmailCount);

    // Verify audit log for second execution
    expect(mockDatabase.auditLogs.length).toBe(2);
    expect(mockDatabase.auditLogs[1].requestId).toBe(testRequestId);
    expect(mockDatabase.auditLogs[1].status).toMatch(
      /IDEMPOTENT_NOOP|RETRY_SKIPPED/
    );
    expect(mockDatabase.auditLogs[1].executionSequence).toBe(2);

    // Verify both audit logs use same requestId
    const allAuditLogsForRequest = mockDatabase.auditLogs.filter(
      (log) => log.requestId === testRequestId
    );
    expect(allAuditLogsForRequest.length).toBe(2);

    // Verify report content remains identical
    const firstReport = mockDatabase.monthlyReports[0];
    expect(firstReport.status).toBe("COMPLETED");
    expect(firstReport.requestId).toBe(testRequestId);

    const firstAnalysis = mockDatabase.analysisResults[0];
    expect(firstAnalysis.requestId).toBe(testRequestId);
    expect(firstAnalysis.timeSeriesChanges).toBeDefined();
    expect(firstAnalysis.bottleneckTransition).toBeDefined();
    expect(firstAnalysis.teamPerformanceMetrics).toBeDefined();
    expect(firstAnalysis.prioritizedIssues).toBeDefined();

    // Verify email content consistency
    const firstEmail = mockEmailClient.sentEmails[0];
    expect(firstEmail.recipientId).toBeDefined();
    expect(firstEmail.subject).toBeDefined();
    expect(firstEmail.content).toBeDefined();
  });
});