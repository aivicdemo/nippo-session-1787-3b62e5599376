import { evaluateInitialReportSubmission } from "../../src/logic/adoption-training-management";

describe("朝会報告管理システム", () => {
  test("SCEN-591: エンジニアの初回テスト報告データを検証し、極端に短い報告内容に対して不合格と改善指示を返す", () => {
    // 入力データの準備
    const reportId = "RPT-001";
    const engineerId = "ENG-001";
    const yesterdayAccomplishment = "バグ";
    const todayPlan = "修正";
    const issuesAndConcerns = "遅";
    const submissionTimestamp = new Date("2024-01-15T09:00:00Z");
    const trainingPhaseId = "PHASE-001";

    const input = {
      reportId,
      engineerId,
      yesterdayAccomplishment,
      todayPlan,
      issuesAndConcerns,
      submissionTimestamp,
      trainingPhaseId,
    };

    // 関数呼び出し
    const result = evaluateInitialReportSubmission(input);

    // 期待結果の検証
    // reportId は入力値と同一
    expect(result.reportId).toBe("RPT-001");

    // 総合スコア (25+30+100)/3 = 51.67 で80未満のため、evaluationStatus は "FAILED"
    expect(result.evaluationStatus).toBe("FAILED");

    // qualityScore は 25（極端に短い報告内容のため低スコア）
    expect(result.qualityScore).toBe(25);

    // formatUnificationDegree は 30（形式統一度が低い）
    expect(result.formatUnificationDegree).toBe(30);

    // feedbackItems に報告内容が非常に短いことに関する改善指示が含まれる
    expect(result.feedbackItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: expect.any(String),
          evaluationLevel: expect.stringMatching(/GOOD|FAIR|POOR/),
          improvementInstruction: expect.stringContaining("報告内容が非常に短い"),
        }),
      ])
    );

    // evaluationTimestamp は Date型で設定されている
    expect(result.evaluationTimestamp).toBeInstanceOf(Date);

    // 品質基準未達エラーが発生することを確認
    // 総合スコアが80未満のため、品質基準エラーが投げられるべき
    expect(() => {
      if (result.evaluationStatus === "FAILED") {
        throw new Error(
          "報告内容の品質が基準を満たしていません。改善指示に従って修正してください。"
        );
      }
    }).toThrow(/品質/);
  });
});