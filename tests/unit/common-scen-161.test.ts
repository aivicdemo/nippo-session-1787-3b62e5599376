import { runTx9Imp1Agent } from "../../src/agents/tx-9-imp-1/orchestrator";
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from "../../src/agents/tx-9-imp-1/prompts/action-02";
import type { Tx9Imp1AiClient } from "../../src/agents/tx-9-imp-1/orchestrator";

describe("Tx9Imp1Agent", () => {
  // SCEN-161
  test("should identify unreported members and send reminder notifications as Action 2", async () => {
    const aggregationStartDate = "2024-01-08";
    const aggregationEndDate = "2024-01-14";
    const requestedByUserId = "user-director-001";

    const submittedMembers = [
      { memberId: "member-001", name: "Member 1", submittedAt: "2024-01-08T09:00:00Z" },
      { memberId: "member-002", name: "Member 2", submittedAt: "2024-01-09T08:30:00Z" },
      { memberId: "member-003", name: "Member 3", submittedAt: "2024-01-10T10:15:00Z" },
      { memberId: "member-004", name: "Member 4", submittedAt: "2024-01-11T09:45:00Z" },
      { memberId: "member-005", name: "Member 5", submittedAt: "2024-01-12T08:00:00Z" },
      { memberId: "member-006", name: "Member 6", submittedAt: "2024-01-13T11:20:00Z" },
      { memberId: "member-007", name: "Member 7", submittedAt: "2024-01-08T14:30:00Z" },
      { memberId: "member-008", name: "Member 8", submittedAt: "2024-01-14T07:45:00Z" },
    ];

    const unsubmittedMembers = [
      { memberId: "member-A", name: "Member A" },
      { memberId: "member-B", name: "Member B" },
    ];

    const allMembers = [...submittedMembers, ...unsubmittedMembers];

    const auditLog: Array<{
      timestamp: string;
      action: string;
      details: Record<string, unknown>;
    }> = [];

    const sentNotifications: Array<{
      recipientId: string;
      message: string;
      sentAt: string;
    }> = [];

    const fakeAiClient: Tx9Imp1AiClient = {
      async executeAction(
        actionNumber: number,
        prompt: string,
        _previousContext: Record<string, unknown>
      ): Promise<Record<string, unknown>> {
        if (actionNumber === 2) {
          auditLog.push({
            timestamp: "2024-01-14T15:00:00Z",
            action: "Action 2 execution started",
            details: { promptVersion: ACTION_02_PROMPT_VERSION },
          });

          const unsubmittedIds = unsubmittedMembers.map((m) => m.memberId);

          auditLog.push({
            timestamp: "2024-01-14T15:00:05Z",
            action: "Unsubmitted members identified",
            details: { count: unsubmittedIds.length, memberIds: unsubmittedIds },
          });

          for (const member of unsubmittedMembers) {
            sentNotifications.push({
              recipientId: member.memberId,
              message: `Dear ${member.name}, your daily report for the period ${aggregationStartDate} to ${aggregationEndDate} has not been submitted yet. Please submit as soon as possible.`,
              sentAt: "2024-01-14T15:00:10Z",
            });

            auditLog.push({
              timestamp: "2024-01-14T15:00:10Z",
              action: "Reminder notification sent",
              details: { recipientId: member.memberId, recipientName: member.name },
            });
          }

          auditLog.push({
            timestamp: "2024-01-14T15:00:15Z",
            action: "Action 2 execution completed",
            details: {
              unsubmittedMemberCount: unsubmittedIds.length,
              notificationsSentCount: unsubmittedMembers.length,
            },
          });

          return {
            actionNumber: 2,
            unsubmittedMemberIds: unsubmittedIds,
            reminderNotificationsSent: unsubmittedMembers.length,
          };
        }

        return {
          actionNumber,
          status: "completed",
        };
      },
    };

    const result = await runTx9Imp1Agent(
      {
        aggregationStartDate,
        aggregationEndDate,
        targetTeamIds: [],
        requestedByUserId,
      },
      fakeAiClient,
      {
        allMembers,
        submittedReports: submittedMembers.map((m) => ({
          memberId: m.memberId,
          submittedAt: m.submittedAt,
        })),
      }
    );

    expect(result.actionHistory).toBeDefined();
    expect(result.unsubmittedMemberCount).toBe(2);
    expect(result.reminderNotificationsSentCount).toBe(2);

    expect(auditLog).toContainEqual(
      expect.objectContaining({
        action: "Action 2 execution started",
        details: expect.objectContaining({
          promptVersion: ACTION_02_PROMPT_VERSION,
        }),
      })
    );

    expect(auditLog).toContainEqual(
      expect.objectContaining({
        action: "Unsubmitted members identified",
        details: expect.objectContaining({
          count: 2,
          memberIds: expect.arrayContaining(["member-A", "member-B"]),
        }),
      })
    );

    expect(auditLog.filter((log) => log.action === "Reminder notification sent")).toHaveLength(2);

    expect(auditLog).toContainEqual(
      expect.objectContaining({
        action: "Action 2 execution completed",
        details: expect.objectContaining({
          unsubmittedMemberCount: 2,
          notificationsSentCount: 2,
        }),
      })
    );

    expect(sentNotifications).toHaveLength(2);
    expect(sentNotifications[0].recipientId).toBe("member-A");
    expect(sentNotifications[1].recipientId).toBe("member-B");

    expect(sentNotifications[0].message).toContain("daily report");
    expect(sentNotifications[0].message).toContain("2024-01-08");
    expect(sentNotifications[0].message).toContain("2024-01-14");

    const action02Prompt = buildAction02Prompt({
      aggregationStartDate,
      aggregationEndDate,
      unsubmittedMemberIds: ["member-A", "member-B"],
      allMembers,
    });

    expect(action02Prompt).toContain("member-A");
    expect(action02Prompt).toContain("member-B");
    expect(action02Prompt).toContain(aggregationStartDate);
    expect(action02Prompt).toContain(aggregationEndDate);
  });
});