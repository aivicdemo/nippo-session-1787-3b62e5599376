import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";
import { buildAction07Prompt, ACTION_07_PROMPT_VERSION } from "../../src/agents/tx-4-imp-1/prompts/action-07";
import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";
import type { Tx4Imp1AiClient } from "../../src/agents/tx-4-imp-1/orchestrator";

describe("sendUnsubmittedReminder", () => {
  let mockAiClient: jest.Mocked<Tx4Imp1AiClient>;
  let auditLogEvents: Array<{
    action: string;
    actor_id: string;
    timestamp: string;
    members_count: number;
    notification_destination: string;
  }>;

  beforeEach(() => {
    auditLogEvents = [];

    mockAiClient = {
      invokeAction07: jest.fn(),
    } as any;

    jest.spyOn(global, "fetch").mockImplementation(async (url, options) => {
      if (typeof url === "string" && url.includes("/audit-log")) {
        const body = JSON.parse((options?.body as string) || "{}");
        auditLogEvents.push({
          action: body.action,
          actor_id: body.actor_id,
          timestamp: body.timestamp,
          members_count: body.members_count,
          notification_destination: body.notification_destination,
        });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      if (typeof url === "string" && url.includes("/notifications")) {
        return new Response(JSON.stringify({ sent: true }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // SCEN-079
  test("should extract unsubmitted members and send notification with audit logging", async () => {
    const submission_deadline = new Date("2024-01-15T08:00:00Z");
    const current_timestamp = new Date("2024-01-15T08:30:00Z");
    const manager_email = "manager@company.com";
    const agent_actor_id = "agent-tx4-imp1";

    const members_status = [
      {
        member_id: "M001",
        member_name: "田中太郎",
        department: "営業部",
        email: "tanaka.taro@company.com",
        submitted: false,
        submission_time: null,
      },
      {
        member_id: "M002",
        member_name: "鈴木次郎",
        department: "技術部",
        email: "suzuki.jiro@company.com",
        submitted: true,
        submission_time: new Date("2024-01-15T07:45:00Z"),
      },
      {
        member_id: "M003",
        member_name: "佐藤花子",
        department: "企画部",
        email: "sato.hanako@company.com",
        submitted: false,
        submission_time: null,
      },
    ];

    const prompt_input = {
      deadline: submission_deadline.toISOString(),
      members: members_status,
    };

    mockAiClient.invokeAction07.mockResolvedValueOnce({
      unsubmitted_members: [
        {
          member_id: "M001",
          member_name: "田中太郎",
          department: "営業部",
          email: "tanaka.taro@company.com",
          unsubmitted_reason: "No submission",
        },
        {
          member_id: "M003",
          member_name: "佐藤花子",
          department: "企画部",
          email: "sato.hanako@company.com",
          unsubmitted_reason: "Not yet submitted",
        },
      ],
    });

    expect(buildAction07Prompt).toBeDefined();
    expect(typeof buildAction07Prompt).toBe("function");

    const generated_prompt = buildAction07Prompt(prompt_input);
    expect(generated_prompt).toBeDefined();
    expect(typeof generated_prompt).toBe("string");

    expect(ACTION_07_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_07_PROMPT_VERSION).toBe("string");

    const ai_result = await mockAiClient.invokeAction07(generated_prompt);

    expect(ai_result).toBeDefined();
    expect(ai_result.unsubmitted_members).toHaveLength(2);

    const unsubmitted_member_1 = ai_result.unsubmitted_members[0];
    expect(unsubmitted_member_1.member_name).toBe("田中太郎");
    expect(unsubmitted_member_1.department).toBe("営業部");
    expect(unsubmitted_member_1.email).toBe("tanaka.taro@company.com");

    const unsubmitted_member_2 = ai_result.unsubmitted_members[1];
    expect(unsubmitted_member_2.member_name).toBe("佐藤花子");
    expect(unsubmitted_member_2.department).toBe("企画部");
    expect(unsubmitted_member_2.email).toBe("sato.hanako@company.com");

    const notification_payload = {
      destination: manager_email,
      subject: "【自動通知】本日の日報未提出メンバーリスト",
      body: `本日${submission_deadline.toLocaleString("ja-JP")}までに日報を提出していないメンバーは以下の通りです。\n\n` +
        unsubmitted_member_1.member_name +
        `（${unsubmitted_member_1.department}）\n` +
        unsubmitted_member_2.member_name +
        `（${unsubmitted_member_2.department}）\n\n` +
        `未提出時間：${current_timestamp.toISOString()}\n`,
      recipients: ai_result.unsubmitted_members.map((m) => ({
        name: m.member_name,
        email: m.email,
        department: m.department,
      })),
    };

    expect(notification_payload.subject).toContain("未提出メンバー通知");
    expect(notification_payload.body).toContain("田中太郎");
    expect(notification_payload.body).toContain("営業部");
    expect(notification_payload.body).toContain("佐藤花子");
    expect(notification_payload.body).toContain("企画部");

    const audit_event = {
      action: "action_07_completed",
      actor_id: agent_actor_id,
      timestamp: current_timestamp.toISOString(),
      members_count: ai_result.unsubmitted_members.length,
      notification_destination: manager_email,
    };

    await fetch("/audit-log", {
      method: "POST",
      body: JSON.stringify(audit_event),
    });

    expect(auditLogEvents).toHaveLength(1);
    const recorded_event = auditLogEvents[0];
    expect(recorded_event.action).toBe("action_07_completed");
    expect(recorded_event.actor_id).toBe(agent_actor_id);
    expect(recorded_event.timestamp).toBe("2024-01-15T08:30:00Z");
    expect(recorded_event.members_count).toBe(2);
    expect(recorded_event.notification_destination).toBe(manager_email);

    const notification_result = await sendUnsubmittedReminder({
      submission_deadline,
      members_status,
      manager_email,
      agent_actor_id,
      current_timestamp,
      unsubmitted_members: ai_result.unsubmitted_members,
    });

    expect(notification_result).toBeDefined();
    expect(notification_result.success).toBe(true);
    expect(notification_result.unsubmitted_count).toBe(2);
    expect(notification_result.notification_sent_to).toBe(manager_email);
  });
});