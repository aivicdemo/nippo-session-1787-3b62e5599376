import { runTx8Imp1Agent } from "../../src/agents/tx-8-imp-1/orchestrator";
import { type Tx8Imp1AiClient } from "../../src/agents/tx-8-imp-1/orchestrator";

describe("tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行", () => {
  test("SCEN-3211: 権限レベル1のユーザーが全社課題データベースへのアクセスを試行した場合、Action 1で権限エラーが発生し、以降のアクション実行が停止される", async () => {
    // Arrange: 権限チェック機能を組み込んだスタブAiClientを作成
    const auditLog: Array<{
      userId: string;
      agentId: string;
      action: string;
      target: string;
      requiredLevel: number;
      currentLevel: number;
      timestamp: string;
      result: string;
    }> = [];

    const stubAiClient: Tx8Imp1AiClient = {
      // Action 1: 課題データ検索・抽出 - 権限チェック付き
      searchExtractIssueData: async (context) => {
        const userId = context.executingUserId;
        const userPrivilegeLevel = context.userPrivilegeLevel;
        const accessTarget = "company-issue-db";
        const requiredLevel = 2;

        if (userPrivilegeLevel < requiredLevel) {
          const now = new Date("2024-01-15T11:00:00Z").toISOString();
          auditLog.push({
            userId,
            agentId: "tx_8_imp_1",
            action: "search-extract",
            target: accessTarget,
            requiredLevel,
            currentLevel: userPrivilegeLevel,
            timestamp: now,
            result: "DENIED",
          });

          throw new Error(
            `Authorization denied: insufficient privileges to access company-wide issue database. Required level: ${requiredLevel}, Current level: ${userPrivilegeLevel}`
          );
        }

        return {
          issues: [],
          extractedAt: new Date("2024-01-15T11:00:00Z").toISOString(),
        };
      },

      // Action 2: 時系列分析 - 呼ばれないはず
      analyzeTimeSeriesPattern: async () => {
        throw new Error("Action 2 should not be called after authorization error");
      },

      // Action 3: パターン特定 - 呼ばれないはず
      identifyRecurringPatterns: async () => {
        throw new Error("Action 3 should not be called after authorization error");
      },

      // Action 4: 優先度判定 - 呼ばれないはず
      assessPriorityScores: async () => {
        throw new Error("Action 4 should not be called after authorization error");
      },

      // Action 5: レポート生成 - 呼ばれないはず
      generateVisualizationGraphs: async () => {
        throw new Error("Action 5 should not be called after authorization error");
      },
    };

    // Act & Assert: オーケストレータを実行し、権限エラーがキャッチされることを確認
    const executionContext = {
      executingUserId: "user_emp_001",
      userPrivilegeLevel: 1,
      analysisStartDate: "2024-01-01",
      analysisEndDate: "2024-01-31",
      teamIds: undefined,
      minimumRecurrenceThreshold: 3,
      recipientManagerId: "mgr_001",
    };

    let authorizationErrorCaught = false;
    let errorMessage = "";

    try {
      await runTx8Imp1Agent(executionContext, stubAiClient);
    } catch (error) {
      authorizationErrorCaught = true;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
    }

    // 権限エラーがスローされたことを確認
    expect(authorizationErrorCaught).toBe(true);
    expect(errorMessage).toMatch(/Authorization denied/);
    expect(errorMessage).toMatch(/insufficient privileges/);
    expect(errorMessage).toMatch(/company-wide issue database/);
    expect(errorMessage).toMatch(/Required level: 2/);
    expect(errorMessage).toMatch(/Current level: 1/);

    // 監査ログが正確に記録されていることを確認
    expect(auditLog).toHaveLength(1);
    const auditEntry = auditLog[0];
    expect(auditEntry.userId).toBe("user_emp_001");
    expect(auditEntry.agentId).toBe("tx_8_imp_1");
    expect(auditEntry.action).toBe("search-extract");
    expect(auditEntry.target).toBe("company-issue-db");
    expect(auditEntry.requiredLevel).toBe(2);
    expect(auditEntry.currentLevel).toBe(1);
    expect(auditEntry.result).toBe("DENIED");
    expect(auditEntry.timestamp).toBe("2024-01-15T11:00:00Z");

    // Action 2以降は呼ばれないことが保証される
    // (スタブのanalyzeTimeSeriesPatternなどが呼ばれると例外をスロー)
  });
});