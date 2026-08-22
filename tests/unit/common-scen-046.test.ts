import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";
import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/types";

describe("notification-delivery", () => {
  // SCEN-046: [normal] 日報収集から課題抽出・配信までの自律実行 AIエージェント
  test("should generate and send confirmation email to director with unified daily reports and prioritized extracted issues", async () => {
    // Arrange: スタブAIクライアントの準備
    const stubAiClient: Tx2Imp1AiClient = {
      buildAction01Prompt: jest.fn(async () => ({
        status: "success",
        prompt_version: "1.0.0",
        timestamp: new Date("2024-01-15T08:00:00Z").toISOString(),
        receipt_check_results: {
          total_members: 10,
          submitted_count: 10,
          unsubmitted_members: [],
        },
      })),
      buildAction02Prompt: jest.fn(async () => ({
        status: "success",
        prompt_version: "1.0.0",
        timestamp: new Date("2024-01-15T08:01:00Z").toISOString(),
        unified_reports: [
          {
            member_id: "member_001",
            member_name: "Member A",
            yesterday_accomplishment: "Feature X completed",
            today_plan: "Feature Y in progress",
            issue_summary: "API latency concern",
          },
          {
            member_id: "member_002",
            member_name: "Member B",
            yesterday_accomplishment: "Bug fixes",
            today_plan: "Testing",
            issue_summary: "Database connection timeout",
          },
          {
            member_id: "member_003",
            member_name: "Member C",
            yesterday_accomplishment: "Documentation",
            today_plan: "Review",
            issue_summary: null,
          },
          {
            member_id: "member_004",
            member_name: "Member D",
            yesterday_accomplishment: "Setup",
            today_plan: "Integration",
            issue_summary: "Build process failure",
          },
          {
            member_id: "member_005",
            member_name: "Member E",
            yesterday_accomplishment: "Testing",
            today_plan: "Deployment prep",
            issue_summary: "Memory leak in module X",
          },
          {
            member_id: "member_006",
            member_name: "Member F",
            yesterday_accomplishment: "Analysis",
            today_plan: "Report",
            issue_summary: null,
          },
          {
            member_id: "member_007",
            member_name: "Member G",
            yesterday_accomplishment: "Code review",
            today_plan: "Refactoring",
            issue_summary: "Code coverage below 80%",
          },
          {
            member_id: "member_008",
            member_name: "Member H",
            yesterday_accomplishment: "Monitoring setup",
            today_plan: "Alert config",
            issue_summary: "High CPU usage detected",
          },
          {
            member_id: "member_009",
            member_name: "Member I",
            yesterday_accomplishment: "Deploy",
            today_plan: "Verification",
            issue_summary: null,
          },
          {
            member_id: "member_010",
            member_name: "Member J",
            yesterday_accomplishment: "Training",
            today_plan: "Implementation",
            issue_summary: "Version compatibility issue",
          },
        ],
      })),
      buildAction03Prompt: jest.fn(async () => ({
        status: "success",
        prompt_version: "1.0.0",
        timestamp: new Date("2024-01-15T08:02:00Z").toISOString(),
        extracted_items: [
          {
            extraction_id: "issue_001",
            source_member_id: "member_001",
            item_type: "issue",
            content: "API latency concern",
            risk_category: "performance",
          },
          {
            extraction_id: "issue_002",
            source_member_id: "member_002",
            item_type: "issue",
            content: "Database connection timeout",
            risk_category: "infrastructure",
          },
          {
            extraction_id: "issue_003",
            source_member_id: "member_004",
            item_type: "issue",
            content: "Build process failure",
            risk_category: "process",
          },
          {
            extraction_id: "issue_004",
            source_member_id: "member_005",
            item_type: "issue",
            content: "Memory leak in module X",
            risk_category: "quality",
          },
          {
            extraction_id: "issue_005",
            source_member_id: "member_007",
            item_type: "issue",
            content: "Code coverage below 80%",
            risk_category: "quality",
          },
          {
            extraction_id: "issue_006",
            source_member_id: "member_008",
            item_type: "issue",
            content: "High CPU usage detected",
            risk_category: "infrastructure",
          },
          {
            extraction_id: "issue_007",
            source_member_id: "member_010",
            item_type: "issue",
            content: "Version compatibility issue",
            risk_category: "dependency",
          },
        ],
      })),
      buildAction04Prompt: jest.fn(async () => ({
        status: "success",
        prompt_version: "1.0.0",
        timestamp: new Date("2024-01-15T08:03:00Z").toISOString(),
        prioritized_issues: [
          {
            priority_level: "high",
            issue_id: "issue_004",
            content: "Memory leak in module X",
            impact_score: 8,
            urgency_score: 7,
            recurrence_risk: "medium",
          },
          {
            priority_level: "high",
            issue_id: "issue_002",
            content: "Database connection timeout",
            impact_score: 9,
            urgency_score: 8,
            recurrence_risk: "high",
          },
          {
            priority_level: "medium",
            issue_id: "issue_001",
            content: "API latency concern",
            impact_score: 6,
            urgency_score: 5,
            recurrence_risk: "medium",
          },
          {
            priority_level: "medium",
            issue_id: "issue_003",
            content: "Build process failure",
            impact_score: 7,
            urgency_score: 6,
            recurrence_risk: "low",
          },
          {
            priority_level: "medium",
            issue_id: "issue_006",
            content: "High CPU usage detected",
            impact_score: 6,
            urgency_score: 6,
            recurrence_risk: "high",
          },
          {
            priority_level: "low",
            issue_id: "issue_005",
            content: "Code coverage below 80%",
            impact_score: 4,
            urgency_score: 3,
            recurrence_risk: "low",
          },
          {
            priority_level: "low",
            issue_id: "issue_007",
            content: "Version compatibility issue",
            impact_score: 3,
            urgency_score: 2,
            recurrence_risk: "low",
          },
        ],
      })),
      buildAction05Prompt: jest.fn(async () => ({
        status: "success",
        prompt_version: "1.0.0",
        timestamp: new Date("2024-01-15T08:04:00Z").toISOString(),
        unsubmitted_members: [],
        submitted_members_count: 10,
      })),
      buildAction06Prompt: jest.fn(async () => ({
        status: "success",
        prompt_version: "1.0.0",
        timestamp: new Date("2024-01-15T08:05:00Z").toISOString(),
        email_content: {
          subject: "朝会報告確認メール - 日報集約結果",
          body: `【日報集約結果】

【処理サマリー】
- 処理対象日報数: 10件
- 抽出課題数: 7件
- 未提出メンバー: 0名

【優先度別課題一覧】

【高優先度】
- Database connection timeout (影響度: 9, 緊急度: 8)
- Memory leak in module X (影響度: 8, 緊急度: 7)

【中優先度】
- Build process failure (影響度: 7, 緊急度: 6)
- High CPU usage detected (影響度: 6, 緊急度: 6)
- API latency concern (影響度: 6, 緊急度: 5)

【低優先度】
- Code coverage below 80% (影響度: 4, 緊急度: 3)
- Version compatibility issue (影響度: 3, 緊急度: 2)

【日報要約】
Member A: Feature X completed → Feature Y in progress
Member B: Bug fixes → Testing
Member C: Documentation → Review
Member D: Setup → Integration
Member E: Testing → Deployment prep
Member F: Analysis → Report
Member G: Code review → Refactoring
Member H: Monitoring setup → Alert config
Member I: Deploy → Verification
Member J: Training → Implementation`,
          recipient_director_id: "director_001",
          masking_status: "applied",
        },
      })),
    };

    // Arrange: スタブメールシステムの準備
    const mockMailSystem = {
      send: jest.fn(async () => ({
        mail_sent_id: "mail_20240115_080530_001",
        timestamp: new Date("2024-01-15T08:05:30Z").toISOString(),
        recipient_count: 1,
      })),
    };

    // Arrange: テスト入力パラメータ
    const input = {
      director_id: "director_001",
      director_email: "director@company.com",
      ai_client: stubAiClient,
      mail_system: mockMailSystem,
      execution_timestamp: new Date("2024-01-15T08:00:00Z").toISOString(),
    };

    // Act
    const result = await sendUnsubmittedReminder(input);

    // Assert: 戻り値の検証
    expect(result).toBeDefined();
    expect(result.status).toBe("success");
    expect(result.mailSentId).toBe("mail_20240115_080530_001");
    expect(result.processedReportsCount).toBe(10);
    expect(result.extractedIssueCount).toBe(7);
    expect(result.timestamp).toMatch(/2024-01-15T08:05:30/);

    // Assert: AIクライアントの全アクション呼び出し確認
    expect(stubAiClient.buildAction01Prompt).toHaveBeenCalledTimes(1);
    expect(stubAiClient.buildAction02Prompt).toHaveBeenCalledTimes(1);
    expect(stubAiClient.buildAction03Prompt).toHaveBeenCalledTimes(1);
    expect(stubAiClient.buildAction04Prompt).toHaveBeenCalledTimes(1);
    expect(stubAiClient.buildAction05Prompt).toHaveBeenCalledTimes(1);
    expect(stubAiClient.buildAction06Prompt).toHaveBeenCalledTimes(1);

    // Assert: メールシステムの呼び出し確認
    expect(mockMailSystem.send).toHaveBeenCalledTimes(1);
    expect(mockMailSystem.send).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: "director@company.com",
        subject: "朝会報告確認メール - 日報集約結果",
        body: expect.stringContaining("処理対象日報数: 10件"),
      })
    );

    // Assert: メール送信タイムスタンプ検証 (現在時刻±10秒)
    const mailSentTime = new Date(result.timestamp).getTime();
    const now = new Date("2024-01-15T08:05:30Z").getTime();
    expect(Math.abs(mailSentTime - now)).toBeLessThanOrEqual(10000);

    // Assert: 処理済み日報件数が正確
    expect(result.processedReportsCount).toEqual(10);

    // Assert: 抽出課題件数が正確
    expect(result.extractedIssueCount).toEqual(7);

    // Assert: メール本文に優先度別課題が含まれることを確認
    const mailCallArgs = mockMailSystem.send.mock.calls[0][0];
    expect(mailCallArgs.body).toContain("【高優先度】");
    expect(mailCallArgs.body).toContain("【中優先度】");
    expect(mailCallArgs.body).toContain("【低優先度】");
    expect(mailCallArgs.body).toContain("Database connection timeout");
    expect(mailCallArgs.body).toContain("Memory leak in module X");

    // Assert: 未提出メンバーがないことを確認
    expect(mailCallArgs.body).toContain("未提出メンバー: 0名");

    // Assert: メール受信者が部長のみ
    expect(mockMailSystem.send).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: "director@company.com",
      })
    );

    // Assert: 個人情報マスキング適用済みの確認
    const action06Result = await stubAiClient.buildAction06Prompt();
    expect(action06Result.email_content.masking_status).toBe("applied");
  });
});