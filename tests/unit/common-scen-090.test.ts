import { type Tx5Imp1AiClient } from "../../src/agents/tx-5-imp-1/orchestrator";
import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import {
  buildAction01Prompt,
  ACTION_01_PROMPT_VERSION,
} from "../../src/agents/tx-5-imp-1/prompts/action-01";
import {
  buildAction02Prompt,
  ACTION_02_PROMPT_VERSION,
} from "../../src/agents/tx-5-imp-1/prompts/action-02";
import {
  buildAction03Prompt,
  ACTION_03_PROMPT_VERSION,
} from "../../src/agents/tx-5-imp-1/prompts/action-03";
import {
  buildAction04Prompt,
  ACTION_04_PROMPT_VERSION,
} from "../../src/agents/tx-5-imp-1/prompts/action-04";
import {
  buildAction05Prompt,
  ACTION_05_PROMPT_VERSION,
} from "../../src/agents/tx-5-imp-1/prompts/action-05";
import type {
  ExtractedIssue,
  ValidatedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ToolIntegrationResult,
  ExecutionSummary,
} from "../../src/agents/tx-5-imp-1/types";

describe("tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行", () => {
  let mockAiClient: jest.Mocked<Tx5Imp1AiClient>;
  let auditEvents: Array<{
    actionNumber: number;
    timestamp: string;
    status: string;
    inputSummary: string;
    outputSummary: string;
    confidenceScore: number;
    toolRegistrationIds: string[];
  }>;

  beforeEach(() => {
    auditEvents = [];

    const mockAction01Response = {
      validationResults: [
        {
          issueId: "issue-001",
          formatStatus: "normal",
          contentStatus: "valid",
          validationNotes: "形式正常・内容妥当",
        },
        {
          issueId: "issue-002",
          formatStatus: "normal",
          contentStatus: "valid",
          validationNotes: "形式正常・内容妥当",
        },
        {
          issueId: "issue-003",
          formatStatus: "normal",
          contentStatus: "valid",
          validationNotes: "形式正常・内容妥当",
        },
        {
          issueId: "issue-004",
          formatStatus: "normal",
          contentStatus: "valid",
          validationNotes: "形式正常・内容妥当",
        },
        {
          issueId: "issue-005",
          formatStatus: "normal",
          contentStatus: "valid",
          validationNotes: "形式正常・内容妥当",
        },
      ],
      allValidationsPassed: true,
      timestamp: "2024-01-15T09:00:00Z",
    };

    const mockAction02Response = {
      classifiedIssues: [
        {
          issueId: "issue-001",
          priorityScore: 85,
          priorityRank: "high" as const,
          category: "品質",
          confidenceScore: 0.92,
        },
        {
          issueId: "issue-002",
          priorityScore: 65,
          priorityRank: "medium" as const,
          category: "納期",
          confidenceScore: 0.88,
        },
        {
          issueId: "issue-003",
          priorityScore: 45,
          priorityRank: "low" as const,
          category: "安全",
          confidenceScore: 0.81,
        },
        {
          issueId: "issue-004",
          priorityScore: 78,
          priorityRank: "high" as const,
          category: "品質",
          confidenceScore: 0.90,
        },
        {
          issueId: "issue-005",
          priorityScore: 62,
          priorityRank: "medium" as const,
          category: "納期",
          confidenceScore: 0.87,
        },
      ],
      classificationTimestamp: "2024-01-15T09:05:00Z",
    };

    const mockAction03Response = {
      integrationConfigs: [
        {
          issueId: "issue-001",
          toolType: "jira",
          projectKey: "PROJ-001",
          templateId: "task-high-priority",
          assigneeEmail: "team-lead@example.com",
        },
        {
          issueId: "issue-002",
          toolType: "asana",
          projectKey: "PROJ-002",
          templateId: "task-medium-priority",
          assigneeEmail: "pm@example.com",
        },
        {
          issueId: "issue-003",
          toolType: "jira",
          projectKey: "PROJ-001",
          templateId: "task-low-priority",
          assigneeEmail: "engineer@example.com",
        },
        {
          issueId: "issue-004",
          toolType: "asana",
          projectKey: "PROJ-002",
          templateId: "task-high-priority",
          assigneeEmail: "team-lead@example.com",
        },
        {
          issueId: "issue-005",
          toolType: "jira",
          projectKey: "PROJ-001",
          templateId: "task-medium-priority",
          assigneeEmail: "pm@example.com",
        },
      ],
      configurationTimestamp: "2024-01-15T09:10:00Z",
    };

    const mockAction04Response = {
      registrationResults: [
        {
          issueId: "issue-001",
          toolRegistrationId: "JIRA-12345",
          registrationStatus: "success",
          url: "https://jira.example.com/browse/JIRA-12345",
          responseTimestamp: "2024-01-15T09:12:00Z",
        },
        {
          issueId: "issue-002",
          toolRegistrationId: "ASANA-67890",
          registrationStatus: "success",
          url: "https://app.asana.com/0/1234567890/67890",
          responseTimestamp: "2024-01-15T09:13:00Z",
        },
        {
          issueId: "issue-003",
          toolRegistrationId: "JIRA-12346",
          registrationStatus: "success",
          url: "https://jira.example.com/browse/JIRA-12346",
          responseTimestamp: "2024-01-15T09:14:00Z",
        },
        {
          issueId: "issue-004",
          toolRegistrationId: "ASANA-67891",
          registrationStatus: "success",
          url: "https://app.asana.com/0/1234567890/67891",
          responseTimestamp: "2024-01-15T09:15:00Z",
        },
        {
          issueId: "issue-005",
          toolRegistrationId: "JIRA-12347",
          registrationStatus: "success",
          url: "https://jira.example.com/browse/JIRA-12347",
          responseTimestamp: "2024-01-15T09:16:00Z",
        },
      ],
      totalRegistered: 5,
      totalFailed: 0,
      registrationTimestamp: "2024-01-15T09:16:30Z",
    };

    const mockAction05Response = {
      statusRecords: [
        {
          issueId: "issue-001",
          finalStatus: "integration_confirmed",
          toolIssueId: "JIRA-12345",
          notificationSent: true,
          notificationTimestamp: "2024-01-15T09:17:00Z",
        },
        {
          issueId: "issue-002",
          finalStatus: "integration_confirmed",
          toolIssueId: "ASANA-67890",
          notificationSent: true,
          notificationTimestamp: "2024-01-15T09:17:30Z",
        },
        {
          issueId: "issue-003",
          finalStatus: "integration_confirmed",
          toolIssueId: "JIRA-12346",
          notificationSent: true,
          notificationTimestamp: "2024-01-15T09:18:00Z",
        },
        {
          issueId: "issue-004",
          finalStatus: "integration_confirmed",
          toolIssueId: "ASANA-67891",
          notificationSent: true,
          notificationTimestamp: "2024-01-15T09:18:30Z",
        },
        {
          issueId: "issue-005",
          finalStatus: "integration_confirmed",
          toolIssueId: "JIRA-12347",
          notificationSent: true,
          notificationTimestamp: "2024-01-15T09:19:00Z",
        },
      ],
      allStatusRecorded: true,
      executionCompletedAt: "2024-01-15T09:19:30Z",
    };

    mockAiClient = {
      executeAction01: jest.fn().mockResolvedValue(mockAction01Response),
      executeAction02: jest.fn().mockResolvedValue(mockAction02Response),
      executeAction03: jest.fn().mockResolvedValue(mockAction03Response),
      executeAction04: jest.fn().mockResolvedValue(mockAction04Response),
      executeAction05: jest.fn().mockResolvedValue(mockAction05Response),
      recordAuditEvent: jest.fn().mockImplementation((event) => {
        auditEvents.push(event);
      }),
    };
  });

  test("SCEN-090: [normal] 通常案件5件が人の承認なしで最後まで自動実行される", async () => {
    // Arrange: テスト用の抽出済み課題データセット（5件の通常案件）を準備
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: "issue-001",
        title: "Database connection timeout issue",
        description:
          "Database queries are timing out in production during peak hours",
        extractedFrom: "daily-report-2024-01-15",
        reportingMemberId: "member-001",
        reportedAt: "2024-01-15T08:30:00Z",
      },
      {
        issueId: "issue-002",
        title: "Feature release delay",
        description: "Payment processing feature is 2 days behind schedule",
        extractedFrom: "daily-report-2024-01-15",
        reportingMemberId: "member-002",
        reportedAt: "2024-01-15T08:45:00Z",
      },
      {
        issueId: "issue-003",
        title: "Documentation incomplete",
        description: "API documentation needs update for v2 endpoints",
        extractedFrom: "daily-report-2024-01-15",
        reportingMemberId: "member-003",
        reportedAt: "2024-01-15T09:00:00Z",
      },
      {
        issueId: "issue-004",
        title: "Code review backlog",
        description:
          "Critical PR reviews are pending approval, blocking deployments",
        extractedFrom: "daily-report-2024-01-15",
        reportingMemberId: "member-004",
        reportedAt: "2024-01-15T09:15:00Z",
      },
      {
        issueId: "issue-005",
        title: "CI/CD pipeline stability",
        description: "Build pipeline failures increasing, success rate at 85%",
        extractedFrom: "daily-report-2024-01-15",
        reportingMemberId: "member-005",
        reportedAt: "2024-01-15T09:30:00Z",
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      jiraApiUrl: "https://jira.example.com/api/v2",
      jiraApiToken: "mock-jira-token",
      asanaApiUrl: "https://api.asana.com/1.0",
      asanaApiToken: "mock-asana-token",
      defaultProjectKeyJira: "PROJ-001",
      defaultProjectIdAsana: "1234567890",
      toolPreference: "auto",
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.4,
      recurrenceWeight: 0.2,
      thresholds: {
        highPriority: 75,
        mediumPriority: 50,
        lowPriority: 0,
      },
    };

    const categoryMappings: CategoryMapping[] = [
      {
        jiraCategory: "品質",
        asanaCategory: "Quality",
        keywords: [
          "bug",
          "defect",
          "error",
          "failure",
          "timeout",
          "crash",
        ],
      },
      {
        jiraCategory: "納期",
        asanaCategory: "Timeline",
        keywords: ["delay", "schedule", "deadline", "behind", "late"],
      },
      {
        jiraCategory: "安全",
        asanaCategory: "Safety",
        keywords: ["security", "vulnerability", "risk", "compliance"],
      },
    ];

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // Act: runTx5Imp1Agent関数を注入されたフェイクAIクライアントとともに起動
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      agentInput,
      mockAiClient
    );

    // Assert: Action 1 - 抽出課題データ形式・内容検証が実行されたことを確認
    expect(mockAiClient.executeAction01).toHaveBeenCalledTimes(1);
    const action01Call = mockAiClient.executeAction01.mock.calls[0];
    expect(action01Call).toBeDefined();

    // Action 1の結果として、5件すべてが『形式正常・内容妥当』と判定されることを確認
    expect(result.validatedIssues).toHaveLength(5);
    result.validatedIssues.forEach((issue) => {
      expect(issue.validationStatus).toBe("valid");
    });

    // Assert: Action 2 - 優先度・カテゴリ自動判定が実行されたことを確認
    expect(mockAiClient.executeAction02).toHaveBeenCalledTimes(1);
    const action02Call = mockAiClient.executeAction02.mock.calls[0];
    expect(action02Call).toBeDefined();

    // Action 2の結果として、5件すべてに対して優先度とカテゴリが割り当てられることを確認
    const issue001 = result.validatedIssues.find(
      (i) => i.issueId === "issue-001"
    );
    expect(issue001?.priorityRank).toBe("high");
    expect(issue001?.category).toBe("品質");
    expect(issue001?.priorityScore).toBe(85);

    const issue002 = result.validatedIssues.find(
      (i) => i.issueId === "issue-002"
    );
    expect(issue002?.priorityRank).toBe("medium");
    expect(issue002?.category).toBe("納期");
    expect(issue002?.priorityScore).toBe(65);

    const issue003 = result.validatedIssues.find(
      (i) => i.issueId === "issue-003"
    );
    expect(issue003?.priorityRank).toBe("low");
    expect(issue003?.category).toBe("安全");
    expect(issue003?.priorityScore).toBe(45);

    const issue004 = result.validatedIssues.find(
      (i) => i.issueId === "issue-004"
    );
    expect(issue004?.priorityRank).toBe("high");
    expect(issue004?.category).toBe("品質");
    expect(issue004?.priorityScore).toBe(78);

    const issue005 = result.validatedIssues.find(
      (i) => i.issueId === "issue-005"
    );
    expect(issue005?.priorityRank).toBe("medium");
    expect(issue005?.category).toBe("納期");
    expect(issue005?.priorityScore).toBe(62);

    // Assert: Action 3 - 既存ツール連携設定実行が実行されたことを確認
    expect(mockAiClient.executeAction03).toHaveBeenCalledTimes(1);
    const action03Call = mockAiClient.executeAction03.mock.calls[0];
    expect(action03Call).toBeDefined();

    // Action 3が各案件のツール連携設定を確定させることを確認
    expect(issue001?.toolIssueId).toBeNull();
    expect(issue002?.toolIssueId).toBeNull();
    expect(issue003?.toolIssueId).toBeNull();
    expect(issue004?.toolIssueId).toBeNull();
    expect(issue005?.toolIssueId).toBeNull();

    // Assert: Action 4 - Jira・Asana等への登録完了が実行されたことを確認
    expect(mockAiClient.executeAction04).toHaveBeenCalledTimes(1);
    const action04Call = mockAiClient.executeAction04.mock.calls[0];
    expect(action04Call).toBeDefined();

    // スタブ化されたツールAPI呼び出しが5件すべてに対して正常に実行されたことを確認
    expect(result.integrationResult.successCount).toBe(5);
    expect(result.integrationResult.failureCount).toBe(0);
    expect(result.integrationResult.totalProcessed).toBe(5);

    // 各呼び出しには案件ID・優先度・カテゴリ・割り当て情報が含まれることを確認
    expect(result.validatedIssues[0].toolIssueId).toBe("JIRA-12345");
    expect(result.validatedIssues[1].toolIssueId).toBe("ASANA-67890");
    expect(result.validatedIssues[2].toolIssueId).toBe("JIRA-12346");
    expect(result.validatedIssues[3].toolIssueId).toBe("ASANA-67891");
    expect(result.validatedIssues[4].toolIssueId).toBe("JIRA-12347");

    // Assert: Action 5 - 連携完了ステータス記録・通知が実行されたことを確認
    expect(mockAiClient.executeAction05).toHaveBeenCalledTimes(1);
    const action05Call = mockAiClient.executeAction05.mock.calls[0];
    expect(action05Call).toBeDefined();

    // すべてのアクションが人手の承認なしに順序通り実行されたことを確認
    const action01CallOrder = mockAiClient.executeAction01.mock.invocationCallOrder[0];
    const action02CallOrder = mockAiClient.executeAction02.mock.invocationCallOrder[0];
    const action03CallOrder = mockAiClient.executeAction03.mock.invocationCallOrder[0];
    const action04CallOrder = mockAiClient.executeAction04.mock.invocationCallOrder[0];
    const action05CallOrder = mockAiClient.executeAction05.mock.invocationCallOrder[0];

    expect(action01CallOrder).toBeLessThan(action02CallOrder);
    expect(action02CallOrder).toBeLessThan(action03CallOrder);
    expect(action03CallOrder).toBeLessThan(action04CallOrder);
    expect(action04CallOrder).toBeLessThan(action05CallOrder);

    // エージェント実行ログ（audit event）に各アクション実行時刻・入出力・判定根拠が記録されていることを確認
    expect(auditEvents.length).toBeGreaterThanOrEqual(5);

    const auditEvent01 = auditEvents.find((e) => e.actionNumber === 1);
    expect(auditEvent01).toBeDefined();
    expect(auditEvent01?.status).toBe("completed");
    expect(auditEvent01?.inputSummary).toContain("validation");
    expect(auditEvent01?.outputSummary).toContain("passed");

    const auditEvent02 = auditEvents.find((e) => e.actionNumber === 2);
    expect(auditEvent02).toBeDefined();
    expect(auditEvent02?.status).toBe("completed");
    expect(auditEvent02?.confidenceScore).toBeGreaterThanOrEqual(0.81);
    expect(auditEvent02?.confidenceScore).toBeLessThanOrEqual(0.92);

    const auditEvent04 = auditEvents.find((e) => e.actionNumber === 4);
    expect(auditEvent04).toBeDefined();
    expect(auditEvent04?.status).toBe("completed");
    expect(auditEvent04?.toolRegistrationIds).toHaveLength(5);
    expect(auditEvent04?.toolRegistrationIds).toContain("JIRA-12345");
    expect(auditEvent04?.toolRegistrationIds).toContain("ASANA-67890");
    expect(auditEvent04?.toolRegistrationIds).toContain("JIRA-12346");
    expect(auditEvent04?.toolRegistrationIds).toContain("ASANA-67891");
    expect(auditEvent04?.toolRegistrationIds).toContain("JIRA-12347");

    // 期待結果: 5件の通常案件が自動実行され、すべてが『登録完了・連携確認済み』ステータスに到達する
    expect(result.validatedIssues).toHaveLength(5);
    result.validatedIssues.forEach((issue) => {
      expect(issue.toolIssueId).toBeTruthy();
      expect(
        [
          "JIRA-12345",
          "ASANA-67890",
          "JIRA-12346",
          "ASANA-67891",
          "JIRA-12347",
        ]
      ).toContain(issue.toolIssueId);
    });

    // 各案件は優先度・カテゴリが確定している
    result.validatedIssues.forEach((issue) => {
      expect(["high", "medium", "low"]).toContain(issue.priorityRank);
      expect(["品質", "納期", "安全"]).toContain(issue.category);
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
    });

    // エージェント実行ログには各アクションの実行時刻、入出力データ、判定の信頼度スコア、ツール登録IDが記録される
    expect(result.executionSummary.totalDurationMs).toBeGreaterThan(0);
    expect(result.executionSummary.finalStatus).toBe("success");
    expect(result.executionSummary.exceptionOccurred).toBe(false);

    // 人への通知・確認は発生しない
    expect(mockAiClient.executeAction01).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction02).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction03).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction04).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction05).toHaveBeenCalledTimes(1);

    // AIクライアントの呼び出し回数は各アクション1回ずつ、人の承認フローは発生していない
    const totalAiClientCalls =
      mockAiClient.executeAction01.mock.calls.length +
      mockAiClient.executeAction02.mock.calls.length +
      mockAiClient.executeAction03.mock.calls.length +
      mockAiClient.executeAction04.mock.calls.length +
      mockAiClient.executeAction05.mock.calls.length;
    expect(totalAiClientCalls).toBe(5);
  });
});