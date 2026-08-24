import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { detectAndNotifyUnsubmittedMembers } from "../../src/logic/submission-status-tracking";

describe("submission-status-tracking: detectAndNotifyUnsubmittedMembers", () => {
  let notificationServiceAdapter: any;
  let textAnalysisServiceAdapter: any;
  let originalNow: () => number;

  beforeEach(() => {
    originalNow = Date.now;
    const fixedNow = new Date("2024-01-15T08:30:00Z").getTime();
    Date.now = jest.fn(() => fixedNow);

    const sentNotifications: Array<{ userId: string; sentAt: Date }> = [];

    notificationServiceAdapter = {
      sendReminderNotification: jest.fn(
        async (
          userId: string,
          _remainingMinutes: number,
          _channels: string[]
        ) => {
          sentNotifications.push({
            userId,
            sentAt: new Date(Date.now()),
          });
          return {
            status: "sent" as const,
            sentAt: new Date(Date.now()),
          };
        }
      ),
      getSentNotifications: () => sentNotifications,
    };

    textAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        return {
          keywords: [],
          frequency: {},
        };
      }),
      assessImpactScore: jest.fn(async (_keywords: string[]) => {
        return 0;
      }),
      classifyIssueSeverity: jest.fn(async (_text: string) => {
        return "low";
      }),
    };
  });

  afterEach(() => {
    Date.now = originalNow;
  });

  // SCEN-2809
  test("should identify and notify only unsubmitted members requiring reminder", async () => {
    const input = {
      teamId: "team-001",
      reportDate: "2024-01-15",
      morningMeetingStartTime: "09:00",
      executorUserId: "executor-user-001",
      members: [
        {
          userId: "member-a",
          userName: "Member A",
          email: "member-a@example.com",
          lastSubmissionTimestamp: new Date("2024-01-14T09:00:00Z"),
          isSubmittedToday: false,
        },
        {
          userId: "member-b",
          userName: "Member B",
          email: "member-b@example.com",
          lastSubmissionTimestamp: new Date("2024-01-14T07:00:00Z"),
          isSubmittedToday: false,
        },
        {
          userId: "member-c",
          userName: "Member C",
          email: "member-c@example.com",
          lastSubmissionTimestamp: new Date("2024-01-15T08:15:00Z"),
          isSubmittedToday: true,
        },
        {
          userId: "member-d",
          userName: "Member D",
          email: "member-d@example.com",
          lastSubmissionTimestamp: new Date("2024-01-14T16:00:00Z"),
          isSubmittedToday: false,
        },
      ],
      notificationChannels: ["email"],
      reportDeadlineTime: new Date("2024-01-15T09:00:00Z"),
    };

    const result = await detectAndNotifyUnsubmittedMembers(
      input,
      notificationServiceAdapter,
      textAnalysisServiceAdapter
    );

    const sentNotifications = notificationServiceAdapter.getSentNotifications();

    expect(sentNotifications).toHaveLength(2);
    expect(sentNotifications.map((n: { userId: string }) => n.userId)).toEqual(
      expect.arrayContaining(["member-a", "member-d"])
    );
    expect(sentNotifications.map((n: { userId: string }) => n.userId)).not.toContain(
      "member-b"
    );
    expect(sentNotifications.map((n: { userId: string }) => n.userId)).not.toContain(
      "member-c"
    );

    expect(result.unsubmittedMembers).toHaveLength(4);
    expect(result.notificationsSent).toBe(2);
    expect(result.notificationFailures).toHaveLength(0);
    expect(result.executedAt).toBeDefined();
  });
});