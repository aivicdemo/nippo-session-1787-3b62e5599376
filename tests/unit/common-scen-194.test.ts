import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("sendUnsubmittedReminder", () => {
  // SCEN-194: [normal] 日報収集・確認・催促の自動化エージェント - 通常案件を人の都度承認なしで最後まで完了する
  test("should execute all 7 actions in sequence for unsubmitted member reminders with audit trail", async () => {
    const mockAiClient = {
      action01_getSubmissionStatus: jest.fn().mockResolvedValue({
        timestamp: "2024-01-15T09:00:00Z",
        totalMembers: 10,
        submittedCount: 7,
        unsubmittedCount: 3,
        submittedMembers: [
          { id: "M001", name: "Alice", submittedAt: "2024-01-15T08:30:00Z" },
          { id: "M002", name: "Bob", submittedAt: "2024-01-15T08:45:00Z" },
          { id: "M003", name: "Carol", submittedAt: "2024-01-15T08:15:00Z" },
          { id: "M004", name: "Dave", submittedAt: "2024-01-15T08:50:00Z" },
          { id: "M005", name: "Eve", submittedAt: "2024-01-15T08:20:00Z" },
          { id: "M006", name: "Frank", submittedAt: "2024-01-15T08:40:00Z" },
          { id: "M007", name: "Grace", submittedAt: "2024-01-15T08:35:00Z" },
        ],
        unsubmittedMembers: [
          { id: "M008", name: "Henry", deadline: "2024-01-15T09:00:00Z" },
          { id: "M009", name: "Iris", deadline: "2024-01-15T09:00:00Z" },
          { id: "M010", name: "Jack", deadline: "2024-01-15T09:00:00Z" },
        ],
      }),

      action02_sendReminderNotifications: jest
        .fn()
        .mockResolvedValue({
          action_id: "ACTION_02",
          remindersSent: 3,
          recipients: [
            { member_id: "M008", name: "Henry", message_id: "MSG_M008_001" },
            { member_id: "M009", name: "Iris", message_id: "MSG_M009_001" },
            { member_id: "M010", name: "Jack", message_id: "MSG_M010_001" },
          ],
          timestamp: "2024-01-15T09:01:00Z",
        }),

      action03_extractIssues: jest.fn().mockResolvedValue({
        action_id: "ACTION_03",
        extracted_issues_count: 12,
        issues: [
          {
            issue_id: "ISS001",
            member_id: "M001",
            content: "Database connection timeout",
            category: "infrastructure",
          },
          {
            issue_id: "ISS002",
            member_id: "M002",
            content: "Memory leak in cache module",
            category: "performance",
          },
          {
            issue_id: "ISS003",
            member_id: "M003",
            content: "API response delay",
            category: "performance",
          },
          {
            issue_id: "ISS004",
            member_id: "M004",
            content: "Database connection timeout",
            category: "infrastructure",
          },
          {
            issue_id: "ISS005",
            member_id: "M005",
            content: "Deployment script failure",
            category: "deployment",
          },
          {
            issue_id: "ISS006",
            member_id: "M006",
            content: "API response delay",
            category: "performance",
          },
          {
            issue_id: "ISS007",
            member_id: "M007",
            content: "Authentication token expiry",
            category: "security",
          },
          {
            issue_id: "ISS008",
            member_id: "M001",
            content: "Memory leak in cache module",
            category: "performance",
          },
          {
            issue_id: "ISS009",
            member_id: "M002",
            content: "Build process timeout",
            category: "deployment",
          },
          {
            issue_id: "ISS010",
            member_id: "M003",
            content: "Code review bottleneck",
            category: "process",
          },
          {
            issue_id: "ISS011",
            member_id: "M005",
            content: "Database connection timeout",
            category: "infrastructure",
          },
          {
            issue_id: "ISS012",
            member_id: "M007",
            content: "Test coverage gap",
            category: "quality",
          },
        ],
        timestamp: "2024-01-15T09:02:00Z",
      }),

      action04_searchHistoricalMatches: jest.fn().mockResolvedValue({
        action_id: "ACTION_04",
        matches_found: 8,
        matched_issues: [
          {
            current_issue_id: "ISS001",
            similar_past_issues: [
              {
                past_issue_id: "PAST_ISS_042",
                similarity_score: 0.92,
                resolution_method: "Added connection pooling",
                resolved_at: "2023-12-20T14:30:00Z",
              },
              {
                past_issue_id: "PAST_ISS_088",
                similarity_score: 0.85,
                resolution_method: "Increased timeout threshold",
                resolved_at: "2023-11-15T10:00:00Z",
              },
            ],
          },
          {
            current_issue_id: "ISS002",
            similar_past_issues: [
              {
                past_issue_id: "PAST_ISS_156",
                similarity_score: 0.88,
                resolution_method: "Implemented cache eviction policy",
                resolved_at: "2023-10-25T09:15:00Z",
              },
            ],
          },
          {
            current_issue_id: "ISS003",
            similar_past_issues: [
              {
                past_issue_id: "PAST_ISS_201",
                similarity_score: 0.9,
                resolution_method: "Optimized database queries",
                resolved_at: "2023-12-05T11:45:00Z",
              },
            ],
          },
          {
            current_issue_id: "ISS004",
            similar_past_issues: [
              {
                past_issue_id: "PAST_ISS_042",
                similarity_score: 0.91,
                resolution_method: "Added connection pooling",
                resolved_at: "2023-12-20T14:30:00Z",
              },
            ],
          },
          {
            current_issue_id: "ISS006",
            similar_past_issues: [
              {
                past_issue_id: "PAST_ISS_201",
                similarity_score: 0.87,
                resolution_method: "Optimized database queries",
                resolved_at: "2023-12-05T11:45:00Z",
              },
            ],
          },
          {
            current_issue_id: "ISS008",
            similar_past_issues: [
              {
                past_issue_id: "PAST_ISS_156",
                similarity_score: 0.86,
                resolution_method: "Implemented cache eviction policy",
                resolved_at: "2023-10-25T09:15:00Z",
              },
            ],
          },
          {
            current_issue_id: "ISS011",
            similar_past_issues: [
              {
                past_issue_id: "PAST_ISS_042",
                similarity_score: 0.89,
                resolution_method: "Added connection pooling",
                resolved_at: "2023-12-20T14:30:00Z",
              },
            ],
          },
          {
            current_issue_id: "ISS012",
            similar_past_issues: [
              {
                past_issue_id: "PAST_ISS_312",
                similarity_score: 0.83,
                resolution_method: "Enhanced test framework automation",
                resolved_at: "2023-09-18T16:20:00Z",
              },
            ],
          },
        ],
        timestamp: "2024-01-15T09:03:00Z",
      }),

      action05_prioritizeIssues: jest.fn().mockResolvedValue({
        action_id: "ACTION_05",
        summary_id: "SUMMARY_20240115_001",
        prioritized_issues: [
          {
            issue_id: "ISS001",
            priority: "high",
            priority_score: 8.5,
            reason: "Critical infrastructure issue affecting multiple services",
            estimated_impact: "5 affected members",
          },
          {
            issue_id: "ISS004",
            priority: "high",
            priority_score: 8.2,
            reason: "Duplicate of ISS001, infrastructure priority",
            estimated_impact: "2 affected members",
          },
          {
            issue_id: "ISS011",
            priority: "high",
            priority_score: 8.1,
            reason: "Recurrence of known issue, infrastructure priority",
            estimated_impact: "1 affected member",
          },
          {
            issue_id: "ISS002",
            priority: "medium",
            priority_score: 6.8,
            reason: "Performance degradation in cache layer",
            estimated_impact: "2 affected members",
          },
          {
            issue_id: "ISS003",
            priority: "medium",
            priority_score: 6.7,
            reason: "API latency issue, performance impact",
            estimated_impact: "2 affected members",
          },
          {
            issue_id: "ISS006",
            priority: "medium",
            priority_score: 6.5,
            reason: "Recurrence of API delay issue",
            estimated_impact: "1 affected member",
          },
          {
            issue_id: "ISS008",
            priority: "medium",
            priority_score: 6.6,
            reason: "Memory leak in performance-critical module",
            estimated_impact: "1 affected member",
          },
          {
            issue_id: "ISS005",
            priority: "low",
            priority_score: 4.2,
            reason: "Deployment tooling issue, isolated impact",
            estimated_impact: "1 affected member",
          },
          {
            issue_id: "ISS007",
            priority: "low",
            priority_score: 3.9,
            reason: "Security token management, localized impact",
            estimated_impact: "1 affected member",
          },
          {
            issue_id: "ISS009",
            priority: "low",
            priority_score: 3.8,
            reason: "Build infrastructure, non-critical",
            estimated_impact: "1 affected member",
          },
          {
            issue_id: "ISS010",
            priority: "low",
            priority_score: 3.5,
            reason: "Process bottleneck, manageable with current resources",
            estimated_impact: "1 affected member",
          },
          {
            issue_id: "ISS012",
            priority: "low",
            priority_score: 3.4,
            reason: "Test coverage gap, quality improvement",
            estimated_impact: "1 affected member",
          },
        ],
        timestamp: "2024-01-15T09:04:00Z",
      }),

      action06_distributeMorningBriefing: jest.fn().mockResolvedValue({
        action_id: "ACTION_06",
        briefing_id: "BRIEF_20240115_001",
        director_email: "director@company.example.com",
        delivery_timestamp: "2024-01-15T09:05:00Z",
        briefing_payload: {
          submission_status: "7/10",
          unsubmitted_reminder_targets: 3,
          unsubmitted_member_names: ["Henry", "Iris", "Jack"],
          extracted_issues_count: 12,
          unique_issues_count: 10,
          high_priority_count: 3,
          medium_priority_count: 4,
          low_priority_count: 5,
          recurring_issue_count: 3,
          critical_infrastructure_issues: [
            {
              issue_id: "ISS001",
              title: "Database connection timeout",
              priority: "high",
              priority_score: 8.5,
              affected_members: 5,
              past_resolution: "Added connection pooling",
            },
          ],
          recommended_action_summary:
            "Address 3 high-priority infrastructure issues immediately",
        },
        message_id: "MSG_BRIEF_20240115_001",
      }),

      action07_prepareReferenceForNextReport: jest.fn().mockResolvedValue({
        action_id: "ACTION_07",
        reference_prepared: true,
        prepared_items_count: 8,
        reference_data: {
          matching_history: [
            {
              issue_type: "infrastructure",
              past_resolutions: [
                {
                  resolution: "Added connection pooling",
                  effectiveness: "high",
                  applied_date: "2023-12-20",
                },
                {
                  resolution: "Increased timeout threshold",
                  effectiveness: "medium",
                  applied_date: "2023-11-15",
                },
              ],
            },
            {
              issue_type: "performance",
              past_resolutions: [
                {
                  resolution: "Implemented cache eviction policy",
                  effectiveness: "high",
                  applied_date: "2023-10-25",
                },
                {
                  resolution: "Optimized database queries",
                  effectiveness: "high",
                  applied_date: "2023-12-05",
                },
              ],
            },
            {
              issue_type: "deployment",
              past_resolutions: [],
            },
            {
              issue_type: "security",
              past_resolutions: [],
            },
            {
              issue_type: "process",
              past_resolutions: [],
            },
            {
              issue_type: "quality",
              past_resolutions: [
                {
                  resolution: "Enhanced test framework automation",
                  effectiveness: "medium",
                  applied_date: "2023-09-18",
                },
              ],
            },
          ],
          available_for_next_report: true,
          last_updated: "2024-01-15T09:06:00Z",
        },
        timestamp: "2024-01-15T09:06:00Z",
      }),
    };

    const mockLogger = {
      log: jest.fn(),
      events: [] as Array<{
        timestamp: string;
        event_type: string;
        event_id: string;
      }>,
    };

    const mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue({ success: true }),
      sentEmails: [] as Array<{
        recipient: string;
        subject: string;
        type: string;
        sent_at: string;
      }>,
    };

    mockLogger.log = jest.fn((event_type: string) => {
      mockLogger.events.push({
        timestamp: new Date().toISOString(),
        event_type,
        event_id: `EVT_${mockLogger.events.length + 1}`,
      });
    });

    mockEmailService.sendEmail = jest.fn(async (recipient: string) => {
      mockEmailService.sentEmails.push({
        recipient,
        subject:
          recipient === "director@company.example.com"
            ? "Morning Briefing"
            : "Submission Reminder",
        type:
          recipient === "director@company.example.com"
            ? "director_briefing"
            : "member_reminder",
        sent_at: new Date().toISOString(),
      });
      return { success: true };
    });

    const result = await sendUnsubmittedReminder(mockAiClient, {
      logEvent: mockLogger.log,
      sendEmail: mockEmailService.sendEmail,
    });

    expect(result.success).toBe(true);
    expect(result.actions_executed).toBe(7);
    expect(result.actions).toHaveLength(7);

    expect(result.actions[0].action_id).toBe("ACTION_01");
    expect(result.actions[0].submission_status).toEqual({
      submitted_count: 7,
      unsubmitted_count: 3,
      total_members: 10,
    });

    expect(result.actions[1].action_id).toBe("ACTION_02");
    expect(result.actions[1].reminders_sent).toBe(3);
    expect(result.actions[1].recipient_count).toBe(3);

    expect(result.actions[2].action_id).toBe("ACTION_03");
    expect(result.actions[2].extracted_issues_count).toBe(12);

    expect(result.actions[3].action_id).toBe("ACTION_04");
    expect(result.actions[3].matches_found).toBe(8);

    expect(result.actions[4].action_id).toBe("ACTION_05");
    expect(result.actions[4].prioritized_issues_count).toBe(12);
    expect(result.actions[4].high_priority_count).toBe(3);
    expect(result.actions[4].medium_priority_count).toBe(4);
    expect(result.actions[4].low_priority_count).toBe(5);

    expect(result.actions[5].action_id).toBe("ACTION_06");
    expect(result.actions[5].director_notified).toBe(true);
    expect(result.actions[5].briefing_payload.submission_status).toBe("7/10");
    expect(result.actions[5].briefing_payload.unsubmitted_reminder_targets).toBe(
      3
    );
    expect(result.actions[5].briefing_payload.extracted_issues_count).toBe(12);

    expect(result.actions[6].action_id).toBe("ACTION_07");
    expect(result.actions[6].reference_prepared).toBe(true);
    expect(result.actions[6].prepared_items_count).toBe(8);

    expect(mockLogger.events.some((e) => e.event_type === "AGENT_START")).toBe(
      true
    );
    expect(
      mockLogger.events.some((e) => e.event_type === "ACTION_01_COMPLETED")
    ).toBe(true);
    expect(
      mockLogger.events.some((e) => e.event_type === "ACTION_02_COMPLETED")
    ).toBe(true);
    expect(
      mockLogger.events.some((e) => e.event_type === "ACTION_03_COMPLETED")
    ).toBe(true);
    expect(
      mockLogger.events.some((e) => e.event_type === "ACTION_04_COMPLETED")
    ).toBe(true);
    expect(
      mockLogger.events.some((e) => e.event_type === "ACTION_05_COMPLETED")
    ).toBe(true);
    expect(
      mockLogger.events.some((e) => e.event_type === "ACTION_06_COMPLETED")
    ).toBe(true);
    expect(
      mockLogger.events.some((e) => e.event_type === "ACTION_07_COMPLETED")
    ).toBe(true);
    expect(
      mockLogger.events.some((e) => e.event_type === "AGENT_SUCCESS")
    ).toBe(true);

    const event_sequence = mockLogger.events.map((e) => e.event_type);
    const agent_start_index = event_sequence.indexOf("AGENT_START");
    const agent_success_index = event_sequence.indexOf("AGENT_SUCCESS");
    expect(agent_start_index).toBeLessThan(agent_success_index);

    const action_01_index = event_sequence.indexOf("ACTION_01_COMPLETED");
    const action_02_index = event_sequence.indexOf("ACTION_02_COMPLETED");
    const action_03_index = event_sequence.indexOf("ACTION_03_COMPLETED");
    const action_04_index = event_sequence.indexOf("ACTION_04_COMPLETED");
    const action_05_index = event_sequence.indexOf("ACTION_05_COMPLETED");
    const action_06_index = event_sequence.indexOf("ACTION_06_COMPLETED");
    const action_07_index = event_sequence.indexOf("ACTION_07_COMPLETED");

    expect(action_01_index).toBeLessThan(action_02_index);
    expect(action_02_index).toBeLessThan(action_03_index);
    expect(action_03_index).toBeLessThan(action_04_index);
    expect(action_04_index).toBeLessThan(action_05_index);
    expect(action_05_index).toBeLessThan(action_06_index);
    expect(action_06_index).toBeLessThan(action_07_index);

    expect(mockEmailService.sentEmails.length).toBe(4);

    const reminder_emails = mockEmailService.sentEmails.filter(
      (e) => e.type === "member_reminder"
    );
    expect(reminder_emails.length).toBe(3);

    const director_emails = mockEmailService.sentEmails.filter(
      (e) => e.type === "director_briefing"
    );
    expect(director_emails.length).toBe(1);
    expect(director_emails[0].recipient).toBe("director@company.example.com");
  });
});