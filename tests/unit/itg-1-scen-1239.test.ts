import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";

describe("日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能", () => {
  // SCEN-1239: [edge] 既存ツール連携機能 - 抽出課題データ件数がちょうど上限値と同じ場合、すべて重複なく連携される
  test("上限件数ちょうどの課題キーワードが重複なく連携される", async () => {
    const KEYWORD_LIMIT = 100;

    // モック済みのextractKeywordsレスポンスを生成
    // 100個の一意な課題キーワードを各メンバーの日報から抽出
    const mockExtractedKeywords = Array.from({ length: KEYWORD_LIMIT }, (_, i) => ({
      keyword: `課題_${String(i + 1).padStart(3, "0")}`,
      frequency: Math.floor(Math.random() * 10) + 1,
    }));

    // 10名の部員からの日報テキストを準備
    const memberReports = Array.from({ length: 10 }, (_, memberIdx) => ({
      memberId: `member_${String(memberIdx + 1).padStart(2, "0")}`,
      reportText: `
        昨日の実績: プロジェクトA進行中
        今日の予定: テスト実施予定
        抱えている課題: ${mockExtractedKeywords
          .slice(memberIdx * 10, (memberIdx + 1) * 10)
          .map((kw) => kw.keyword)
          .join(", ")}
      `,
      submittedAt: new Date("2024-01-15T08:00:00Z"),
    }));

    // TextAnalysisServiceAdapterのスタブを作成
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue(mockExtractedKeywords),
      assessImpactScore: jest.fn().mockResolvedValue(65),
      classifyIssueSeverity: jest.fn().mockResolvedValue("medium"),
    };

    // ToolIntegrationConfigのスタブ
    const toolIntegrationConfig = {
      toolType: "jira" as const,
      baseUrl: "https://jira.example.com",
      apiKey: "test-api-key",
      projectKey: "PROJ",
    };

    // PriorityRuleSetのスタブ
    const priorityRules = {
      frequencyWeight: 0.5,
      impactWeight: 0.5,
      highThreshold: 70,
      mediumThreshold: 40,
    };

    // CategoryMappingのスタブ
    const categoryMappings = [
      {
        systemCategory: "bug",
        toolCategory: "Bug",
      },
      {
        systemCategory: "feature",
        toolCategory: "Story",
      },
      {
        systemCategory: "performance",
        toolCategory: "Task",
      },
    ];

    // NotificationServiceAdapterのスタブ
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: "sent",
        deliveredAt: new Date("2024-01-15T08:05:00Z"),
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sentCount: 10,
        failedCount: 0,
        pendingCount: 0,
      }),
    };

    const input = {
      extractedIssueData: mockExtractedKeywords.map((kw, idx) => ({
        issueId: `issue_${String(idx + 1).padStart(3, "0")}`,
        title: kw.keyword,
        description: `課題の詳細説明 ${idx + 1}`,
        sourceMemberId: memberReports[Math.floor(idx / 10)].memberId,
        extractedAt: new Date("2024-01-15T08:00:00Z"),
        frequency: kw.frequency,
      })),
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    const aiClient = {
      callValidationModel: jest
        .fn()
        .mockResolvedValue({
          validatedIssues: input.extractedIssueData.map((issue, idx) => ({
            issueId: issue.issueId,
            title: issue.title,
            priorityScore: Math.min(100, 40 + issue.frequency * 5),
            priorityRank:
              40 + issue.frequency * 5 >= 70
                ? ("high" as const)
                : 40 + issue.frequency * 5 >= 40
                  ? ("medium" as const)
                  : ("low" as const),
            category: "bug",
            validationStatus: "valid" as const,
          })),
        }),
      callIntegrationModel: jest.fn().mockResolvedValue({
        toolIssueIds: Array.from(
          { length: KEYWORD_LIMIT },
          (_, i) => `PROJ-${String(i + 1).padStart(4, "0")}`
        ),
        successCount: KEYWORD_LIMIT,
        failureCount: 0,
      }),
    };

    const result = await runTx5Imp1Agent(input, aiClient);

    // 検証1: 連携されたすべての課題データが重複なく登録されている
    expect(result.validatedIssues).toHaveLength(KEYWORD_LIMIT);
    const uniqueIssueIds = new Set(result.validatedIssues.map((i) => i.issueId));
    expect(uniqueIssueIds.size).toBe(KEYWORD_LIMIT);

    // 検証2: すべての課題が有効な状態で連携されている
    expect(result.validatedIssues.every((issue) => issue.validationStatus === "valid")).toBe(true);

    // 検証3: 各課題の優先度スコアが正確に計算されている
    result.validatedIssues.forEach((issue, idx) => {
      const sourceIssue = input.extractedIssueData[idx];
      const expectedScore = Math.min(100, 40 + sourceIssue.frequency * 5);
      expect(issue.priorityScore).toBe(expectedScore);
    });

    // 検証4: すべての課題データが元の日報テキストに対応している
    result.validatedIssues.forEach((issue) => {
      const sourceData = input.extractedIssueData.find((d) => d.issueId === issue.issueId);
      expect(sourceData).toBeDefined();
      if (sourceData) {
        expect(issue.title).toBe(sourceData.title);
      }
    });

    // 検証5: 既存ツール連携結果
    expect(result.integrationResult.toolIntegrationResult).toBeDefined();

    // 検証6: エグゼキューションサマリーで処理完了が記録されている
    expect(result.executionSummary.finalStatus).toBe("success");
    expect(result.executionSummary.processedIssueCount).toBe(KEYWORD_LIMIT);
    expect(result.executionSummary.duplicateDetectedCount).toBe(0);
  });
});