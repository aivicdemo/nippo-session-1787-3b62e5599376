import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { detectAndNotifyUnsubmitted } from "../../src/logic/submission-status-management";
import type { Tx11Imp1AiClient } from "../../src/agents/tx-11-imp-1/types";
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from "../../src/agents/tx-11-imp-1/prompts/action-04";

// Mock types for test data
interface PastIssueExample {
  exampleId: string;
  occurrenceDate: string;
  summary: string;
  responseContent: string;
  result: string;
}

interface MemberInfo {
  memberId: string;
  name: string;
  email: string;
}

interface CurrentIssue {
  description: string;
  memberId: string;
}

interface ReferenceInfo {
  exampleId: string;
  occurrenceDate: string;
  summary: string;
  responseContent: string;
  result: string;
}

interface DetectionResult {
  unsubmittedMembers: MemberInfo[];
  referenceInformation: ReferenceInfo[];
  displayFormat: {
    isStructured: boolean;
    fields: string[];
  };
}

describe("detectAndNotifyUnsubmitted - Action 4 past issue search and reference provision", () => {
  let mockAiClient: Tx11Imp1AiClient;
  let pastIssueDatabase: PastIssueExample[];
  let currentIssueRecords: CurrentIssue[];
  let teamMembers: MemberInfo[];

  beforeEach(() => {
    // Setup: Prepare past 30-day issue database with multiple issues per member
    pastIssueDatabase = [
      {
        exampleId: "PAST-001",
        occurrenceDate: "2024-11-15T09:30:00Z",
        summary: "Database connection timeout during peak hours",
        responseContent: "Implemented connection pool optimization and adjusted timeout values",
        result: "Resolved in 2 hours, no recurrence for 3 weeks",
      },
      {
        exampleId: "PAST-002",
        occurrenceDate: "2024-11-14T14:20:00Z",
        summary: "API response time degradation on payment service",
        responseContent: "Added caching layer and optimized database queries",
        result: "Response time improved from 5s to 0.8s",
      },
      {
        exampleId: "PAST-003",
        occurrenceDate: "2024-11-10T11:00:00Z",
        summary: "Memory leak in background worker process",
        responseContent: "Fixed event listener cleanup and implemented memory monitoring",
        result: "Stable operation confirmed after 5 days of testing",
      },
      {
        exampleId: "PAST-004",
        occurrenceDate: "2024-11-08T16:45:00Z",
        summary: "Duplicate data in cache causing inconsistency",
        responseContent: "Implemented cache invalidation strategy and added data validation",
        result: "Consistency verified across all environments",
      },
      {
        exampleId: "PAST-005",
        occurrenceDate: "2024-11-05T10:15:00Z",
        summary: "Database connection timeout during peak hours",
        responseContent: "Adjusted max connections and implemented connection pooling",
        result: "No timeout incidents in last 2 weeks",
      },
    ];

    // Setup: Prepare current submitted daily reports with 1-3 issue descriptions per member
    currentIssueRecords = [
      {
        memberId: "MEM-A",
        description: "Database connection timeout happening again during business hours",
      },
      {
        memberId: "MEM-B",
        description: "API response time is degrading unexpectedly on the payment endpoint",
      },
      {
        memberId: "MEM-C",
        description: "Payment service API experiencing latency issues similar to last week",
      },
    ];

    // Setup: Team members information
    teamMembers = [
      {
        memberId: "MEM-A",
        name: "Alice Johnson",
        email: "alice@company.com",
      },
      {
        memberId: "MEM-B",
        name: "Bob Smith",
        email: "bob@company.com",
      },
      {
        memberId: "MEM-C",
        name: "Charlie Brown",
        email: "charlie@company.com",
      },
    ];

    // Setup: Mock AI client for Action 4 - past issue search and reference provision
    mockAiClient = {
      async executeAction04(
        currentIssueText: string,
        pastIssueDb: PastIssueExample[],
        memberInfo: MemberInfo[]
      ): Promise<ReferenceInfo[]> {
        // Simulate AI searching for similar issues and returning structured reference data
        const similarExamples: ReferenceInfo[] = [];

        // Search for "timeout" keyword matches
        if (
          currentIssueText.toLowerCase().includes("timeout") ||
          currentIssueText.toLowerCase().includes("connection")
        ) {
          const timeoutExamples = pastIssueDb.filter((issue) =>
            issue.summary.toLowerCase().includes("timeout")
          );
          similarExamples.push(
            ...timeoutExamples.map((ex) => ({
              exampleId: ex.exampleId,
              occurrenceDate: ex.occurrenceDate,
              summary: ex.summary,
              responseContent: ex.responseContent,
              result: ex.result,
            }))
          );
        }

        // Search for "API" and "response" keyword matches
        if (
          currentIssueText.toLowerCase().includes("api") ||
          currentIssueText.toLowerCase().includes("response")
        ) {
          const apiExamples = pastIssueDb.filter((issue) =>
            issue.summary.toLowerCase().includes("api") ||
            issue.summary.toLowerCase().includes("response")
          );
          similarExamples.push(
            ...apiExamples.map((ex) => ({
              exampleId: ex.exampleId,
              occurrenceDate: ex.occurrenceDate,
              summary: ex.summary,
              responseContent: ex.responseContent,
              result: ex.result,
            }))
          );
        }

        // Remove duplicates by exampleId
        const uniqueExamples = Array.from(
          new Map(similarExamples.map((item) => [item.exampleId, item])).values()
        );

        return uniqueExamples.slice(0, 3);
      },
    } as Tx11Imp1AiClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-198: Action 4 executes past issue search and provides reference information
  test("SCEN-198: Executes Action 4 to search past issues and provide structured reference information to members", async () => {
    // Execute: Call buildAction04Prompt to verify prompt module is correctly defined
    const promptVersion = ACTION_04_PROMPT_VERSION;
    expect(promptVersion).toBeDefined();
    expect(typeof promptVersion).toBe("string");

    // Execute: Call buildAction04Prompt with test parameters
    const action04Prompt = buildAction04Prompt({
      currentIssueText: currentIssueRecords[0].description,
      pastIssueDatabase: pastIssueDatabase,
      memberInfo: teamMembers,
    });

    expect(action04Prompt).toBeDefined();
    expect(typeof action04Prompt).toBe("string");
    expect(action04Prompt.length).toBeGreaterThan(0);

    // Execute: Run detectAndNotifyUnsubmitted with mock AI client
    const detectionResult = await detectAndNotifyUnsubmitted(
      {
        currentIssueRecords,
        teamMembers,
        pastIssueDatabase,
        unsubmittedMembers: [
          {
            memberId: "MEM-D",
            name: "David Wilson",
            email: "david@company.com",
          },
        ],
      },
      mockAiClient
    );

    // Verify: Reference information contains past examples with correct structure
    expect(detectionResult.referenceInformation).toBeDefined();
    expect(Array.isArray(detectionResult.referenceInformation)).toBe(true);
    expect(detectionResult.referenceInformation.length).toBeGreaterThanOrEqual(3);

    // Verify: Each reference info includes all required fields
    detectionResult.referenceInformation.forEach((reference: ReferenceInfo) => {
      expect(reference.exampleId).toBeDefined();
      expect(typeof reference.exampleId).toBe("string");
      expect(reference.exampleId).toMatch(/^PAST-/);

      expect(reference.occurrenceDate).toBeDefined();
      expect(typeof reference.occurrenceDate).toBe("string");
      // Verify ISO 8601 format
      expect(new Date(reference.occurrenceDate).toISOString()).toBeDefined();

      expect(reference.summary).toBeDefined();
      expect(typeof reference.summary).toBe("string");
      expect(reference.summary.length).toBeGreaterThan(0);

      expect(reference.responseContent).toBeDefined();
      expect(typeof reference.responseContent).toBe("string");
      expect(reference.responseContent.length).toBeGreaterThan(0);

      expect(reference.result).toBeDefined();
      expect(typeof reference.result).toBe("string");
      expect(reference.result.length).toBeGreaterThan(0);
    });

    // Verify: Display format is structured and contains expected fields
    expect(detectionResult.displayFormat).toBeDefined();
    expect(detectionResult.displayFormat.isStructured).toBe(true);
    expect(Array.isArray(detectionResult.displayFormat.fields)).toBe(true);

    const expectedFields = [
      "exampleId",
      "occurrenceDate",
      "summary",
      "responseContent",
      "result",
    ];
    expectedFields.forEach((field) => {
      expect(detectionResult.displayFormat.fields).toContain(field);
    });

    // Verify: Reference information is formatted for member display
    expect(detectionResult.referenceInformation[0].exampleId).toMatch(/^PAST-\d{3}$/);
    expect(detectionResult.referenceInformation[0].occurrenceDate).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // Verify: Unsubmitted members are also detected
    expect(detectionResult.unsubmittedMembers).toBeDefined();
    expect(Array.isArray(detectionResult.unsubmittedMembers)).toBe(true);
    expect(detectionResult.unsubmittedMembers.length).toBeGreaterThan(0);
    expect(detectionResult.unsubmittedMembers[0].memberId).toBe("MEM-D");
    expect(detectionResult.unsubmittedMembers[0].email).toBe("david@company.com");

    // Verify: ACTION_04_PROMPT_VERSION is properly exported
    expect(ACTION_04_PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});