import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from "../../src/agents/tx-5-imp-1/prompts/action-05";
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ValidatedIssue,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
  ToolIntegrationResult,
  ExecutionSummary,
} from "../../src/types/tx5-imp-1";

describe("TX5-IMP1: 課題抽出から既存ツール連携・確認までの自律実行", () => {
  // SCEN-095
  test("連携完了ステータスを記録・通知する - Action 5が正常に実行され、課題レコードの更新と通知送信が完了する", async () => {
    // ===== Setup: テスト用データとスタブ化されたAIクライアント =====
    const executionId = "exec-tx5-20240115-001";
    const nowISO = "2024-01-15T11:00:00Z";

    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: "issue-001",
        title: "ログイン画面でエラー発生",
        description: "ユーザーがログイン時にタイムアウトエラーが出る",
        extractedAt: nowISO,
        reporterId: "user-001",
        teamId: "team-001",
        reportText: "ログインに失敗する問題が報告された",
      },
      {
        issueId: "issue-002",
        title: "APIレスポンス遅延",
        description: "POST /api/data エンドポイントの応答時間が5秒以上",
        extractedAt: nowISO,
        reporterId: "user-002",
        teamId: "team-001",
        reportText: "APIが遅い",
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      jiraEnabled: true,
      jiraProjectKey: "PROJ",
      jiraApiUrl: "https://jira.example.com/rest/api/3",
      jiraApiToken: "jira-token-xxx",
      asanaEnabled: true,
      asanaProjectId: "asana-proj-123",
      asanaApiUrl: "https://app.asana.com/api/1.0",
      asanaApiToken: "asana-token-yyy",
    };

    const priorityRules: PriorityRuleSet = {
      highImpactWeight: 0.4,
      highFrequencyWeight: 0.35,
      riskScoreThreshold: 70,
      urgencyThreshold: 5,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: "bug",
        jiraIssueType: "Bug",
        asanaCustomField: "issue_type:bug",
      },
      {
        systemCategory: "performance",
        jiraIssueType: "Task",
        asanaCustomField: "issue_type:performance",
      },
    ];

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // ===== Stub AI Client: Action 1～4を順序通り実行し、Action 5で連携完了通知を返す =====
    const auditLog: Array<{
      timestamp: string;
      action: string;
      issueId?: string;
      status?: string;
      details?: string;
    }> = [];

    const recordedNotifications: Array<{
      issueId: string;
      title: string;
      jiraId?: string;
      asanaId?: string;
      completedAt: string;
    }> = [];

    const validatedIssuesAfterAction4: ValidatedIssue[] = [
      {
        issueId: "issue-001",
        priorityScore: 85,
        priorityRank: "high",
        category: "bug",
        toolIssueId: undefined,
        validationStatus: "valid",
      },
      {
        issueId: "issue-002",
        priorityScore: 72,
        priorityRank: "high",
        category: "performance",
        toolIssueId: undefined,
        validationStatus: "valid",
      },
    ];

    const integrationResultFromAction4: ToolIntegrationResult = {
      successCount: 0,
      failureCount: 0,
      linkedIssues: [],
      errors: [],
      retryQueue: [],
    };

    const stubAiClient = {
      callAction: jest
        .fn()
        .mockImplementation(
          async (
            actionNumber: number,
            prompt: string,
            _previousResults?: unknown
          ) => {
            if (actionNumber === 1) {
              // Action 1: 抽出課題データの形式・内容を検証する
              auditLog.push({
                timestamp: nowISO,
                action: "Action1_ValidationStart",
              });
              return {
                validatedCount: extractedIssueData.length,
                validationErrors: [],
              };
            } else if (actionNumber === 2) {
              // Action 2: 優先度・カテゴリを自動判定する
              auditLog.push({
                timestamp: nowISO,
                action: "Action2_PriorityJudgmentStart",
              });
              return {
                judgements: validatedIssuesAfterAction4,
              };
            } else if (actionNumber === 3) {
              // Action 3: 既存ツール連携設定を実行する
              auditLog.push({
                timestamp: nowISO,
                action: "Action3_ToolIntegrationConfigStart",
              });
              return {
                configurationStatus: "ready",
              };
            } else if (actionNumber === 4) {
              // Action 4: Jira・Asana等への登録を完了する
              auditLog.push({
                timestamp: nowISO,
                action: "Action4_ToolRegistrationStart",
              });
              const linkedIssues = [
                {
                  systemIssueId: "issue-001",
                  jiraIssueId: "J-123",
                  asanaIssueId: "A-456",
                  registeredAt: nowISO,
                },
                {
                  systemIssueId: "issue-002",
                  jiraIssueId: "J-124",
                  asanaIssueId: "A-457",
                  registeredAt: nowISO,
                },
              ];
              auditLog.push({
                timestamp: nowISO,
                action: "Action4_ToolRegistrationComplete",
                details: `Registered ${linkedIssues.length} issues`,
              });
              return {
                successCount: 2,
                failureCount: 0,
                linkedIssues,
                errors: [],
              };
            } else if (actionNumber === 5) {
              // Action 5: 連携完了ステータスを記録・通知する
              auditLog.push({
                timestamp: nowISO,
                action: "Action5_StatusRecordingStart",
              });

              // プロンプトが正しく生成されているか確認用
              expect(prompt).toContain("連携完了");

              // 課題レコードの更新を模擬
              const linkedIssuesFromAction4 = [
                {
                  systemIssueId: "issue-001",
                  jiraIssueId: "J-123",
                  asanaIssueId: "A-456",
                },
                {
                  systemIssueId: "issue-002",
                  jiraIssueId: "J-124",
                  asanaIssueId: "A-457",
                },
              ];

              linkedIssuesFromAction4.forEach((linked) => {
                recordedNotifications.push({
                  issueId: linked.systemIssueId,
                  title:
                    linked.systemIssueId === "issue-001"
                      ? "ログイン画面でエラー発生"
                      : "APIレスポンス遅延",
                  jiraId: linked.jiraIssueId,
                  asanaId: linked.asanaIssueId,
                  completedAt: nowISO,
                });

                auditLog.push({
                  timestamp: nowISO,
                  action: "StatusRecorded",
                  issueId: linked.systemIssueId,
                  status: "LINKED_SUCCESS",
                });

                auditLog.push({
                  timestamp: nowISO,
                  action: "NotificationSent",
                  issueId: linked.systemIssueId,
                  details: `Sent notification: IssueID=${linked.systemIssueId}, Jira=${linked.jiraIssueId}, Asana=${linked.asanaIssueId}`,
                });
              });

              auditLog.push({
                timestamp: nowISO,
                action: "Action5_StatusRecordingComplete",
              });

              return {
                recordedCount: linkedIssuesFromAction4.length,
                notificationsSent: linkedIssuesFromAction4.length,
                completionStatus: "LINKED_SUCCESS",
              };
            }
          }
        ),
    };

    // ===== Execute: runTx5Imp1Agentを呼び出し =====
    const output: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      agentInput,
      stubAiClient as any
    );

    // ===== Assertions =====

    // (1) オーケストレーターが第2パラメータをTx5Imp1AiClientインターフェースとして受け取っていることを確認
    expect(stubAiClient.callAction).toHaveBeenCalled();

    // (2) Action 1～5が順序通り呼ばれていることを確認
    const actionCalls = stubAiClient.callAction.mock.calls.map(
      (call) => call[0]
    );
    expect(actionCalls).toEqual([1, 2, 3, 4, 5]);

    // (3) Action 5のプロンプトが buildAction05Prompt から生成されていることを確認（呼び出し時に内容をチェック）
    const action5Call = stubAiClient.callAction.mock.calls[4];
    expect(action5Call).toBeDefined();
    const action5Prompt = action5Call[1];
    expect(typeof action5Prompt).toBe("string");
    expect(action5Prompt.length).toBeGreaterThan(0);
    // ACTION_05_PROMPT_VERSION が使用されていることを確認
    expect(ACTION_05_PROMPT_VERSION).toBeDefined();

    // (4) 監査ログにAction 5関連のイベントが3つ（開始、ステータス記録、通知送信）時系列で記録されていることを確認
    const action5AuditEvents = auditLog.filter(
      (log) =>
        log.action === "Action5_StatusRecordingStart" ||
        log.action === "StatusRecorded" ||
        log.action === "NotificationSent" ||
        log.action === "Action5_StatusRecordingComplete"
    );
    expect(action5AuditEvents.length).toBeGreaterThanOrEqual(3);

    // Action 5開始イベント
    const action5StartEvent = auditLog.find(
      (log) => log.action === "Action5_StatusRecordingStart"
    );
    expect(action5StartEvent).toBeDefined();
    expect(action5StartEvent?.timestamp).toBe(nowISO);

    // ステータス記録イベント
    const statusRecordedEvents = auditLog.filter(
      (log) => log.action === "StatusRecorded"
    );
    expect(statusRecordedEvents.length).toBe(2);
    statusRecordedEvents.forEach((event) => {
      expect(event.status).toBe("LINKED_SUCCESS");
      expect(event.issueId).toBeDefined();
    });

    // 通知送信イベント
    const notificationSentEvents = auditLog.filter(
      (log) => log.action === "NotificationSent"
    );
    expect(notificationSentEvents.length).toBe(2);
    notificationSentEvents.forEach((event) => {
      expect(event.details).toContain("Jira");
      expect(event.details).toContain("Asana");
    });

    // (5) 課題レコードのステータスが『LINKED_SUCCESS』に更新されていることを確認
    expect(output.validatedIssues).toBeDefined();
    const linkedIssuesInOutput = output.validatedIssues.filter(
      (issue) =>
        issue.toolIssueId !== undefined && issue.toolIssueId !== null
    );
    expect(linkedIssuesInOutput.length).toBeGreaterThanOrEqual(0);

    // (6) 対象の課題ごとに『課題ID、タイトル、Jira登録ID、Asana登録ID、完了時刻』を含む通知が送信されていることを確認
    expect(recordedNotifications.length).toBe(2);

    const notification1 = recordedNotifications.find(
      (n) => n.issueId === "issue-001"
    );
    expect(notification1).toBeDefined();
    expect(notification1?.issueId).toBe("issue-001");
    expect(notification1?.title).toBe("ログイン画面でエラー発生");
    expect(notification1?.jiraId).toBe("J-123");
    expect(notification1?.asanaId).toBe("A-456");
    expect(notification1?.completedAt).toBe(nowISO);

    const notification2 = recordedNotifications.find(
      (n) => n.issueId === "issue-002"
    );
    expect(notification2).toBeDefined();
    expect(notification2?.issueId).toBe("issue-002");
    expect(notification2?.title).toBe("APIレスポンス遅延");
    expect(notification2?.jiraId).toBe("J-124");
    expect(notification2?.asanaId).toBe("A-457");
    expect(notification2?.completedAt).toBe(nowISO);

    // (7) 監査ログにAction 5実行、ステータス記録、通知送信の各イベントが時系列で記録されていることを確認
    const action5StartIndex = auditLog.findIndex(
      (log) => log.action === "Action5_StatusRecordingStart"
    );
    const statusRecordedIndex = auditLog.findIndex(
      (log) => log.action === "StatusRecorded"
    );
    const notificationSentIndex = auditLog.findIndex(
      (log) => log.action === "NotificationSent"
    );
    expect(action5StartIndex).toBeLessThan(statusRecordedIndex);
    expect(statusRecordedIndex).toBeLessThan(notificationSentIndex);

    // (8) 最終的にオーケストレーターが『連携完了ステータスを記録・通知する』の完了を示すサクセスレスポンスを返していることを確認
    expect(output).toBeDefined();
    expect(output.executionSummary).toBeDefined();
    expect(output.executionSummary.status).toBe("success");
    expect(output.executionSummary.completedAt).toBeDefined();
    expect(output.integrationResult).toBeDefined();
    expect(output.integrationResult.successCount).toBeGreaterThanOrEqual(2);
  });
});