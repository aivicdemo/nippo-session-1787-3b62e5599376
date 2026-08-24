import { runTx9Imp1Agent } from "../../src/agents/tx-9-imp-1/orchestrator";
import { type Tx9Imp1AiClient } from "../../src/agents/tx-9-imp-1/orchestrator";

describe("tx-9-imp-1: 日報集約から分析報告までの自動実行エージェント", () => {
  // SCEN-3215: [normal] 日報集約から分析報告までの自動実行エージェント
  test("通常案件を人の都度承認なしで最後まで完了する", async () => {
    // Setup: フェイク AI クライアント
    const mockAiClient: Tx9Imp1AiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        actionId: "action-01",
        aggregatedReports: [
          {
            memberId: "member-001",
            name: "Alice",
            submittedAt: "2024-01-15T09:00:00Z",
            content: {
              yesterday: "Feature A completed",
              today: "Feature B in progress",
              issues: "Integration delay",
            },
          },
          {
            memberId: "member-002",
            name: "Bob",
            submittedAt: "2024-01-15T09:05:00Z",
            content: {
              yesterday: "Tests passed",
              today: "Code review",
              issues: "Review bottleneck",
            },
          },
          {
            memberId: "member-003",
            name: "Charlie",
            submittedAt: "2024-01-15T09:10:00Z",
            content: {
              yesterday: "Doc update",
              today: "Training session",
              issues: "None",
            },
          },
          {
            memberId: "member-004",
            name: "Diana",
            submittedAt: "2024-01-15T09:15:00Z",
            content: {
              yesterday: "Bugfix",
              today: "Release prep",
              issues: "Build failure intermittent",
            },
          },
          {
            memberId: "member-005",
            name: "Eve",
            submittedAt: "2024-01-15T09:20:00Z",
            content: {
              yesterday: "Config update",
              today: "Monitoring setup",
              issues: "Log rotation issue",
            },
          },
          {
            memberId: "member-006",
            name: "Frank",
            submittedAt: "2024-01-15T09:25:00Z",
            content: {
              yesterday: "API endpoint done",
              today: "Load testing",
              issues: "Performance degradation",
            },
          },
          {
            memberId: "member-007",
            name: "Grace",
            submittedAt: "2024-01-15T09:30:00Z",
            content: {
              yesterday: "Security audit",
              today: "Patch deployment",
              issues: "Compliance concern",
            },
          },
          {
            memberId: "member-008",
            name: "Henry",
            submittedAt: "2024-01-15T09:35:00Z",
            content: {
              yesterday: "Database migration",
              today: "Data validation",
              issues: "Schema mismatch",
            },
          },
        ],
        totalSubmitted: 8,
        totalExpected: 10,
      }),
      executeAction02: jest.fn().mockResolvedValue({
        actionId: "action-02",
        unsubmittedMembers: [
          { memberId: "member-009", name: "Iris" },
          { memberId: "member-010", name: "Jack" },
        ],
        notificationsSent: 2,
        notificationLog: [
          {
            memberId: "member-009",
            status: "sent",
            timestamp: "2024-01-15T10:00:00Z",
          },
          {
            memberId: "member-010",
            status: "sent",
            timestamp: "2024-01-15T10:00:05Z",
          },
        ],
      }),
      executeAction03: jest.fn().mockResolvedValue({
        actionId: "action-03",
        metrics: {
          totalIssueCount: 15,
          averageResolutionHours: 72,
          responseSpeedScore: 78,
          submissionRatePercentage: 80,
          completionRatePercentage: 87,
        },
      }),
      executeAction04: jest.fn().mockResolvedValue({
        actionId: "action-04",
        classifiedIssues: {
          high: [
            { keyword: "Integration delay", count: 3, severity: "high" },
            { keyword: "Build failure intermittent", count: 2, severity: "high" },
            { keyword: "Performance degradation", count: 2, severity: "high" },
            { keyword: "Compliance concern", count: 1, severity: "high" },
            { keyword: "Schema mismatch", count: 1, severity: "high" },
          ],
          medium: [
            { keyword: "Review bottleneck", count: 2, severity: "medium" },
            { keyword: "Log rotation issue", count: 1, severity: "medium" },
            { keyword: "Patch deployment challenge", count: 1, severity: "medium" },
            { keyword: "Data validation",count: 1, severity: "medium" },
            { keyword: "Monitoring setup", count: 1, severity: "medium" },
            { keyword: "Load testing", count: 1, severity: "medium" },
            { keyword: "Data sync", count: 1, severity: "medium" },
          ],
          low: [
            { keyword: "Config update", count: 1, severity: "low" },
            { keyword: "Training session", count: 1, severity: "low" },
            { keyword: "Documentation", count: 1, severity: "low" },
          ],
        },
        totalClassified: 15,
      }),
      executeAction05: jest.fn().mockResolvedValue({
        actionId: "action-05",
        recurrencePatterns: [
          {
            keyword: "Integration delay",
            occurrenceCount: 3,
            daysSinceLastOccurrence: 2,
            frequency: "recurring",
          },
          {
            keyword: "Build failure",
            occurrenceCount: 4,
            daysSinceLastOccurrence: 1,
            frequency: "recurring",
          },
          {
            keyword: "Performance issue",
            occurrenceCount: 5,
            daysSinceLastOccurrence: 3,
            frequency: "recurring",
          },
          {
            keyword: "Compliance concern",
            occurrenceCount: 2,
            daysSinceLastOccurrence: 7,
            frequency: "sporadic",
          },
        ],
        totalRecurrenceDetected: 4,
      }),
      executeAction06: jest.fn().mockResolvedValue({
        actionId: "action-06",
        proposedCountermeasures: [
          {
            measureId: "measure-001",
            title: "Report template standardization",
            priority: "high",
            estimatedImpact: 85,
            description: "Standardize issue report format across all teams",
          },
          {
            measureId: "measure-002",
            title: "Weekly tracking meeting",
            priority: "high",
            estimatedImpact: 80,
            description: "Establish weekly issue tracking and resolution review",
          },
          {
            measureId: "measure-003",
            title: "Integration test automation",
            priority: "high",
            estimatedImpact: 75,
            description: "Automate integration tests to catch delays early",
          },
          {
            measureId: "measure-004",
            title: "Build pipeline optimization",
            priority: "medium",
            estimatedImpact: 70,
            description: "Optimize CI/CD pipeline to reduce intermittent failures",
          },
          {
            measureId: "measure-005",
            title: "Performance baseline establishment",
            priority: "medium",
            estimatedImpact: 68,
            description: "Establish performance baselines and monitoring alerts",
          },
          {
            measureId: "measure-006",
            title: "Compliance audit checklist",
            priority: "medium",
            estimatedImpact: 65,
            description: "Create compliance audit checklist for regular review",
          },
        ],
        totalMeasures: 6,
      }),
      executeAction07: jest.fn().mockResolvedValue({
        actionId: "action-07",
        reportId: "report-20240115-tx9",
        reportFormat: "json",
        reportContent: {
          generatedAt: "2024-01-15T10:30:00Z",
          aggregationPeriod: {
            startDate: "2024-01-08",
            endDate: "2024-01-15",
          },
          aggregatedDataCount: 8,
          productivityMetrics: {
            totalIssueCount: 15,
            averageResolutionHours: 72,
            responseSpeedScore: 78,
            submissionRatePercentage: 80,
            completionRatePercentage: 87,
          },
          priorityClassification: {
            highCount: 5,
            mediumCount: 7,
            lowCount: 3,
          },
          recurrencePatterns: {
            totalDetected: 4,
            recurringCount: 3,
            sporadicCount: 1,
          },
          proposedMeasures: {
            total: 6,
            highPriority: 3,
            mediumPriority: 3,
          },
        },
        emailQueueId: "email-queue-20240115-001",
        dashboardDisplayStatus: "ready",
      }),
    };

    // Setup: スタブ NotificationServiceAdapter
    const mockNotificationService = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: "sent",
        deliveryTimestamp: "2024-01-15T10:00:00Z",
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: "schedule-001",
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: "delivered",
      }),
    };

    // Setup: スタブ TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "Integration delay", frequency: 3 },
          { keyword: "Build failure", frequency: 2 },
          { keyword: "Review bottleneck", frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        score: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: "high",
        confidence: 0.92,
      }),
    };

    // Setup: テスト入力パラメータ
    const aggregationRequest = {
      aggregationStartDate: "2024-01-08",
      aggregationEndDate: "2024-01-15",
      targetTeamIds: [],
      requestedByUserId: "manager-001",
    };

    // Execute: runTx9Imp1Agent を実行
    const result = await runTx9Imp1Agent(aggregationRequest, mockAiClient);

    // Assertion: Action 1 が実行されたことを確認
    expect(mockAiClient.executeAction01).toHaveBeenCalled();
    const action01Call = mockAiClient.executeAction01.mock.results[0];
    expect(action01Call.value).resolves.toBeDefined();

    // Assertion: 集約データが 8 件（80%提出率）であることを確認
    const action01Result = await action01Call.value;
    expect(action01Result.totalSubmitted).toBe(8);
    expect(action01Result.totalExpected).toBe(10);

    // Assertion: Action 2 が実行されたことを確認
    expect(mockAiClient.executeAction02).toHaveBeenCalled();
    const action02Call = mockAiClient.executeAction02.mock.results[0];
    expect(action02Call.value).resolves.toBeDefined();

    // Assertion: 未提出者が 2 名であることを確認
    const action02Result = await action02Call.value;
    expect(action02Result.unsubmittedMembers.length).toBe(2);
    expect(action02Result.notificationsSent).toBe(2);

    // Assertion: Action 3 が実行されたことを確認
    expect(mockAiClient.executeAction03).toHaveBeenCalled();
    const action03Call = mockAiClient.executeAction03.mock.results[0];
    expect(action03Call.value).resolves.toBeDefined();

    // Assertion: 定量化指標が正確に算出されたことを確認
    const action03Result = await action03Call.value;
    expect(action03Result.metrics.totalIssueCount).toBe(15);
    expect(action03Result.metrics.averageResolutionHours).toBe(72);
    expect(action03Result.metrics.responseSpeedScore).toBe(78);
    expect(action03Result.metrics.submissionRatePercentage).toBe(80);
    expect(action03Result.metrics.completionRatePercentage).toBe(87);

    // Assertion: Action 4 が実行されたことを確認
    expect(mockAiClient.executeAction04).toHaveBeenCalled();
    const action04Call = mockAiClient.executeAction04.mock.results[0];
    expect(action04Call.value).resolves.toBeDefined();

    // Assertion: 優先度別分類が実行されたことを確認（高5件、中7件、低3件）
    const action04Result = await action04Call.value;
    expect(action04Result.classifiedIssues.high.length).toBe(5);
    expect(action04Result.classifiedIssues.medium.length).toBe(7);
    expect(action04Result.classifiedIssues.low.length).toBe(3);
    expect(action04Result.totalClassified).toBe(15);

    // Assertion: Action 5 が実行されたことを確認
    expect(mockAiClient.executeAction05).toHaveBeenCalled();
    const action05Call = mockAiClient.executeAction05.mock.results[0];
    expect(action05Call.value).resolves.toBeDefined();

    // Assertion: 再発パターンが検出されたことを確認（4件以上）
    const action05Result = await action05Call.value;
    expect(action05Result.totalRecurrenceDetected).toBeGreaterThanOrEqual(4);
    expect(action05Result.recurrencePatterns.length).toBeGreaterThanOrEqual(4);

    // Assertion: Action 6 が実行されたことを確認
    expect(mockAiClient.executeAction06).toHaveBeenCalled();
    const action06Call = mockAiClient.executeAction06.mock.results[0];
    expect(action06Call.value).resolves.toBeDefined();

    // Assertion: 改善施策が 5 件以上生成されたことを確認
    const action06Result = await action06Call.value;
    expect(action06Result.proposedCountermeasures.length).toBeGreaterThanOrEqual(5);
    expect(action06Result.totalMeasures).toBe(6);

    // Assertion: Action 7 が実行されたことを確認
    expect(mockAiClient.executeAction07).toHaveBeenCalled();
    const action07Call = mockAiClient.executeAction07.mock.results[0];
    expect(action07Call.value).resolves.toBeDefined();

    // Assertion: 報告書が生成されたことを確認
    const action07Result = await action07Call.value;
    expect(action07Result.reportId).toBe("report-20240115-tx9");
    expect(action07Result.reportFormat).toBe("json");
    expect(action07Result.dashboardDisplayStatus).toBe("ready");

    // Assertion: 報告書内容が必須項目を含むことを確認
    expect(action07Result.reportContent.aggregatedDataCount).toBeGreaterThanOrEqual(8);
    expect(action07Result.reportContent.productivityMetrics).toBeDefined();
    expect(Object.keys(action07Result.reportContent.productivityMetrics).length).toBeGreaterThanOrEqual(3);
    expect(action07Result.reportContent.priorityClassification).toBeDefined();
    expect(action07Result.reportContent.recurrencePatterns.totalDetected).toBeGreaterThanOrEqual(3);
    expect(action07Result.reportContent.proposedMeasures.total).toBeGreaterThanOrEqual(5);

    // Assertion: 最終結果が正常完了状態であることを確認
    expect(result.status).toBe("COMPLETED");
    expect(result.escalationOccurred).toBe(false);
    expect(result.finalReportId).toBe("report-20240115-tx9");

    // Assertion: 全アクションが順序正しく実行されたことを確認
    expect(mockAiClient.executeAction01).toHaveBeenCalledBefore(
      mockAiClient.executeAction02 as jest.Mock
    );
    expect(mockAiClient.executeAction02).toHaveBeenCalledBefore(
      mockAiClient.executeAction03 as jest.Mock
    );
    expect(mockAiClient.executeAction03).toHaveBeenCalledBefore(
      mockAiClient.executeAction04 as jest.Mock
    );
    expect(mockAiClient.executeAction04).toHaveBeenCalledBefore(
      mockAiClient.executeAction05 as jest.Mock
    );
    expect(mockAiClient.executeAction05).toHaveBeenCalledBefore(
      mockAiClient.executeAction06 as jest.Mock
    );
    expect(mockAiClient.executeAction06).toHaveBeenCalledBefore(
      mockAiClient.executeAction07 as jest.Mock
    );

    // Assertion: エージェント実行ログが記録されたことを確認
    expect(result.executionLog).toBeDefined();
    expect(result.executionLog.length).toBeGreaterThan(0);
    expect(result.executionLog.some((log) => log.includes("COMPLETED"))).toBe(true);
  });
});