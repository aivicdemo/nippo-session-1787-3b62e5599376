import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx6Imp1Agent } from "../../src/agents/tx-6-imp-1/orchestrator";
import { type Tx6Imp1AiClient } from "../../src/agents/tx-6-imp-1/orchestrator";

const fetchMock = require("jest-fetch-mock");

describe("tx-6-imp-1: 日報収集から分析レポート生成までの自動実行", () => {
  let mockAiClient: Tx6Imp1AiClient;
  let auditLog: Array<{
    event: string;
    escalation_trigger?: string;
    action?: string;
    timestamp: Date;
    triggered_by_action?: string;
    critical_incidents?: Array<{
      content: string;
      category: string;
      severity: string;
    }>;
    context?: {
      submitted_by: string;
      report_date: string;
      extracted_issue: string;
    };
  }>;

  beforeEach(() => {
    fetchMock.resetMocks();
    auditLog = [];

    mockAiClient = {
      async action01CollectReports() {
        return {
          reports: [
            {
              reporter_id: "member_001",
              report_date: "2024-01-08",
              content: "通常の進捗報告",
              status: "submitted",
            },
            {
              reporter_id: "member_002",
              report_date: "2024-01-08",
              content: "データセンター火災により本番環境が停止",
              status: "submitted",
            },
            {
              reporter_id: "member_003",
              report_date: "2024-01-08",
              content: "顧客Aから法務訴訟の通知を受領",
              status: "submitted",
            },
            {
              reporter_id: "member_004",
              report_date: "2024-01-08",
              content: "API仕様変更に伴う軽微な対応",
              status: "submitted",
            },
            {
              reporter_id: "member_005",
              report_date: "2024-01-08",
              content: "定期メンテナンス完了",
              status: "submitted",
            },
            {
              reporter_id: "member_006",
              report_date: "2024-01-08",
              content: "セキュリティ脆弱性（CVSS 9.8）検出",
              status: "submitted",
            },
            {
              reporter_id: "member_007",
              report_date: "2024-01-08",
              content: "Q1予算削減に伴う人員調整開始",
              status: "submitted",
            },
            {
              reporter_id: "member_008",
              report_date: "2024-01-08",
              content: "マイナーバグ修正完了",
              status: "submitted",
            },
            {
              reporter_id: "member_009",
              report_date: "2024-01-08",
              content: "未提出",
              status: "not_submitted",
            },
            {
              reporter_id: "member_010",
              report_date: "2024-01-08",
              content: "ルーチン対応",
              status: "submitted",
            },
          ],
          unsubmitted_count: 1,
        };
      },

      async action02ExtractIssues(reports: any[]) {
        return {
          extracted_issues: [
            {
              issue_id: "issue_001",
              category: "infrastructure",
              content: "本番環境停止",
              reporter_id: "member_002",
              extracted_date: "2024-01-08",
              keywords: ["インシデント", "本番"],
              confidence: 0.98,
            },
            {
              issue_id: "issue_002",
              category: "legal",
              content: "顧客訴訟",
              reporter_id: "member_003",
              extracted_date: "2024-01-08",
              keywords: ["訴訟", "リスク"],
              confidence: 0.97,
            },
            {
              issue_id: "issue_003",
              category: "security",
              content: "セキュリティ脆弱性",
              reporter_id: "member_006",
              extracted_date: "2024-01-08",
              keywords: ["セキュリティ", "脆弱性"],
              confidence: 0.95,
            },
            {
              issue_id: "issue_004",
              category: "operations",
              content: "人員調整",
              reporter_id: "member_007",
              extracted_date: "2024-01-08",
              keywords: ["人員", "調整"],
              confidence: 0.85,
            },
            {
              issue_id: "issue_005",
              category: "routine",
              content: "軽微な仕様変更対応",
              reporter_id: "member_004",
              extracted_date: "2024-01-08",
              keywords: ["API", "対応"],
              confidence: 0.72,
            },
          ],
        };
      },

      async action03ClassifyAndTrend(issues: any[]) {
        return {
          classified_issues: [
            {
              issue_id: "issue_001",
              severity_level: "critical",
              classification: "重大インシデント",
              occurrence_count: 1,
            },
            {
              issue_id: "issue_002",
              severity_level: "critical",
              classification: "リスク案件",
              occurrence_count: 1,
            },
            {
              issue_id: "issue_003",
              severity_level: "high",
              classification: "リスク案件",
              occurrence_count: 1,
            },
            {
              issue_id: "issue_004",
              severity_level: "medium",
              classification: "通常課題",
              occurrence_count: 1,
            },
            {
              issue_id: "issue_005",
              severity_level: "low",
              classification: "通常課題",
              occurrence_count: 1,
            },
          ],
          trend_summary: {
            critical_detected: true,
            high_risk_detected: true,
            medium_issues_count: 1,
            low_issues_count: 1,
          },
        };
      },

      async action04ScoringPriority(classifiedIssues: any[]) {
        return {
          prioritized_issues: [
            {
              issue_id: "issue_001",
              priority_score: 98,
              priority_rank: "高",
              severity_flag: "critical_incident",
              impact_level: "system_down",
            },
            {
              issue_id: "issue_002",
              priority_score: 96,
              priority_rank: "高",
              severity_flag: "critical_incident",
              impact_level: "legal_risk",
            },
            {
              issue_id: "issue_003",
              priority_score: 92,
              priority_rank: "高",
              severity_flag: "high_risk",
              impact_level: "security_breach",
            },
            {
              issue_id: "issue_004",
              priority_score: 55,
              priority_rank: "中",
              severity_flag: "normal",
              impact_level: "operational",
            },
            {
              issue_id: "issue_005",
              priority_score: 28,
              priority_rank: "低",
              severity_flag: "normal",
              impact_level: "routine",
            },
          ],
          critical_escalation_detected: true,
          escalation_issues: [
            {
              issue_id: "issue_001",
              category: "infrastructure",
              content: "本番環境停止",
              severity: "critical_incident",
            },
            {
              issue_id: "issue_002",
              category: "legal",
              content: "顧客訴訟",
              severity: "critical_incident",
            },
            {
              issue_id: "issue_003",
              category: "security",
              content: "セキュリティ脆弱性",
              severity: "high_risk",
            },
          ],
        };
      },

      async action05GenerateReport(prioritizedIssues: any[]) {
        return {
          report_id: "report_20240115_001",
          generated_at: new Date("2024-01-15T09:00:00Z"),
          critical_incidents_count: 2,
          high_risk_count: 1,
          medium_issues_count: 1,
          low_issues_count: 1,
          report_content: {
            summary: "3件の重大課題を検出",
            critical_section: [
              {
                incident_id: "issue_001",
                title: "本番環境停止",
                details: "データセンター火災により本番環境が停止",
              },
              {
                incident_id: "issue_002",
                title: "顧客訴訟",
                details: "顧客Aから法務訴訟の通知を受領",
              },
            ],
            high_risk_section: [
              {
                incident_id: "issue_003",
                title: "セキュリティ脆弱性",
                details: "CVSS 9.8の脆弱性が検出されました",
              },
            ],
          },
          escalation_context: {
            critical_incidents: [
              {
                issue_id: "issue_001",
                content: "本番環境停止",
                category: "infrastructure",
                severity: "critical_incident",
                reporter_id: "member_002",
                report_date: "2024-01-08",
              },
              {
                issue_id: "issue_002",
                content: "顧客訴訟",
                category: "legal",
                severity: "critical_incident",
                reporter_id: "member_003",
                report_date: "2024-01-08",
              },
            ],
            high_risk_issues: [
              {
                issue_id: "issue_003",
                content: "セキュリティ脆弱性",
                category: "security",
                severity: "high_risk",
                reporter_id: "member_006",
                report_date: "2024-01-08",
              },
            ],
            processing_status: "action_05_completed",
            reason_for_handoff:
              "重大インシデント2件およびリスク案件1件が検出されたため、人の確認待ち状態に遷移します",
            timestamp: new Date("2024-01-15T09:00:00Z"),
            action_sequence_position: 5,
          },
        };
      },

      async action06SendReport(): Promise<never> {
        throw new Error("SHOULD_NOT_BE_CALLED");
      },

      async action07NotifyStakeholders(): Promise<never> {
        throw new Error("SHOULD_NOT_BE_CALLED");
      },
    };
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-114
  test("should pause at action 05 and trigger human handoff when critical incidents are detected", async () => {
    const input: any = {
      executionTimestamp: new Date("2024-01-15T09:00:00Z"),
      analysisStartDate: "2024-01-08",
      analysisEndDate: "2024-01-14",
      teamId: "team_001",
    };

    let escalationTriggered = false;
    let escalationContext: any = null;
    let processingStopped = false;

    const originalAction06 = mockAiClient.action06SendReport;
    const originalAction07 = mockAiClient.action07NotifyStakeholders;

    mockAiClient.action06SendReport = async () => {
      throw new Error(
        "action06SendReport should not be called when critical incidents are detected"
      );
    };

    mockAiClient.action07NotifyStakeholders = async () => {
      throw new Error(
        "action07NotifyStakeholders should not be called when critical incidents are detected"
      );
    };

    try {
      const result = await runTx6Imp1Agent(input, mockAiClient);

      if (
        result.escalationTriggered &&
        result.escalationContext.critical_incidents.length > 0
      ) {
        escalationTriggered = true;
        escalationContext = result.escalationContext;

        expect(result.processingStatus).toBe("paused_at_action_06");
        processingStopped = true;

        auditLog.push({
          event: "escalation_triggered",
          escalation_trigger: "critical_incident_detected",
          action: "paused_at_action_06",
          timestamp: new Date("2024-01-15T09:00:00Z"),
          triggered_by_action: "action_05",
          critical_incidents: result.escalationContext.critical_incidents.map(
            (inc: any) => ({
              content: inc.content,
              category: inc.category,
              severity: inc.severity,
            })
          ),
          context: {
            submitted_by: result.escalationContext.critical_incidents[0]
              .reporter_id,
            report_date: result.escalationContext.critical_incidents[0]
              .report_date,
            extracted_issue: result.escalationContext.critical_incidents[0]
              .content,
          },
        });
      }
    } catch (error: any) {
      if (error.message.includes("should not be called")) {
        throw error;
      }
    }

    expect(escalationTriggered).toBe(true);
    expect(processingStopped).toBe(true);

    expect(escalationContext).not.toBeNull();
    expect(escalationContext.critical_incidents).toHaveLength(2);
    expect(escalationContext.critical_incidents[0].issue_id).toBe("issue_001");
    expect(escalationContext.critical_incidents[0].content).toBe(
      "本番環境停止"
    );
    expect(escalationContext.critical_incidents[0].category).toBe(
      "infrastructure"
    );
    expect(escalationContext.critical_incidents[0].reporter_id).toBe(
      "member_002"
    );
    expect(escalationContext.critical_incidents[0].report_date).toBe(
      "2024-01-08"
    );

    expect(escalationContext.critical_incidents[1].issue_id).toBe("issue_002");
    expect(escalationContext.critical_incidents[1].content).toBe("顧客訴訟");
    expect(escalationContext.critical_incidents[1].category).toBe("legal");
    expect(escalationContext.critical_incidents[1].reporter_id).toBe(
      "member_003"
    );

    expect(escalationContext.high_risk_issues).toHaveLength(1);
    expect(escalationContext.high_risk_issues[0].issue_id).toBe("issue_003");
    expect(escalationContext.high_risk_issues[0].content).toBe(
      "セキュリティ脆弱性"
    );
    expect(escalationContext.high_risk_issues[0].severity).toBe("high_risk");

    expect(escalationContext.processing_status).toBe("action_05_completed");
    expect(escalationContext.action_sequence_position).toBe(5);
    expect(escalationContext.reason_for_handoff).toContain(
      "重大インシデント2件"
    );
    expect(escalationContext.reason_for_handoff).toContain("人の確認待ち状態");

    expect(auditLog).toHaveLength(1);
    expect(auditLog[0].escalation_trigger).toBe("critical_incident_detected");
    expect(auditLog[0].action).toBe("paused_at_action_06");
    expect(auditLog[0].triggered_by_action).toBe("action_05");
    expect(auditLog[0].critical_incidents).toHaveLength(2);
    expect(auditLog[0].critical_incidents![0].severity).toBe(
      "critical_incident"
    );
    expect(auditLog[0].context!.submitted_by).toBe("member_002");
    expect(auditLog[0].context!.report_date).toBe("2024-01-08");
    expect(auditLog[0].context!.extracted_issue).toBe("本番環境停止");
  });
});