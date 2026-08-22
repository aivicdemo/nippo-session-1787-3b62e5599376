import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
import type {
  Tx2Imp1AgentInput,
  Tx2Imp1AgentOutput,
} from "../../src/agents/tx-2-imp-1/orchestrator";
import type { Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";

interface MockAuditEvent {
  escalation_reason: string;
  timestamp: string;
  actor: string;
  target_actor: string;
  status: string;
}

interface MockEmailCall {
  method: string;
  args: unknown[];
}

interface MockDailyReportData {
  memberId: string;
  memberName: string;
  achievements: string;
  issues: string;
  risks: string;
}

interface MockHumanReviewData {
  unified_report_content: MockDailyReportData[];
  uncertain_priority_tasks: Array<{
    task_id: string;
    description: string;
    confidence_score: number;
  }>;
  extraction_basis: string;
  confidence_scores: number[];
}

describe("tx-2-imp-1: 日報収集から課題抽出・配信までの自律実行", () => {
  let mockAuditLog: MockAuditEvent[] = [];
  let mockEmailCalls: MockEmailCall[] = [];
  let mockHumanReviewHandoff: MockHumanReviewData | null = null;

  const createMockAiClient = (
    priorityConfidenceScores: number[]
  ): Tx2Imp1AiClient => ({
    action01_receiveReports: async () => {
      return {
        received_count: 10,
        reports: [
          {
            memberId: "M001",
            memberName: "Alice",
            achievements:
              "Feature A completed successfully and deployed to production",
            issues: "Database performance was slow during peak hours",
            risks: "No significant risks identified",
          },
          {
            memberId: "M002",
            memberName: "Bob",
            achievements: "Code review completed for 5 pull requests",
            issues: "Something unclear happened with the API",
            risks: "Possible connectivity issue",
          },
          {
            memberId: "M003",
            memberName: "Carol",
            achievements: "Documentation updated for new API endpoints",
            issues: "There might be a problem somewhere in the system",
            risks: "Unknown potential risk detected",
          },
          {
            memberId: "M004",
            memberName: "Dave",
            achievements: "Unit tests increased coverage to 85%",
            issues: "Network latency affecting CI/CD pipeline",
            risks: "No risks",
          },
          {
            memberId: "M005",
            memberName: "Eve",
            achievements: "Security audit completed for auth module",
            issues: "Minor authentication delay in staging environment",
            risks: "Staging environment risk only",
          },
          {
            memberId: "M006",
            memberName: "Frank",
            achievements: "Performance optimization implemented",
            issues: "Memory usage increase after deployment",
            risks: "Potential memory leak in production",
          },
          {
            memberId: "M007",
            memberName: "Grace",
            achievements: "Infrastructure scaling completed",
            issues: "Load balancer configuration needs review",
            risks: "No immediate risks",
          },
          {
            memberId: "M008",
            memberName: "Henry",
            achievements: "Backup system tested and verified",
            issues: "Backup process took longer than expected",
            risks: "Recovery time objective may be exceeded",
          },
          {
            memberId: "M009",
            memberName: "Ivy",
            achievements: "Monitoring dashboard implemented",
            issues: "Dashboard occasionally becomes unresponsive",
            risks: "Monitoring blind spots possible",
          },
          {
            memberId: "M010",
            memberName: "Jack",
            achievements: "Release notes prepared for v2.1",
            issues: "Release notes unclear about breaking changes",
            risks: "User confusion during upgrade",
          },
        ] as MockDailyReportData[],
      };
    },

    action02_unifyFormat: async (reports) => {
      return {
        unified_reports: reports.map((r) => ({
          ...r,
          formatted_timestamp: "2024-01-15T08:00:00Z",
        })),
      };
    },

    action03_extractIssues: async (unifiedReports) => {
      return {
        extracted_issues: [
          {
            task_id: "TASK001",
            source_member: "M001",
            description: "Database performance was slow during peak hours",
            category: "performance",
            raw_extraction: "Database performance was slow during peak hours",
          },
          {
            task_id: "TASK002",
            source_member: "M002",
            description: "Something unclear happened with the API",
            category: "unknown",
            raw_extraction: "Something unclear happened with the API",
          },
          {
            task_id: "TASK003",
            source_member: "M003",
            description: "There might be a problem somewhere in the system",
            category: "unknown",
            raw_extraction: "There might be a problem somewhere in the system",
          },
          {
            task_id: "TASK004",
            source_member: "M004",
            description: "Network latency affecting CI/CD pipeline",
            category: "infrastructure",
            raw_extraction: "Network latency affecting CI/CD pipeline",
          },
          {
            task_id: "TASK005",
            source_member: "M006",
            description: "Memory usage increase after deployment",
            category: "performance",
            raw_extraction: "Memory usage increase after deployment",
          },
          {
            task_id: "TASK006",
            source_member: "M008",
            description: "Backup process took longer than expected",
            category: "infrastructure",
            raw_extraction: "Backup process took longer than expected",
          },
          {
            task_id: "TASK007",
            source_member: "M009",
            description: "Dashboard occasionally becomes unresponsive",
            category: "performance",
            raw_extraction: "Dashboard occasionally becomes unresponsive",
          },
          {
            task_id: "TASK008",
            source_member: "M010",
            description: "Release notes unclear about breaking changes",
            category: "documentation",
            raw_extraction: "Release notes unclear about breaking changes",
          },
        ],
      };
    },

    action04_prioritizeIssues: async (extractedIssues) => {
      const priorityResults = extractedIssues.map((issue, index) => ({
        task_id: issue.task_id,
        priority_level: index < priorityConfidenceScores.length ? "high" : "low",
        confidence_score:
          index < priorityConfidenceScores.length
            ? priorityConfidenceScores[index]
            : 0.8,
        reasoning: `Priority determined based on category: ${issue.category}`,
      }));
      return { prioritized_issues: priorityResults };
    },

    action05_generateEmail: async () => {
      return {
        email_content:
          "Subject: Daily Report Summary\n\nPrioritized Issues:\n...",
        recipient: "manager@example.com",
      };
    },

    action06_sendEmail: async () => {
      return { send_status: "sent", timestamp: "2024-01-15T08:15:00Z" };
    },
  });

  beforeEach(() => {
    mockAuditLog = [];
    mockEmailCalls = [];
    mockHumanReviewHandoff = null;
  });

  afterEach(() => {
    mockAuditLog = [];
    mockEmailCalls = [];
    mockHumanReviewHandoff = null;
  });

  // SCEN-048
  test("should escalate to human review when priority confidence is below 0.45 without sending confirmation email", async () => {
    const confidenceScoresWithUncertainty = [0.42, 0.43, 0.44, 0.8, 0.9];

    const mockAiClient = createMockAiClient(confidenceScoresWithUncertainty);

    const input: Tx2Imp1AgentInput = {
      executionTimestamp: new Date("2024-01-15T08:00:00Z"),
      teamId: "TEAM001",
      reportingDeadline: new Date("2024-01-15T09:00:00Z"),
      managerEmail: "manager@example.com",
    };

    const mockSendEmail = jest.fn(async () => {
      mockEmailCalls.push({
        method: "sendConfirmationEmail",
        args: ["manager@example.com"],
      });
      return { send_status: "sent" };
    });

    const mockRecordAuditLog = jest.fn((event: MockAuditEvent) => {
      mockAuditLog.push(event);
    });

    const mockHandoffToHuman = jest.fn((data: MockHumanReviewData) => {
      mockHumanReviewHandoff = data;
    });

    await runTx2Imp1Agent(input, {
      ...mockAiClient,
      _internal_sendEmail: mockSendEmail,
      _internal_recordAuditLog: mockRecordAuditLog,
      _internal_handoffToHuman: mockHandoffToHuman,
    } as any);

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockEmailCalls).toHaveLength(0);

    expect(mockRecordAuditLog).toHaveBeenCalled();
    const auditEvent = mockAuditLog.find(
      (e) => e.escalation_reason === "priority_uncertainty"
    );
    expect(auditEvent).toBeDefined();
    expect(auditEvent).toMatchObject({
      escalation_reason: "priority_uncertainty",
      actor: "ai_agent_tx2_imp1",
      target_actor: "department_manager",
      status: "awaiting_human_decision",
    });
    expect(auditEvent?.timestamp).toBeDefined();

    expect(mockHandoffToHuman).toHaveBeenCalled();
    expect(mockHumanReviewHandoff).toBeDefined();

    expect(mockHumanReviewHandoff?.unified_report_content).toHaveLength(10);
    expect(mockHumanReviewHandoff?.unified_report_content[0]).toMatchObject({
      memberId: "M001",
      memberName: "Alice",
    });

    expect(mockHumanReviewHandoff?.uncertain_priority_tasks).toBeDefined();
    expect(mockHumanReviewHandoff?.uncertain_priority_tasks.length).toBeGreaterThan(
      0
    );
    const uncertainTasks = mockHumanReviewHandoff?.uncertain_priority_tasks ?? [];
    uncertainTasks.forEach((task) => {
      expect(task.confidence_score).toBeLessThan(0.45);
    });

    expect(mockHumanReviewHandoff?.extraction_basis).toBeDefined();
    expect(mockHumanReviewHandoff?.confidence_scores).toContain(0.42);
    expect(mockHumanReviewHandoff?.confidence_scores).toContain(0.43);
    expect(mockHumanReviewHandoff?.confidence_scores).toContain(0.44);
  });
});