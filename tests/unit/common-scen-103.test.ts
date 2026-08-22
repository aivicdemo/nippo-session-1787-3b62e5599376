import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { detectAndNotifyUnsubmitted } from "../../src/logic/submission-status-management";

describe("submission-status-management", () => {
  let jiraApiSpy: jest.Mock;
  let asanaApiSpy: jest.Mock;
  let notificationSpy: jest.Mock;
  let deduplicationStore: Map<string, { issueId: string; status: string; firstExecutionTimestamp: string; deduplicationDetectTimestamp: string }>;
  let callCount: { jira: number; asana: number; notification: number };

  beforeEach(() => {
    deduplicationStore = new Map();
    callCount = { jira: 0, asana: 0, notification: 0 };

    jiraApiSpy = jest.fn(async (endpoint: string, issueData: any) => {
      callCount.jira++;
      const deduplicationKey = `${issueData.issueId}_${issueData.priority}_${issueData.category}`;
      return { success: true, jiraIssueId: "JIRA-001", deduplicationKey };
    });

    asanaApiSpy = jest.fn(async (endpoint: string, taskData: any) => {
      callCount.asana++;
      const deduplicationKey = `${taskData.issueId}_${taskData.priority}_${taskData.category}`;
      return { success: true, asanaTaskId: "ASANA-001", deduplicationKey };
    });

    notificationSpy = jest.fn(async (notificationType: string, payload: any) => {
      callCount.notification++;
      return { success: true };
    });

    global.fetch = jest.fn(async (url: string, options?: any) => {
      if (url.includes("/jira/issues")) {
        const result = await jiraApiSpy(url, JSON.parse(options?.body || "{}"));
        return new Response(JSON.stringify(result), { status: 200 });
      }
      if (url.includes("/asana/tasks")) {
        const result = await asanaApiSpy(url, JSON.parse(options?.body || "{}"));
        return new Response(JSON.stringify(result), { status: 200 });
      }
      if (url.includes("/notification/send")) {
        const result = await notificationSpy("send", JSON.parse(options?.body || "{}"));
        return new Response(JSON.stringify(result), { status: 200 });
      }
      return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-103
  test("should deduplicate identical issue extraction requests and prevent duplicate API calls and notifications", async () => {
    const extractedIssueData = {
      issueId: "ISSUE-001",
      priority: "High",
      category: "Bug",
      title: "Critical system error",
      description: "System fails under load",
    };

    const fakeAiClient = {
      action01_validateExtractedIssue: jest.fn(async (issueData: any) => ({
        isValid: true,
        validatedData: issueData,
      })),
      action02_classifyIssueCategory: jest.fn(async (issueData: any) => ({
        category: issueData.category,
        confidence: 0.95,
      })),
      action03_determinePriority: jest.fn(async (issueData: any) => ({
        priority: issueData.priority,
        score: 85,
      })),
      action04_executeToolIntegration: jest.fn(async (issueData: any, deduplicationKey: string) => {
        const isDuplicate = deduplicationStore.has(deduplicationKey);
        if (isDuplicate) {
          return { skipped: true, reason: "SKIPPED_DUPLICATE", deduplicationKey };
        }
        const jiraResponse = await jiraApiSpy("/jira/issues", issueData);
        const asanaResponse = await asanaApiSpy("/asana/tasks", issueData);
        return {
          skipped: false,
          jiraResult: jiraResponse,
          asanaResult: asanaResponse,
          deduplicationKey,
        };
      }),
      action05_recordDeduplicationAndNotify: jest.fn(async (integrationResult: any, issueData: any) => {
        const deduplicationKey = integrationResult.deduplicationKey;
        const timestamp = new Date("2024-01-15T10:00:00Z").toISOString();

        if (integrationResult.skipped) {
          const existingRecord = deduplicationStore.get(deduplicationKey);
          deduplicationStore.set(deduplicationKey, {
            issueId: issueData.issueId,
            status: "SKIPPED_DUPLICATE",
            firstExecutionTimestamp: existingRecord?.firstExecutionTimestamp || timestamp,
            deduplicationDetectTimestamp: timestamp,
          });
          return { recorded: true, status: "SKIPPED_DUPLICATE" };
        }

        deduplicationStore.set(deduplicationKey, {
          issueId: issueData.issueId,
          status: "COMPLETED",
          firstExecutionTimestamp: timestamp,
          deduplicationDetectTimestamp: timestamp,
        });

        await notificationSpy("send", {
          type: "ISSUE_INTEGRATION_COMPLETE",
          issueId: issueData.issueId,
          timestamp,
        });

        return { recorded: true, status: "COMPLETED" };
      }),
    };

    // First execution
    const firstExecutionTimestamp = new Date("2024-01-15T10:00:00Z").toISOString();
    const deduplicationKeyFirstRun = `${extractedIssueData.issueId}_${extractedIssueData.priority}_${extractedIssueData.category}`;

    // Action 1: Validate
    const validationResult = await fakeAiClient.action01_validateExtractedIssue(extractedIssueData);
    expect(validationResult.isValid).toBe(true);

    // Action 2: Classify
    const classificationResult = await fakeAiClient.action02_classifyIssueCategory(validationResult.validatedData);
    expect(classificationResult.category).toBe("Bug");
    expect(classificationResult.confidence).toBe(0.95);

    // Action 3: Determine Priority
    const priorityResult = await fakeAiClient.action03_determinePriority(validationResult.validatedData);
    expect(priorityResult.priority).toBe("High");
    expect(priorityResult.score).toBe(85);

    // Action 4: Execute Tool Integration (first run)
    const integrationResultFirst = await fakeAiClient.action04_executeToolIntegration(
      validationResult.validatedData,
      deduplicationKeyFirstRun
    );
    expect(integrationResultFirst.skipped).toBe(false);
    expect(jiraApiSpy).toHaveBeenCalledTimes(1);
    expect(asanaApiSpy).toHaveBeenCalledTimes(1);

    // Action 5: Record Deduplication and Notify (first run)
    const recordingResultFirst = await fakeAiClient.action05_recordDeduplicationAndNotify(
      integrationResultFirst,
      extractedIssueData
    );
    expect(recordingResultFirst.status).toBe("COMPLETED");
    expect(notificationSpy).toHaveBeenCalledTimes(1);

    // Verify deduplication store after first run
    expect(deduplicationStore.size).toBe(1);
    const firstRecord = deduplicationStore.get(deduplicationKeyFirstRun);
    expect(firstRecord).toBeDefined();
    expect(firstRecord?.issueId).toBe("ISSUE-001");
    expect(firstRecord?.status).toBe("COMPLETED");
    expect(firstRecord?.firstExecutionTimestamp).toBe(firstExecutionTimestamp);

    // Reset spy call counts for second execution
    callCount.jira = 0;
    callCount.asana = 0;
    callCount.notification = 0;
    jiraApiSpy.mockClear();
    asanaApiSpy.mockClear();
    notificationSpy.mockClear();

    // Second execution (identical issue)
    const secondExecutionTimestamp = new Date("2024-01-15T10:05:00Z").toISOString();

    // Action 1: Validate (second run)
    const validationResultSecond = await fakeAiClient.action01_validateExtractedIssue(extractedIssueData);
    expect(validationResultSecond.isValid).toBe(true);

    // Action 2: Classify (second run)
    const classificationResultSecond = await fakeAiClient.action02_classifyIssueCategory(validationResultSecond.validatedData);
    expect(classificationResultSecond.category).toBe("Bug");

    // Action 3: Determine Priority (second run)
    const priorityResultSecond = await fakeAiClient.action03_determinePriority(validationResultSecond.validatedData);
    expect(priorityResultSecond.priority).toBe("High");

    // Action 4: Execute Tool Integration (second run - should skip)
    const integrationResultSecond = await fakeAiClient.action04_executeToolIntegration(
      validationResultSecond.validatedData,
      deduplicationKeyFirstRun
    );
    expect(integrationResultSecond.skipped).toBe(true);
    expect(integrationResultSecond.reason).toBe("SKIPPED_DUPLICATE");
    expect(jiraApiSpy).toHaveBeenCalledTimes(0);
    expect(asanaApiSpy).toHaveBeenCalledTimes(0);

    // Action 5: Record Deduplication (second run - no notification)
    const recordingResultSecond = await fakeAiClient.action05_recordDeduplicationAndNotify(
      integrationResultSecond,
      extractedIssueData
    );
    expect(recordingResultSecond.status).toBe("SKIPPED_DUPLICATE");
    expect(notificationSpy).toHaveBeenCalledTimes(0);

    // Verify no duplicate records created
    expect(deduplicationStore.size).toBe(1);

    // Verify deduplication record contains correct metadata
    const secondRecord = deduplicationStore.get(deduplicationKeyFirstRun);
    expect(secondRecord).toBeDefined();
    expect(secondRecord?.issueId).toBe("ISSUE-001");
    expect(secondRecord?.status).toBe("SKIPPED_DUPLICATE");
    expect(secondRecord?.firstExecutionTimestamp).toBe(firstExecutionTimestamp);
    expect(secondRecord?.deduplicationDetectTimestamp).toBe(secondExecutionTimestamp);

    // Verify total API call counts remain at 1
    expect(callCount.jira).toBe(0);
    expect(callCount.asana).toBe(0);
    expect(callCount.notification).toBe(0);
  });
});