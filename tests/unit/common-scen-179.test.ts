import { runTx10Imp1Agent } from "../../src/agents/tx-10-imp-1/orchestrator";
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from "../../src/agents/tx-10-imp-1/prompts/action-02";
import type { Tx10Imp1AiClient } from "../../src/agents/tx-10-imp-1/orchestrator";
import type { Tx10AgentInput, Tx10AgentOutput, DeploymentParticipant } from "../../src/agents/tx-10-imp-1/orchestrator";

describe("Tx10Imp1Agent - 導入計画・研修実施・フィードバック対応の自動化・統合", () => {
  // SCEN-179
  test("部長向け操作ガイドと運用ルール説明資料が正常に生成される", async () => {
    const deploymentInitiationTimestamp = new Date("2024-01-15T09:00:00Z");
    const reportingDeadlineTime = "09:00";

    const participantList: DeploymentParticipant[] = [
      { userId: "PM001", role: "ProjectManager", email: "pm@example.com" },
      { userId: "MGR001", role: "Manager", email: "manager@example.com" },
      ...Array.from({ length: 10 }, (_, i) => ({
        userId: `ENG${String(i + 1).padStart(3, "0")}`,
        role: "Engineer",
        email: `engineer${i + 1}@example.com`,
      })),
    ];

    const mockAiClient: Tx10Imp1AiClient = {
      invokeAction01: jest.fn().mockResolvedValue({
        deploymentSchedule: {
          initiationDate: new Date("2024-01-15"),
          phase1DeadlineDate: new Date("2024-01-22"),
          phase2DeadlineDate: new Date("2024-01-29"),
          phase3DeadlineDate: new Date("2024-02-05"),
          productionStartDate: new Date("2024-02-12"),
        },
      }),
      invokeAction02: jest.fn().mockResolvedValue({
        operationGuideContent: {
          title: "朝会報告アプリ操作ガイド",
          sections: [
            {
              heading: "ログイン手順",
              content: "会社メールアドレスとパスワードでログイン",
            },
            {
              heading: "日報入力",
              content: "昨日やったこと、今日やること、抱えている課題の3項目を入力",
            },
            {
              heading: "送信",
              content: "送信ボタンを押すと確認メールが部長に自動配信される",
            },
          ],
          format: "markdown",
        },
        operationRuleContent: {
          title: "運用ルール説明",
          sections: [
            {
              heading: "報告時間",
              content: "毎朝09:00までに報告を完了してください",
            },
            {
              heading: "参加者",
              content: "部員10名全員の報告が必須です",
            },
            {
              heading: "部長への確認",
              content: "報告内容は自動で部長にメール配信されます。部長はメールで確認します。",
            },
            {
              heading: "遅延対応",
              content: "09:30に未提出者への自動催促メールが送信されます",
            },
          ],
          format: "markdown",
        },
      }),
      invokeAction03: jest.fn().mockResolvedValue({
        trainingMaterials: [],
      }),
      invokeAction04: jest.fn().mockResolvedValue({
        initialReportAnalysis: {
          submissionRate: 0,
          dataQualityScore: 0,
          formatUniformityScore: 0,
          feedbackItems: [],
        },
      }),
      invokeAction05: jest.fn().mockResolvedValue({
        onboardingApprovalStatus: "pending",
      }),
      invokeAction06: jest.fn().mockResolvedValue({
        notificationStatus: "not_sent",
      }),
    };

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired: 7,
      reportingDeadlineTime,
    };

    const result = await runTx10Imp1Agent(input, mockAiClient);

    expect(mockAiClient.invokeAction02).toHaveBeenCalled();

    const action02Args = (mockAiClient.invokeAction02 as jest.Mock).mock.calls[0];
    if (action02Args && action02Args[0]) {
      const promptInput = action02Args[0];
      expect(promptInput).toHaveProperty("deploymentDepartmentName");
      expect(promptInput).toHaveProperty("participantCount");
      expect(promptInput).toHaveProperty("appSpecification");
      expect(promptInput).toHaveProperty("operationalRules");
    }

    expect(result).toHaveProperty("trainingMaterials");
    expect(Array.isArray(result.trainingMaterials)).toBe(true);

    expect(result).toHaveProperty("deploymentSchedule");
    expect(result.deploymentSchedule).toHaveProperty("initiationDate");
    expect(result.deploymentSchedule).toHaveProperty("phase1DeadlineDate");
    expect(result.deploymentSchedule).toHaveProperty("phase2DeadlineDate");
    expect(result.deploymentSchedule).toHaveProperty("phase3DeadlineDate");
    expect(result.deploymentSchedule).toHaveProperty("productionStartDate");

    const operationGuideFound =
      result.trainingMaterials &&
      result.trainingMaterials.some(
        (m) =>
          m &&
          typeof m === "object" &&
          "title" in m &&
          (m.title === "朝会報告アプリ操作ガイド" ||
            m.title?.includes("操作ガイド"))
      );

    const operationRuleFound =
      result.trainingMaterials &&
      result.trainingMaterials.some(
        (m) =>
          m &&
          typeof m === "object" &&
          "title" in m &&
          (m.title === "運用ルール説明" || m.title?.includes("運用ルール"))
      );

    expect(operationGuideFound).toBe(true);
    expect(operationRuleFound).toBe(true);

    const guideMaterial = result.trainingMaterials?.find(
      (m) => m && typeof m === "object" && "title" in m && m.title?.includes("操作ガイド")
    );
    if (
      guideMaterial &&
      typeof guideMaterial === "object" &&
      "content" in guideMaterial
    ) {
      const guideContent = guideMaterial.content;
      if (typeof guideContent === "string") {
        expect(guideContent).toMatch(/ログイン/);
        expect(guideContent).toMatch(/昨日やったこと/);
        expect(guideContent).toMatch(/今日やること/);
        expect(guideContent).toMatch(/抱えている課題/);
        expect(guideContent).toMatch(/送信/);
      }
    }

    const ruleMaterial = result.trainingMaterials?.find(
      (m) =>
        m &&
        typeof m === "object" &&
        "title" in m &&
        m.title?.includes("運用ルール")
    );
    if (ruleMaterial && typeof ruleMaterial === "object" && "content" in ruleMaterial) {
      const ruleContent = ruleMaterial.content;
      if (typeof ruleContent === "string") {
        expect(ruleContent).toMatch(/毎朝/);
        expect(ruleContent).toMatch(/09:00/);
        expect(ruleContent).toMatch(/10名/);
        expect(ruleContent).toMatch(/メール/);
      }
    }

    expect(result).toHaveProperty("initialReportAnalysis");
    expect(result.initialReportAnalysis).toHaveProperty("submissionRate");
    expect(result.initialReportAnalysis).toHaveProperty("dataQualityScore");
    expect(result.initialReportAnalysis).toHaveProperty("formatUniformityScore");
    expect(result.initialReportAnalysis).toHaveProperty("feedbackItems");

    const promptVersion = ACTION_02_PROMPT_VERSION;
    expect(typeof promptVersion).toBe("string");
    expect(promptVersion.length).toBeGreaterThan(0);

    expect(result.onboardingApprovalStatus).toBeDefined();
    expect(
      result.onboardingApprovalStatus === "pending" ||
        result.onboardingApprovalStatus === "approved" ||
        result.onboardingApprovalStatus === "rejected"
    ).toBe(true);
  });
});