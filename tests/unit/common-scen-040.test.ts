import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { sendSummaryEmail } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-040: sendSummaryEmail delivers morning meeting summary with extracted issues to director", async () => {
    const mockMailSystem = {
      sendEmail: jest.fn().mockResolvedValue({ messageId: "msg-123456" }),
    };

    const summaryContent = {
      reportDate: "2024-01-15",
      directorEmail: "director@company.example.com",
      unifiedReports: [
        {
          memberName: "Member A",
          yesterday: "Completed API integration test",
          today: "Implement database migration",
          issues: "Performance bottleneck in query optimization",
        },
        {
          memberName: "Member B",
          yesterday: "Fixed user authentication bug",
          today: "Update documentation",
          issues: "Incomplete test coverage on edge cases",
        },
        {
          memberName: "Member C",
          yesterday: "Code review for payment module",
          today: "Deploy staging environment",
          issues: "Deployment validation script failure",
        },
        {
          memberName: "Member D",
          yesterday: "Database schema migration planning",
          today: "Execute data migration",
          issues: "Data consistency verification pending",
        },
        {
          memberName: "Member E",
          yesterday: "Security audit preparation",
          today: "Conduct vulnerability assessment",
          issues: "Third-party library deprecated API",
        },
        {
          memberName: "Member F",
          yesterday: "Monitoring dashboard configuration",
          today: "Set up alert thresholds",
          issues: "Alert false positive rate high",
        },
        {
          memberName: "Member G",
          yesterday: "Client requirement analysis",
          today: "Develop feature specification",
          issues: "Scope ambiguity with stakeholder",
        },
        {
          memberName: "Member H",
          yesterday: "Infrastructure capacity planning",
          today: "Provision new resources",
          issues: "Budget approval still pending",
        },
        {
          memberName: "Member I",
          yesterday: "Performance tuning on cache layer",
          today: "Load testing preparation",
          issues: "Cache invalidation strategy unclear",
        },
        {
          memberName: "Member J",
          yesterday: "Incident postmortem documentation",
          today: "Implement preventive measures",
          issues: "Root cause analysis incomplete",
        },
      ],
      prioritizedIssues: {
        high: [
          {
            issue: "Deployment validation script failure",
            member: "Member C",
            impact: "Blocks production release",
          },
          {
            issue: "Third-party library deprecated API",
            member: "Member E",
            impact: "Security vulnerability exposure",
          },
        ],
        medium: [
          {
            issue: "Performance bottleneck in query optimization",
            member: "Member A",
            impact: "User experience degradation",
          },
          {
            issue: "Data consistency verification pending",
            member: "Member D",
            impact: "Migration reliability concern",
          },
          {
            issue: "Alert false positive rate high",
            member: "Member F",
            impact: "Monitoring effectiveness reduced",
          },
          {
            issue: "Scope ambiguity with stakeholder",
            member: "Member G",
            impact: "Timeline risk present",
          },
        ],
        low: [
          {
            issue: "Incomplete test coverage on edge cases",
            member: "Member B",
            impact: "Quality assurance gap",
          },
          {
            issue: "Budget approval still pending",
            member: "Member H",
            impact: "Resource procurement delay",
          },
          {
            issue: "Cache invalidation strategy unclear",
            member: "Member I",
            impact: "Technical debt accumulation",
          },
          {
            issue: "Root cause analysis incomplete",
            member: "Member J",
            impact: "Learning opportunity deferred",
          },
        ],
      },
      unsubmittedMembers: [] as string[],
    };

    const result = await sendSummaryEmail(summaryContent, mockMailSystem);

    expect(mockMailSystem.sendEmail).toHaveBeenCalledTimes(1);

    const emailCall = mockMailSystem.sendEmail.mock.calls[0][0];
    expect(emailCall.to).toBe("director@company.example.com");
    expect(emailCall.subject).toMatch(/朝会用/);
    expect(emailCall.subject).toMatch(/日報集約/);
    expect(emailCall.subject).toMatch(/2024年01月15日/);

    expect(emailCall.body).toContain("Member A");
    expect(emailCall.body).toContain("Member B");
    expect(emailCall.body).toContain("Member C");
    expect(emailCall.body).toContain("Member D");
    expect(emailCall.body).toContain("Member E");
    expect(emailCall.body).toContain("Member F");
    expect(emailCall.body).toContain("Member G");
    expect(emailCall.body).toContain("Member H");
    expect(emailCall.body).toContain("Member I");
    expect(emailCall.body).toContain("Member J");

    expect(emailCall.body).toContain("Completed API integration test");
    expect(emailCall.body).toContain("Implement database migration");
    expect(emailCall.body).toContain("Performance bottleneck in query optimization");

    expect(emailCall.body).toMatch(/高:\s*2件/);
    expect(emailCall.body).toMatch(/中:\s*4件/);
    expect(emailCall.body).toMatch(/低:\s*4件/);

    expect(emailCall.body).toContain("Deployment validation script failure");
    expect(emailCall.body).toContain("Third-party library deprecated API");
    expect(emailCall.body).toContain("Performance bottleneck in query optimization");

    expect(emailCall.body).not.toContain("未提出");

    expect(result).toEqual({
      status: "success",
      deliveredMailId: "msg-123456",
    });
  });
});