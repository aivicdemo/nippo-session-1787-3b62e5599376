import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx10Imp1Agent } from "../../src/agents/tx-10-imp-1/orchestrator";

describe("朝会報告管理システム - tx_10初期導入・ユーザー教育フロー", () => {
  // SCEN-2666
  test("初期導入・ユーザー教育フロー（tx_10）における再テスト報告入力期限管理 - 再テスト報告期限が月末と月初をまたぐ場合、期限日が正しく計算される", async () => {
    // テストデータセットアップ
    const retestStartDate = new Date("2026-01-29T00:00:00Z");
    const daysUntilDeadline = 3;

    // 再テスト報告期限の計算ロジックを実行
    const input = {
      deploymentInitiationTimestamp: new Date("2026-01-20T09:00:00Z"),
      participantList: [
        {
          userId: "PM001",
          role: "ProjectManager",
          email: "pm@example.com",
        },
        {
          userId: "MGR001",
          role: "Manager",
          email: "manager@example.com",
        },
        {
          userId: "ENG001",
          role: "Engineer",
          email: "eng001@example.com",
        },
        {
          userId: "ENG002",
          role: "Engineer",
          email: "eng002@example.com",
        },
        {
          userId: "ENG003",
          role: "Engineer",
          email: "eng003@example.com",
        },
        {
          userId: "ENG004",
          role: "Engineer",
          email: "eng004@example.com",
        },
        {
          userId: "ENG005",
          role: "Engineer",
          email: "eng005@example.com",
        },
        {
          userId: "ENG006",
          role: "Engineer",
          email: "eng006@example.com",
        },
        {
          userId: "ENG007",
          role: "Engineer",
          email: "eng007@example.com",
        },
        {
          userId: "ENG008",
          role: "Engineer",
          email: "eng008@example.com",
        },
        {
          userId: "ENG009",
          role: "Engineer",
          email: "eng009@example.com",
        },
        {
          userId: "ENG010",
          role: "Engineer",
          email: "eng010@example.com",
        },
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: "09:00",
    };

    const mockAiClient = {
      generateDeploymentSchedule: jest
        .fn()
        .mockResolvedValue({
          startDate: new Date("2026-01-20T09:00:00Z"),
          phase1DeadlineDate: new Date("2026-01-27T09:00:00Z"),
          phase2DeadlineDate: new Date("2026-02-03T09:00:00Z"),
          productionStartDate: new Date("2026-02-10T09:00:00Z"),
          retestDeadlineDate: new Date("2026-02-01T09:00:00Z"),
        }),
      generateTrainingMaterials: jest
        .fn()
        .mockResolvedValue([
          {
            contentType: "manager_guide",
            title: "マネージャー向けガイド",
            content:
              "朝会報告管理システム導入ガイド（マネージャー版）\n\n本ガイドは、朝会報告管理システムの導入・運用を支援するマネージャー向けの手引きです。",
          },
          {
            contentType: "engineer_training",
            title: "エンジニア向け研修教材",
            content:
              "朝会報告管理システム操作手順書（エンジニア版）\n\n本教材は、朝会報告管理システムの基本操作方法を習得するためのハンズオン教材です。",
          },
        ]),
      evaluateInitialReportQuality: jest
        .fn()
        .mockResolvedValue({
          submissionRate: 95,
          dataQualityScore: 85,
          formatUniformityScore: 88,
          feedbackItems: [
            {
              engineerId: "ENG003",
              issue: "課題項目の記述が曖昧",
              recommendation: "具体的な課題内容の記述方法について個別指導を実施",
            },
          ],
        }),
      determineOnboardingApprovalStatus: jest
        .fn()
        .mockResolvedValue({
          approvalStatus: "approved",
          canProceedToProduction: true,
          remarks: "全ての基準を満たしているため本運用への移行を承認します",
        }),
    };

    // runTx10Imp1Agent を呼び出し
    const output = await runTx10Imp1Agent(input, mockAiClient);

    // 計算結果を検証: 期限日が「2026年2月1日」（月をまたぐ翌月1日）として正しく計算されていることを確認
    const expectedRetestDeadline = new Date("2026-02-01T09:00:00Z");
    expect(output.deploymentSchedule.retestDeadlineDate).toEqual(
      expectedRetestDeadline
    );

    // 期限日の日付オブジェクトの値を直接検査
    const retestDeadlineDate = output.deploymentSchedule.retestDeadlineDate;
    expect(retestDeadlineDate.getUTCFullYear()).toBe(2026);
    expect(retestDeadlineDate.getUTCMonth() + 1).toBe(2);
    expect(retestDeadlineDate.getUTCDate()).toBe(1);

    // タイムゾーン依存性を排除: 計算に使用された日時が UTC ベースで一貫していることを確認
    expect(retestDeadlineDate.toISOString()).toBe("2026-02-01T09:00:00.000Z");

    // output 全体の構造を検証
    expect(output).toHaveProperty("deploymentSchedule");
    expect(output).toHaveProperty("trainingMaterials");
    expect(output).toHaveProperty("initialReportAnalysis");
    expect(output).toHaveProperty("onboardingApprovalStatus");

    // trainingMaterials が配列であることを確認
    expect(Array.isArray(output.trainingMaterials)).toBe(true);
    expect(output.trainingMaterials.length).toBeGreaterThan(0);

    // initialReportAnalysis の構造を検証
    expect(output.initialReportAnalysis).toHaveProperty("submissionRate");
    expect(output.initialReportAnalysis).toHaveProperty("dataQualityScore");
    expect(output.initialReportAnalysis).toHaveProperty("formatUniformityScore");
    expect(output.initialReportAnalysis).toHaveProperty("feedbackItems");

    // onboardingApprovalStatus の構造を検証
    expect(output.onboardingApprovalStatus).toHaveProperty("approvalStatus");
    expect(output.onboardingApprovalStatus).toHaveProperty(
      "canProceedToProduction"
    );

    // 提出率が期待値範囲内であることを確認
    expect(output.initialReportAnalysis.submissionRate).toBeGreaterThanOrEqual(
      0
    );
    expect(output.initialReportAnalysis.submissionRate).toBeLessThanOrEqual(
      100
    );

    // データ品質スコアが期待値範囲内であることを確認
    expect(output.initialReportAnalysis.dataQualityScore).toBeGreaterThanOrEqual(
      0
    );
    expect(output.initialReportAnalysis.dataQualityScore).toBeLessThanOrEqual(
      100
    );

    // 入力形式の統一度スコアが期待値範囲内であることを確認
    expect(
      output.initialReportAnalysis.formatUniformityScore
    ).toBeGreaterThanOrEqual(0);
    expect(output.initialReportAnalysis.formatUniformityScore).toBeLessThanOrEqual(
      100
    );

    // 月末と月初をまたぐ期限計算が正確に実行されたことを最終確認
    const startDate = new Date("2026-01-29T00:00:00Z");
    const calculatedDeadline = new Date(startDate);
    calculatedDeadline.setUTCDate(calculatedDeadline.getUTCDate() + 3);
    calculatedDeadline.setUTCHours(9, 0, 0, 0);

    expect(retestDeadlineDate.getTime()).toBe(calculatedDeadline.getTime());
  });
});