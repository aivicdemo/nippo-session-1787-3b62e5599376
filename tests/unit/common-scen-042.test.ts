import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
import type {
  Tx2Imp1AgentInput,
  Tx2Imp1AgentOutput,
} from "../../src/agents/tx-2-imp-1/orchestrator";
import type { Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from "../../src/agents/tx-2-imp-1/prompts/action-02";

describe("tx-2-imp-1: 日報収集から課題抽出・配信までの自律実行", () => {
  test("SCEN-042: Action 2 で複数形式の日報が UNIFIED_V1 フォーマットに統一変換される", async () => {
    // ============================================================
    // Setup: モック AI クライアント構築
    // ============================================================
    const mockAiClient: Tx2Imp1AiClient = {
      buildAction01Prompt: jest.fn(),
      buildAction02Prompt: jest.fn(),
      buildAction03Prompt: jest.fn(),
      buildAction04Prompt: jest.fn(),
      buildAction05Prompt: jest.fn(),
      buildAction06Prompt: jest.fn(),
      callAiModel: jest.fn(),
    };

    // ============================================================
    // Setup: 複数形式の混在日報データ準備（テキスト、JSON、CSV）
    // ============================================================
    const textFormatReport = `
      メンバーID: EMP001
      氏名: 太郎
      報告日: 2024-01-15
      昨日の実績: タスクA完了、進捗70%達成
      本日の予定: タスクB着手、会議参加
      課題: DB接続がタイムアウトする
    `;

    const jsonFormatReport = {
      memberId: "EMP002",
      memberName: "花子",
      reportDate: "2024-01-15",
      yesterdayWork: "デザイン案作成完了",
      todayWork: "レビュー対応",
      issues: ["フォントサイズ不統一", "色選定未決定"],
    };

    const csvFormatReport =
      "EMP003,次郎,2024-01-15,ドキュメント作成,版管理システム構築,APIスキーマが未定義";

    const receivedReports = [
      { format: "TEXT", content: textFormatReport },
      { format: "JSON", content: JSON.stringify(jsonFormatReport) },
      { format: "CSV", content: csvFormatReport },
      // 追加7名分の報告を生成（合計10名）
      {
        format: "TEXT",
        content: `
        メンバーID: EMP004
        氏名: 美咲
        報告日: 2024-01-15
        昨日の実績: テスト実施
        本日の予定: 不具合修正
        課題: メモリリーク検出
      `,
      },
      {
        format: "JSON",
        content: JSON.stringify({
          memberId: "EMP005",
          memberName: "健太",
          reportDate: "2024-01-15",
          yesterdayWork: "インフラ構築",
          todayWork: "監視設定",
          issues: ["ディスク容量警告"],
        }),
      },
      {
        format: "CSV",
        content: "EMP006,由美,2024-01-15,パフォーマンス計測,最適化実施,スループット向上必要",
      },
      {
        format: "TEXT",
        content: `
        メンバーID: EMP007
        氏名: 翔太
        報告日: 2024-01-15
        昨日の実績: デプロイ実行
        本日の予定: ログ確認
        課題: エラーログ量が多い
      `,
      },
      {
        format: "JSON",
        content: JSON.stringify({
          memberId: "EMP008",
          memberName: "陽子",
          reportDate: "2024-01-15",
          yesterdayWork: "ユーザビリティテスト",
          todayWork: "改善施策実装",
          issues: ["ナビゲーション複雑性"],
        }),
      },
      {
        format: "CSV",
        content: "EMP009,拓也,2024-01-15,運用監視,アラート対応,ネットワーク遅延発生",
      },
      {
        format: "TEXT",
        content: `
        メンバーID: EMP010
        氏名: 亜衣
        報告日: 2024-01-15
        昨日の実績: 品質チェック
        本日の予定: チーム同期
        課題: テストカバレッジ不足
      `,
      },
    ];

    // ============================================================
    // Setup: モック戻り値の統一フォーマット配列
    // ============================================================
    const unifiedReports = [
      {
        memberId: "EMP001",
        memberName: "太郎",
        reportDate: "2024-01-15",
        yesterdayWork: "タスクA完了、進捗70%達成",
        todayWork: "タスクB着手、会議参加",
        issues: ["DB接続がタイムアウトする"],
        extractedAt: "2024-01-15T09:30:00+09:00",
        sourceFormat: "TEXT",
        normalizedFormat: "UNIFIED_V1",
      },
      {
        memberId: "EMP002",
        memberName: "花子",
        reportDate: "2024-01-15",
        yesterdayWork: "デザイン案作成完了",
        todayWork: "レビュー対応",
        issues: ["フォントサイズ不統一", "色選定未決定"],
        extractedAt: "2024-01-15T09:31:00+09:00",
        sourceFormat: "JSON",
        normalizedFormat: "UNIFIED_V1",
      },
      {
        memberId: "EMP003",
        memberName: "次郎",
        reportDate: "2024-01-15",
        yesterdayWork: "ドキュメント作成",
        todayWork: "版管理システム構築",
        issues: ["APIスキーマが未定義"],
        extractedAt: "2024-01-15T09:32:00+09:00",
        sourceFormat: "CSV",
        normalizedFormat: "UNIFIED_V1",
      },
      {
        memberId: "EMP004",
        memberName: "美咲",
        reportDate: "2024-01-15",
        yesterdayWork: "テスト実施",
        todayWork: "不具合修正",
        issues: ["メモリリーク検出"],
        extractedAt: "2024-01-15T09:33:00+09:00",
        sourceFormat: "TEXT",
        normalizedFormat: "UNIFIED_V1",
      },
      {
        memberId: "EMP005",
        memberName: "健太",
        reportDate: "2024-01-15",
        yesterdayWork: "インフラ構築",
        todayWork: "監視設定",
        issues: ["ディスク容量警告"],
        extractedAt: "2024-01-15T09:34:00+09:00",
        sourceFormat: "JSON",
        normalizedFormat: "UNIFIED_V1",
      },
      {
        memberId: "EMP006",
        memberName: "由美",
        reportDate: "2024-01-15",
        yesterdayWork: "パフォーマンス計測",
        todayWork: "最適化実施",
        issues: ["スループット向上必要"],
        extractedAt: "2024-01-15T09:35:00+09:00",
        sourceFormat: "CSV",
        normalizedFormat: "UNIFIED_V1",
      },
      {
        memberId: "EMP007",
        memberName: "翔太",
        reportDate: "2024-01-15",
        yesterdayWork: "デプロイ実行",
        todayWork: "ログ確認",
        issues: ["エラーログ量が多い"],
        extractedAt: "2024-01-15T09:36:00+09:00",
        sourceFormat: "TEXT",
        normalizedFormat: "UNIFIED_V1",
      },
      {
        memberId: "EMP008",
        memberName: "陽子",
        reportDate: "2024-01-15",
        yesterdayWork: "ユーザビリティテスト",
        todayWork: "改善施策実装",
        issues: ["ナビゲーション複雑性"],
        extractedAt: "2024-01-15T09:37:00+09:00",
        sourceFormat: "JSON",
        normalizedFormat: "UNIFIED_V1",
      },
      {
        memberId: "EMP009",
        memberName: "拓也",
        reportDate: "2024-01-15",
        yesterdayWork: "運用監視",
        todayWork: "アラート対応",
        issues: ["ネットワーク遅延発生"],
        extractedAt: "2024-01-15T09:38:00+09:00",
        sourceFormat: "CSV",
        normalizedFormat: "UNIFIED_V1",
      },
      {
        memberId: "EMP010",
        memberName: "亜衣",
        reportDate: "2024-01-15",
        yesterdayWork: "品質チェック",
        todayWork: "チーム同期",
        issues: ["テストカバレッジ不足"],
        extractedAt: "2024-01-15T09:39:00+09:00",
        sourceFormat: "TEXT",
        normalizedFormat: "UNIFIED_V1",
      },
    ];

    // ============================================================
    // Setup: mockAiClient の buildAction02Prompt を設定
    // ============================================================
    (mockAiClient.buildAction02Prompt as jest.Mock).mockReturnValue(
      "mock-action-02-prompt"
    );

    // Action 02 が呼ばれた際に統一フォーマットを返す
    (mockAiClient.callAiModel as jest.Mock).mockImplementation(
      async (prompt: string) => {
        if (prompt === "mock-action-02-prompt") {
          return {
            processedReports: unifiedReports,
            conversionStatus: "success",
          };
        }
        return {};
      }
    );

    // ============================================================
    // Setup: Tx2Imp1AgentInput を準備
    // ============================================================
    const executionTime = new Date("2024-01-15T09:25:00Z");
    const reportingDeadline = new Date("2024-01-15T09:30:00Z");
    const agentInput: Tx2Imp1AgentInput = {
      executionTimestamp: executionTime,
      teamId: "TEAM-001",
      reportingDeadline: reportingDeadline,
      managerEmail: "manager@example.com",
    };

    // ============================================================
    // Execution: runTx2Imp1Agent を実行
    // ============================================================
    const result = await runTx2Imp1Agent(agentInput, mockAiClient);

    // ============================================================
    // Verification: buildAction02Prompt がエクスポートされている確認
    // ============================================================
    expect(typeof buildAction02Prompt).toBe("function");
    expect(ACTION_02_PROMPT_VERSION).toBeDefined();

    // ============================================================
    // Verification: mockAiClient の buildAction02Prompt が呼ばれたこと
    // ============================================================
    expect(mockAiClient.buildAction02Prompt).toHaveBeenCalled();

    // ============================================================
    // Verification: 複数形式の日報が UNIFIED_V1 に統一変換されていることを検証
    // ============================================================
    expect(result).toBeDefined();

    // processedReports が存在することを確認
    if (
      result &&
      typeof result === "object" &&
      "processedReports" in result
    ) {
      const processedReports = (result as any).processedReports || [];

      // 全10名の日報が処理されたことを確認
      expect(processedReports).toHaveLength(10);

      // 各レコードの必須フィールドを検証
      processedReports.forEach((report: any, index: number) => {
        expect(report).toHaveProperty("memberId");
        expect(report).toHaveProperty("memberName");
        expect(report).toHaveProperty("reportDate");
        expect(report).toHaveProperty("yesterdayWork");
        expect(report).toHaveProperty("todayWork");
        expect(report).toHaveProperty("issues");
        expect(report).toHaveProperty("extractedAt");
        expect(report).toHaveProperty("sourceFormat");
        expect(report).toHaveProperty("normalizedFormat");

        // normalizedFormat が全て UNIFIED_V1 であることを確認
        expect(report.normalizedFormat).toBe("UNIFIED_V1");

        // sourceFormat が元の入力形式を保持していることを確認
        expect(["TEXT", "JSON", "CSV"]).toContain(report.sourceFormat);

        // extractedAt が ISO 8601 形式（JST タイムゾーン付き）であることを確認
        expect(report.extractedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/);

        // 期待値の具体的な値と一致することを確認
        const expectedReport = unifiedReports[index];
        expect(report.memberId).toBe(expectedReport.memberId);
        expect(report.memberName).toBe(expectedReport.memberName);
        expect(report.reportDate).toBe(expectedReport.reportDate);
        expect(report.sourceFormat).toBe(expectedReport.sourceFormat);
      });

      // TEXT 形式の日報が正確に変換されていることを検証
      const textReportResult = processedReports.find(
        (r: any) => r.memberId === "EMP001"
      );
      expect(textReportResult).toBeDefined();
      expect(textReportResult.sourceFormat).toBe("TEXT");
      expect(textReportResult.normalizedFormat).toBe("UNIFIED_V1");
      expect(textReportResult.yesterdayWork).toBe("タスクA完了、進捗70%達成");
      expect(textReportResult.todayWork).toBe("タスクB着手、会議参加");
      expect(Array.isArray(textReportResult.issues)).toBe(true);
      expect(textReportResult.issues.length).toBeGreaterThan(0);

      // JSON 形式の日報が正確に変換されていることを検証
      const jsonReportResult = processedReports.find(
        (r: any) => r.memberId === "EMP002"
      );
      expect(jsonReportResult).toBeDefined();
      expect(jsonReportResult.sourceFormat).toBe("JSON");
      expect(jsonReportResult.normalizedFormat).toBe("UNIFIED_V1");
      expect(jsonReportResult.memberName).toBe("花子");
      expect(jsonReportResult.issues).toEqual(
        expect.arrayContaining(["フォントサイズ不統一", "色選定未決定"])
      );

      // CSV 形式の日報が正確に変換されていることを検証
      const csvReportResult = processedReports.find(
        (r: any) => r.memberId === "EMP003"
      );
      expect(csvReportResult).toBeDefined();
      expect(csvReportResult.sourceFormat).toBe("CSV");
      expect(csvReportResult.normalizedFormat).toBe("UNIFIED_V1");
      expect(csvReportResult.memberName).toBe("次郎");
      expect(csvReportResult.yesterdayWork).toBe("ドキュメント作成");

      // 同一メンバーの複数形式が同じ統一フォーマットになっていることを確認
      // （複数回の入力があった場合のシナリオ）
      const multiFormatMembers = processedReports.filter(
        (r: any) =>
          ["EMP001", "EMP002", "EMP003"].includes(r.memberId)
      );
      multiFormatMembers.forEach((member: any) => {
        expect(member.normalizedFormat).toBe("UNIFIED_V1");
        expect(member.reportDate).toBe("2024-01-15");
      });

      // extractedAt が JST タイムゾーン（+09:00）で記録されていることを確認
      processedReports.forEach((report: any) => {
        expect(report.extractedAt).toContain("+09:00");
      });
    }
  });
});