import { validateReportQuality } from "../../src/logic/report-quality-validation";

describe("Report Quality Validation", () => {
  // SCEN-502
  test("should throw error when expectedImpact is empty string", () => {
    const planTitle = "ビルドプロセスの自動化";
    const targetIssueIds = ["issue-001"];
    const expectedImpact = "";
    const implementationSteps = [
      {
        order: 1,
        content: "自動化スクリプト作成",
        assignee: "dev-user-01",
        deadline: "2024-12-31",
      },
    ];
    const resourcesRequired = "エンジニア2名、CI/CDツール";
    const riskAssessment =
      "スクリプト不具合時の手動対応方針を策定";

    expect(() =>
      validateReportQuality({
        planTitle,
        targetIssueIds,
        expectedImpact,
        implementationSteps,
        resourcesRequired,
        riskAssessment,
      })
    ).toThrow(/期待効果/);
  });
});