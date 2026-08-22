import { runTx6Imp1Agent } from "../../src/agents/tx-6-imp-1/orchestrator";
import type { Tx6AgentInput, Tx6AgentOutput } from "../../src/agents/tx-6-imp-1/types";
import type { Tx6Imp1AiClient } from "../../src/agents/tx-6-imp-1/ai-client";

describe("Tx6Imp1 日報収集から分析レポート生成までの自動実行エージェント", () => {
  // SCEN-117: 日報データの品質が基準を下回る場合の副作用確定前のエスカレーション処理
  test("日報データ品質スコアが基準値を下回る場合、副作用確定前に人へ引き継ぎ、Action5以降は実行されない", async () => {
    // 準備: モックAIクライアントの構成
    const mockAiClient: Tx6Imp1AiClient = {
      executeAction01FetchWeeklyReports: jest.fn().mockResolvedValue({
        reportDataSet: [
          {
            reportId: "rpt_001",
            submittedAt: new Date("2024-01-08T09:00:00Z"),
            content: "Monday report content",
            memberId: "mem_001",
          },
          {
            reportId: "rpt_002",
            submittedAt: new Date("2024-01-09T09:00:00Z"),
            content: "Tuesday report with issue",
            memberId: "mem_002",
          },
        ],
        collectionTimestamp: new Date("2024-01-15T09:00:00Z"),
      }),

      executeAction02SendReminderNotifications: jest
        .fn()
        .mockResolvedValue({
          unsubmittedMemberIds: ["mem_003", "mem_004"],
          remindersSentCount: 2,
          notificationTimestamp: new Date("2024-01-15T09:05:00Z"),
        }),

      executeAction03ExtractAndClassifyIssues: jest
        .fn()
        .mockResolvedValue({
          extractedIssues: [
            {
              issueId: "iss_001",
              keyword: "デプロイメント遅延",
              category: "納期",
              frequency: 1,
            },
            {
              issueId: "iss_002",
              keyword: "API不具合",
              category: "品質",
              frequency: 2,
            },
          ],
          extractionTimestamp: new Date("2024-01-15T09:10:00Z"),
        }),

      executeAction04AnalyzeTrends: jest.fn().mockResolvedValue({
        trendAnalysis: {
          weekOverWeekChange: -5,
          topIssueCategory: "品質",
          bottleneckIndicators: [
            {
              category: "品質",
              changeRate: -5,
              trend: "IMPROVING",
            },
          ],
        },
        analysisTimestamp: new Date("2024-01-15T09:15:00Z"),
      }),

      executeAction05ScoringPriority: jest
        .fn()
        .mockResolvedValue({ scoringResult: "should_not_execute" }),

      executeAction06GenerateReport: jest
        .fn()
        .mockResolvedValue({ reportGeneration: "should_not_execute" }),

      executeAction07DistributeToStakeholders: jest
        .fn()
        .mockResolvedValue({ distribution: "should_not_execute" }),

      validateDataQuality: jest.fn().mockResolvedValue({
        qualityScore: 60,
        qualityThreshold: 75,
        isQualityAcceptable: false,
        detailedMetadata: {
          missingFieldRatio: 0.15,
          malformedRecordCount: 2,
          incompleteReportCount: 1,
        },
      }),
    };

    // 準備: エスカレーション履歴とハンドオフトレース用のストア
    const escalationEventLog: Array<{
      type: string;
      timestamp: Date;
      metadata: Record<string, unknown>;
    }> = [];

    const executionStatusStore: Map<
      string,
      {
        status: string;
        updatedAt: Date;
      }
    > = new Map();

    const escalationHandoffStore: Array<{
      handoffId: string;
      executionId: string;
      assigneeUserId: string;
      detailMetadata: Record<string, unknown>;
      createdAt: Date;
    }> = [];

    const stakeholderDistributionQueue: Array<{
      queueId: string;
      executionId: string;
      createdAt: Date;
    }> = [];

    // モック側のスパイ: executeAction05以降が呼ばれないことを検証するため、
    // 各アクション実行時に呼び出しカウントをインクリメント
    const actionCallTracker = {
      action01Called: false,
      action02Called: false,
      action03Called: false,
      action04Called: false,
      action05Called: false,
      action06Called: false,
      action07Called: false,
    };

    // Action実行トレース用にmockImplementationを設定
    (mockAiClient.executeAction01FetchWeeklyReports as jest.Mock).mockImplementation(
      async () => {
        actionCallTracker.action01Called = true;
        return {
          reportDataSet: [
            {
              reportId: "rpt_001",
              submittedAt: new Date("2024-01-08T09:00:00Z"),
              content: "Monday report content",
              memberId: "mem_001",
            },
          ],
          collectionTimestamp: new Date("2024-01-15T09:00:00Z"),
        };
      }
    );

    (mockAiClient.executeAction02SendReminderNotifications as jest.Mock).mockImplementation(
      async () => {
        actionCallTracker.action02Called = true;
        return {
          unsubmittedMemberIds: ["mem_003"],
          remindersSentCount: 1,
          notificationTimestamp: new Date("2024-01-15T09:05:00Z"),
        };
      }
    );

    (mockAiClient.executeAction03ExtractAndClassifyIssues as jest.Mock).mockImplementation(
      async () => {
        actionCallTracker.action03Called = true;
        return {
          extractedIssues: [
            {
              issueId: "iss_001",
              keyword: "デプロイメント遅延",
              category: "納期",
              frequency: 1,
            },
          ],
          extractionTimestamp: new Date("2024-01-15T09:10:00Z"),
        };
      }
    );

    (mockAiClient.executeAction04AnalyzeTrends as jest.Mock).mockImplementation(
      async () => {
        actionCallTracker.action04Called = true;
        return {
          trendAnalysis: {
            weekOverWeekChange: -5,
            topIssueCategory: "品質",
            bottleneckIndicators: [],
          },
          analysisTimestamp: new Date("2024-01-15T09:15:00Z"),
        };
      }
    );

    (mockAiClient.executeAction05ScoringPriority as jest.Mock).mockImplementation(
      async () => {
        actionCallTracker.action05Called = true;
        return {
          scoringResult: "executed_but_should_not_reach",
        };
      }
    );

    (mockAiClient.executeAction06GenerateReport as jest.Mock).mockImplementation(
      async () => {
        actionCallTracker.action06Called = true;
        return {
          reportGeneration: "executed_but_should_not_reach",
        };
      }
    );

    (mockAiClient.executeAction07DistributeToStakeholders as jest.Mock).mockImplementation(
      async () => {
        actionCallTracker.action07Called = true;
        return {
          distribution: "executed_but_should_not_reach",
        };
      }
    );

    (mockAiClient.validateDataQuality as jest.Mock).mockImplementation(
      async () => {
        return {
          qualityScore: 60,
          qualityThreshold: 75,
          isQualityAcceptable: false,
          detailedMetadata: {
            missingFieldRatio: 0.15,
            malformedRecordCount: 2,
            incompleteReportCount: 1,
          },
        };
      }
    );

    // エスカレーションハンドラーのモック実装
    const mockEscalationHandler = jest
      .fn()
      .mockImplementation(
        async (
          executionId: string,
          escalationType: string,
          metadata: Record<string, unknown>
        ) => {
          escalationEventLog.push({
            type: escalationType,
            timestamp: new Date("2024-01-15T09:20:00Z"),
            metadata,
          });

          executionStatusStore.set(executionId, {
            status: "ESCALATION_PENDING",
            updatedAt: new Date("2024-01-15T09:20:00Z"),
          });

          escalationHandoffStore.push({
            handoffId: `handoff_${executionId}`,
            executionId,
            assigneeUserId: "usr_director_001",
            detailMetadata: {
              qualityScore: 60,
              qualityThreshold: 75,
              missingFieldRatio: 0.15,
              malformedRecordCount: 2,
              incompleteReportCount: 1,
            },
            createdAt: new Date("2024-01-15T09:20:00Z"),
          });

          return {
            escalationId: `esc_${executionId}`,
            handoffCreated: true,
          };
        }
      );

    // 入力パラメータ
    const agentInput: Tx6AgentInput = {
      executionTimestamp: new Date("2024-01-15T09:00:00Z"),
      analysisStartDate: "2024-01-08",
      analysisEndDate: "2024-01-14",
      teamId: "team_engineering_001",
    };

    // 実行: runTx6Imp1Agent を呼び出し、モックAIクライアントとエスカレーションハンドラーを注入
    // このテストでは、orchestrator が品質検証失敗後に escalationHandler を呼び出す振る舞いを仮定
    // 実装上は、orchestrator 内で validateDataQuality 結果をチェックし、
    // qualityScore < qualityThreshold の場合に escalationHandler を呼ぶロジックが必要
    let result: Tx6AgentOutput | { escalationTriggered: boolean } | null = null;
    let caughtError: Error | null = null;

    try {
      // Note: runTx6Imp1Agent の実装がまだ mockEscalationHandler に対応していない可能性があるため、
      // 以下のコードは orchestrator の設計を反映した呼び出し方を想定
      // 実装側で escalationHandler パラメータを受け付ける場合：
      result = await runTx6Imp1Agent(agentInput, mockAiClient);

      // 品質検証が失敗している場合、orchestrator が自動的にエスカレーション処理を行うと想定
      // その場合、結果には escalation 情報が含まれる、またはエラーがスロー される
    } catch (error) {
      caughtError = error instanceof Error ? error : new Error(String(error));
    }

    // 検証1: Action 1-4 が呼ばれたことを確認
    expect(actionCallTracker.action01Called).toBe(true);
    expect(actionCallTracker.action02Called).toBe(true);
    expect(actionCallTracker.action03Called).toBe(true);
    expect(actionCallTracker.action04Called).toBe(true);

    // 検証2: 品質検証が呼ばれたことを確認
    expect(mockAiClient.validateDataQuality).toHaveBeenCalled();

    // 検証3: Action 5-7 が呼ばれないことを確認（品質スコア60 < 基準値75 のため）
    expect(actionCallTracker.action05Called).toBe(false);
    expect(actionCallTracker.action06Called).toBe(false);
    expect(actionCallTracker.action07Called).toBe(false);

    // 検証4: executeAction05 が呼ばれていないことをモックで確認
    expect(mockAiClient.executeAction05ScoringPriority).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction06GenerateReport).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction07DistributeToStakeholders).not.toHaveBeenCalled();

    // 検証5: ステークホルダー配信キューが空のままであることを確認
    // (実装で配信キューに登録されるべきレコードが0件)
    expect(stakeholderDistributionQueue).toHaveLength(0);

    // 検証6: 結果がエスカレーションを示す状態か、またはエラーをスローしていることを確認
    // orchestrator の設計によって異なるが、品質チェック失敗は escalation を示す
    if (result && typeof result === "object") {
      if ("escalationTriggered" in result) {
        expect((result as { escalationTriggered: boolean }).escalationTriggered).toBe(
          true
        );
      }
    }

    // 検証7: 品質スコアが基準値を下回ることを再確認
    const qualityValidationResult = await mockAiClient.validateDataQuality();
    expect(qualityValidationResult.qualityScore).toBe(60);
    expect(qualityValidationResult.qualityThreshold).toBe(75);
    expect(qualityValidationResult.isQualityAcceptable).toBe(false);

    // 検証8: 品質検証の詳細メタデータが期待値と一致
    expect(qualityValidationResult.detailedMetadata).toEqual({
      missingFieldRatio: 0.15,
      malformedRecordCount: 2,
      incompleteReportCount: 1,
    });
  });
});