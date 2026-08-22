import { sendSummaryEmail } from "../../src/logic/notification-delivery";
import { type SummaryEmailInput } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-023: sends summary email with all 10 reports aggregated", async () => {
    const mockReports = [
      {
        employeeId: "EMP001",
        employeeName: "Employee 1",
        yesterday: "Completed feature A",
        today: "Start feature B",
        issues: "Blocker on DB schema",
      },
      {
        employeeId: "EMP002",
        employeeName: "Employee 2",
        yesterday: "Code review for PR #123",
        today: "Deploy to staging",
        issues: "None",
      },
      {
        employeeId: "EMP003",
        employeeName: "Employee 3",
        yesterday: "Fixed bug in payment module",
        today: "Write unit tests",
        issues: "API timeout on third-party service",
      },
      {
        employeeId: "EMP004",
        employeeName: "Employee 4",
        yesterday: "Updated documentation",
        today: "Onboard new team member",
        issues: "None",
      },
      {
        employeeId: "EMP005",
        employeeName: "Employee 5",
        yesterday: "Attended architecture meeting",
        today: "Design microservice endpoints",
        issues: "Need consensus on API versioning",
      },
      {
        employeeId: "EMP006",
        employeeName: "Employee 6",
        yesterday: "Database optimization",
        today: "Performance testing",
        issues: "Query latency still high",
      },
      {
        employeeId: "EMP007",
        employeeName: "Employee 7",
        yesterday: "Security audit preparation",
        today: "Run vulnerability scan",
        issues: "Found 3 medium-risk CVEs",
      },
      {
        employeeId: "EMP008",
        employeeName: "Employee 8",
        yesterday: "Client presentation",
        today: "Requirements clarification",
        issues: "Scope creep on phase 2",
      },
      {
        employeeId: "EMP009",
        employeeName: "Employee 9",
        yesterday: "CI/CD pipeline refactor",
        today: "Migrate to new container registry",
        issues: "None",
      },
      {
        employeeId: "EMP010",
        employeeName: "Employee 10",
        yesterday: "Mentoring junior developer",
        today: "Code quality metrics review",
        issues: "Need tooling investment for static analysis",
      },
    ];

    const emailInput: SummaryEmailInput = {
      recipientEmail: "manager@example.com",
      reports: mockReports,
      aggregationDate: "2024-11-28",
    };

    const result = await sendSummaryEmail(emailInput);

    expect(result.sent).toBe(true);
    expect(result.recipientEmail).toBe("manager@example.com");
    expect(result.reportCount).toBe(10);
    expect(result.emailBody).toContain("Employee 1");
    expect(result.emailBody).toContain("Completed feature A");
    expect(result.emailBody).toContain("Start feature B");
    expect(result.emailBody).toContain("Blocker on DB schema");
    expect(result.emailBody).toContain("Employee 2");
    expect(result.emailBody).toContain("Code review for PR #123");
    expect(result.emailBody).toContain("Deploy to staging");
    expect(result.emailBody).toContain("Employee 3");
    expect(result.emailBody).toContain("Fixed bug in payment module");
    expect(result.emailBody).toContain("Write unit tests");
    expect(result.emailBody).toContain("API timeout on third-party service");
    expect(result.emailBody).toContain("Employee 10");
    expect(result.emailBody).toContain("Mentoring junior developer");
    expect(result.emailBody).toContain("Code quality metrics review");
    expect(result.emailBody).toContain("Need tooling investment for static analysis");
  });
});