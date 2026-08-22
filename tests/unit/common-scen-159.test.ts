import { runTx9Imp1Agent, type Tx9Imp1AiClient } from "../../src/agents/tx-9-imp-1/orchestrator";

describe("tx-9-imp-1: 日報集約から分析報告までの自動実行エージェント", () => {
  // SCEN-159
  test("通常案件を人の都度承認なしで最後まで完了する", async () => {
    const aggregationStartDate = "2024-01-01";
    const aggregationEndDate = "2024-01-31";
    const targetTeamIds = ["team-001", "team-002"];
    const requestedByUserId = "user-director-001";

    const mockAiClient: Tx9Imp1AiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        aggregatedReports: [
          {
            reportId: "report-001",
            userId: "user-001",
            teamId: "team-001",
            reportDate: "2024-01-15",
            issues: [
              {
                issueId: "issue-001",
                title: "テスト環境の構築遅延",
                description: "CI/CDパイプライン設定に問題",
                reportedDate: "2024-01-15",
              },
            ],
            achievements: ["API仕様確定"],
            plannedWork: ["要件定義完了"],
          },
          {
            reportId: "report-002",
            userId: "user-002",
            teamId: "team-001",
            reportDate: "2024-01-15",
            issues: [
              {
                issueId: "issue-002",
                title: "データベース接続タイムアウト",
                description: "本番環境でコネクション数制限に達した",
                reportedDate: "2024-01-15",
              },
            ],
            achievements: ["パフォーマンステスト完了"],
            plannedWork: ["チューニング開始"],
          },
        ],
        totalReportsCollected: 2,
      }),

      executeAction02: jest.fn().mockResolvedValue({
        unsubmittedMembers: [
          {
            userId: "user-003",
            userName: "田中太郎",
            teamId: "team-002",
            lastSubmitDate: "2024-01-14",
          },
        ],
        reminderNotificationsSent: 1,
      }),

      executeAction03: jest.fn().mockResolvedValue({
        productivityMetrics: {
          issueCounts: 12,
          averageResolutionDays: 3.5,
          responseSpeedScore: 85,
        },
      }),

      executeAction04: jest.fn().mockResolvedValue({
        prioritizedIssuesByCategory: [
          {
            priority: "HIGH",
            issues: [
              {
                issueId: "issue-002",
                title: "データベース接続タイムアウト",
                category: "infrastructure",
                impactScope: "production",
              },
            ],
            issueCounts: 1,
          },
          {
            priority: "MEDIUM",
            issues: [
              {
                issueId: "issue-001",
                title: "テスト環境の構築遅延",
                category: "testing",
                impactScope: "development",
              },
            ],
            issueCounts: 1,
          },
        ],
      }),

      executeAction05: jest.fn().mockResolvedValue({
        recurrencePatterns: [
          {
            patternId: "pattern-001",
            issueTitle: "データベース接続タイムアウト",
            occurrenceCount: 3,
            lastOccurrenceDate: "2024-01-15",
            riskLevel: "high",
          },
        ],
        totalPatternsDetected: 1,
      }),

      executeAction06: jest.fn().mockResolvedValue({
        countermeasures: [
          {
            countermeasureId: "measure-001",
            title: "データベース接続プール最適化",
            priority: "HIGH",
            expectedEffect: "接続タイムアウト発生頻度を90%削減",
            implementationDifficulty: "medium",
            targetIssueIds: ["issue-002"],
          },
          {
            countermeasureId: "measure-002",
            title: "CI/CDパイプライン自動テスト強化",
            priority: "MEDIUM",
            expectedEffect: "テスト環境構築エラーの早期発見",
            implementationDifficulty: "low",
            targetIssueIds: ["issue-001"],
          },
        ],
        totalMeasures: 2,
      }),

      executeAction07: jest.fn().mockResolvedValue({
        reportId: "analysis-report-001",
        aggregationPeriod: {
          startDate: aggregationStartDate,
          endDate: aggregationEndDate,
        },
        productivityMetrics: {
          issueResolutionSpeed: 3.5,
          reportSubmissionRate: 92.5,
          issueRecurrenceRate: 15.8,
        },
        prioritizedIssues: [
          {
            issueId: "issue-002",
            title: "データベース接続タイムアウト",
            priority: "HIGH",
            impactScope: "production",
            category: "infrastructure",
          },
          {
            issueId: "issue-001",
            title: "テスト環境の構築遅延",
            priority: "MEDIUM",
            impactScope: "development",
            category: "testing",
          },
        ],
        recommendedCountermeasures: [
          {
            countermeasureId: "measure-001",
            title: "データベース接続プール最適化",
            priority: "HIGH",
            expectedEffect: "接続タイムアウト発生頻度を90%削減",
            implementationDifficulty: "medium",
          },
          {
            countermeasureId: "measure-002",
            title: "CI/CDパイプライン自動テスト強化",
            priority: "MEDIUM",
            expectedEffect: "テスト環境構築エラーの早期発見",
            implementationDifficulty: "low",
          },
        ],
        generatedAt: "2024-02-01T10:00:00Z",
      }),
    };

    const result = await runTx9Imp1Agent(
      {
        aggregationStartDate,
        aggregationEndDate,
        targetTeamIds,
        requestedByUserId,
      },
      mockAiClient
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBe("analysis-report-001");
    expect(result.aggregationPeriod.startDate).toBe(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toBe(aggregationEndDate);

    expect(result.productivityMetrics).toBeDefined();
    expect(result.productivityMetrics.issueResolutionSpeed).toBe(3.5);
    expect(result.productivityMetrics.reportSubmissionRate).toBe(92.5);
    expect(result.productivityMetrics.issueRecurrenceRate).toBe(15.8);

    expect(result.prioritizedIssues).toHaveLength(2);
    expect(result.prioritizedIssues[0].priority).toBe("HIGH");
    expect(result.prioritizedIssues[0].issueId).toBe("issue-002");
    expect(result.prioritizedIssues[1].priority).toBe("MEDIUM");
    expect(result.prioritizedIssues[1].issueId).toBe("issue-001");

    expect(result.recommendedCountermeasures).toHaveLength(2);
    expect(result.recommendedCountermeasures[0].priority).toBe("HIGH");
    expect(result.recommendedCountermeasures[0].countermeasureId).toBe(
      "measure-001"
    );
    expect(result.recommendedCountermeasures[1].priority).toBe("MEDIUM");
    expect(result.recommendedCountermeasures[1].countermeasureId).toBe(
      "measure-002"
    );

    expect(result.generatedAt).toBe("2024-02-01T10:00:00Z");

    expect(mockAiClient.executeAction01).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction02).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction03).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction04).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction05).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction06).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction07).toHaveBeenCalledTimes(1);

    const action01Call = (mockAiClient.executeAction01 as jest.Mock).mock
      .calls[0][0];
    expect(action01Call).toBeDefined();
    expect(action01Call.aggregationStartDate).toBe(aggregationStartDate);
    expect(action01Call.aggregationEndDate).toBe(aggregationEndDate);

    const action02Call = (mockAiClient.executeAction02 as jest.Mock).mock
      .calls[0][0];
    expect(action02Call).toBeDefined();

    const action03Call = (mockAiClient.executeAction03 as jest.Mock).mock
      .calls[0][0];
    expect(action03Call).toBeDefined();

    const action04Call = (mockAiClient.executeAction04 as jest.Mock).mock
      .calls[0][0];
    expect(action04Call).toBeDefined();

    const action05Call = (mockAiClient.executeAction05 as jest.Mock).mock
      .calls[0][0];
    expect(action05Call).toBeDefined();

    const action06Call = (mockAiClient.executeAction06 as jest.Mock).mock
      .calls[0][0];
    expect(action06Call).toBeDefined();

    const action07Call = (mockAiClient.executeAction07 as jest.Mock).mock
      .calls[0][0];
    expect(action07Call).toBeDefined();
  });
});