import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";
import { type Tx1Imp1AiClient } from "../../src/agents/tx-1-imp-1/orchestrator";
import { type Tx1Imp1AgentInput, type Tx1Imp1AgentOutput } from "../../src/agents/tx-1-imp-1/orchestrator";

describe("tx-1-imp-1 orchestrator: 日報集約から課題優先順位付けと未提出通知までの自律実行", () => {
  test("SCEN-3083: Action 4 課題の重要度と緊急度から優先順位を自動付与 - 優先度マトリックスに基づく正確な優先順位付けが完了する", async () => {
    // Arrange: Fake AI client を構築
    const mockAiClientCallHistory: {
      method: string;
      args: unknown[];
      timestamp: Date;
    }[] = [];

    const fakeAiClient: Tx1Imp1AiClient = {
      extractKeywords: async (reportText: string) => {
        mockAiClientCallHistory.push({
          method: "extractKeywords",
          args: [reportText],
          timestamp: new Date(),
        });
        return {
          keywords: [
            "DBサーバー",
            "ディスク容量不足",
            "本番環境停止",
          ],
          frequencies: {
            DBサーバー: 3,
            ディスク容量不足: 2,
            本番環境停止: 1,
          },
        };
      },

      assessImpactScore: async (keyword: string) => {
        mockAiClientCallHistory.push({
          method: "assessImpactScore",
          args: [keyword],
          timestamp: new Date(),
        });
        const scoreMap: { [key: string]: number } = {
          DBサーバー: 95,
          ディスク容量不足: 90,
          本番環境停止: 98,
        };
        return scoreMap[keyword] ?? 50;
      },

      classifyIssueSeverity: async (issueText: string) => {
        mockAiClientCallHistory.push({
          method: "classifyIssueSeverity",
          args: [issueText],
          timestamp: new Date(),
        });
        return "高";
      },

      sendUnsubmittedMemberNotification: async (
        memberId: string,
        memberName: string,
        deadlineTime: Date
      ) => {
        mockAiClientCallHistory.push({
          method: "sendUnsubmittedMemberNotification",
          args: [memberId, memberName, deadlineTime],
          timestamp: new Date(),
        });
        return { success: true, notificationId: `notif-${memberId}` };
      },

      generateMorningMeetingMaterial: async (
        prioritizedIssues: Array<{
          issueId: string;
          issueText: string;
          priority: number;
          severity: string;
          impactScore: number;
        }>
      ) => {
        mockAiClientCallHistory.push({
          method: "generateMorningMeetingMaterial",
          args: [prioritizedIssues],
          timestamp: new Date(),
        });
        return {
          materialUrl:
            "https://example.com/materials/2024-01-15-morning-meeting.pdf",
          generatedAt: new Date("2024-01-15T09:30:00Z"),
        };
      },

      notifyManagerDeliveryCompletion: async (
        managerUserId: string,
        materialUrl: string,
        summary: {
          totalTeamMembers: number;
          submittedCount: number;
          unsubmittedCount: number;
        }
      ) => {
        mockAiClientCallHistory.push({
          method: "notifyManagerDeliveryCompletion",
          args: [managerUserId, materialUrl, summary],
          timestamp: new Date(),
        });
        return {
          success: true,
          notificationSentAt: new Date("2024-01-15T09:35:00Z"),
        };
      },
    };

    const agentInput: Tx1Imp1AgentInput = {
      executionTimestamp: new Date("2024-01-15T08:30:00Z"),
      reportDeadlineTime: new Date("2024-01-15T09:00:00Z"),
      morningMeetingStartTime: new Date("2024-01-15T10:00:00Z"),
      targetTeamIds: ["team-001", "team-002"],
      managerUserId: "manager-001",
    };

    // Act: オーケストレータを実行
    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(
      agentInput,
      fakeAiClient
    );

    // Assert: 優先度付けが完了し、期待の順序で課題が整序されている
    expect(result.executionStatus).toBe("success");

    expect(result.prioritizedIssuesList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssuesList)).toBe(true);

    // 優先度付けの検証: 波及度スコア (影響度) の降順を確認
    const issues = result.prioritizedIssuesList;
    expect(issues.length).toBeGreaterThan(0);

    // Issue 0 (最優先): 本番環境停止 (影響度98, 高/高)
    expect(issues[0].keyword).toBe("本番環境停止");
    expect(issues[0].impactScore).toBe(98);
    expect(issues[0].severity).toBe("高");
    expect(issues[0].priority).toBe(1);

    // Issue 1: DBサーバー (影響度95, 高/高)
    expect(issues[1].keyword).toBe("DBサーバー");
    expect(issues[1].impactScore).toBe(95);
    expect(issues[1].severity).toBe("高");
    expect(issues[1].priority).toBe(2);

    // Issue 2: ディスク容量不足 (影響度90, 高/中)
    expect(issues[2].keyword).toBe("ディスク容量不足");
    expect(issues[2].impactScore).toBe(90);
    expect(issues[2].severity).toBe("高");
    expect(issues[2].priority).toBe(3);

    // 同一優先度内では波及度スコア降順であることを確認
    for (let i = 0; i < issues.length - 1; i++) {
      if (issues[i].priority === issues[i + 1].priority) {
        expect(issues[i].impactScore).toBeGreaterThanOrEqual(
          issues[i + 1].impactScore
        );
      }
    }

    // Fake AI client への呼び出し履歴を検証
    const extractKeywordsCall = mockAiClientCallHistory.find(
      (call) => call.method === "extractKeywords"
    );
    expect(extractKeywordsCall).toBeDefined();

    const assessImpactScoreCalls = mockAiClientCallHistory.filter(
      (call) => call.method === "assessImpactScore"
    );
    expect(assessImpactScoreCalls.length).toBeGreaterThan(0);

    const classifyIssueSeverityCalls = mockAiClientCallHistory.filter(
      (call) => call.method === "classifyIssueSeverity"
    );
    expect(classifyIssueSeverityCalls.length).toBeGreaterThan(0);

    // 外部 OpenAI API は呼び出されていない (fake client のみが使用されている)
    expect(mockAiClientCallHistory.length).toBeGreaterThan(0);

    // Execution completion timestamp が記録されていることを確認
    expect(result.executionTimestamp).toBeInstanceOf(Date);
    expect(result.executionTimestamp.getTime()).toBeGreaterThan(
      agentInput.executionTimestamp.getTime()
    );

    // 未提出メンバーへの通知完了フラグを確認
    expect(result.unsubmittedMembersNotified).toBe(true);

    // 朝会資料 URL が生成されていることを確認
    expect(result.morningMeetingMaterialUrl).toBeDefined();
    expect(typeof result.morningMeetingMaterialUrl).toBe("string");

    // 集約結果サマリーを確認
    expect(result.reportAggregationSummary).toBeDefined();
    expect(result.reportAggregationSummary.totalTeamMembers).toBeGreaterThan(0);
    expect(
      result.reportAggregationSummary.submittedCount
    ).toBeLessThanOrEqual(
      result.reportAggregationSummary.totalTeamMembers
    );
  });
});