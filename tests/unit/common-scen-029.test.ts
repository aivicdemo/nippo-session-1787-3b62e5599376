import { detectAndNotifyUnsubmitted } from "../../src/logic/submission-status-management";

describe("submission-status-management", () => {
  test("SCEN-029: detectAndNotifyUnsubmitted sends completion notification to director after all prior actions complete", async () => {
    const agentExecutionId = "agent-exec-20240115-001";
    const directorEmail = "director@example.com";
    const processingDate = "2024-01-15";
    const unsubmittedCount = 3;
    const extractedIssueCount = 7;
    const meetingMaterialsFilename = "morning-meeting-2024-01-15.pdf";
    const meetingMaterialsUrl = "https://storage.example.com/reports/morning-meeting-2024-01-15.pdf";
    const completionTimestamp = "2024-01-15 09:30:00";
    const notificationTimestampIso = "2024-01-15T09:30:00Z";

    // Mock previous actions 1-5 results
    const priorActionsContext = {
      dailyReportsAggregated: [
        { memberId: "m001", report: "Task A completed, issue: DB connection timeout" },
        { memberId: "m002", report: "Feature B deployed successfully" },
      ],
      unsubmittedMembers: [
        { memberId: "m003", name: "Alice" },
        { memberId: "m004", name: "Bob" },
        { memberId: "m005", name: "Charlie" },
      ],
      prioritizedIssues: [
        { issueId: "issue-001", title: "DB Performance", priority: "high", extractedFrom: "m001" },
        { issueId: "issue-002", title: "API Latency", priority: "high", extractedFrom: "m001" },
        { issueId: "issue-003", title: "UI Bug", priority: "medium", extractedFrom: "m002" },
        { issueId: "issue-004", title: "Documentation", priority: "low", extractedFrom: "m002" },
        { issueId: "issue-005", title: "Security Patch", priority: "high", extractedFrom: "m001" },
        { issueId: "issue-006", title: "Code Review", priority: "medium", extractedFrom: "m002" },
        { issueId: "issue-007", title: "Testing", priority: "low", extractedFrom: "m001" },
      ],
      generatedMeetingMaterial: {
        filename: meetingMaterialsFilename,
        url: meetingMaterialsUrl,
        generatedAt: completionTimestamp,
      },
    };

    const input = {
      agentExecutionId,
      directorEmail,
      processingDate,
      priorActionsContext,
    };

    const result = await detectAndNotifyUnsubmitted(input);

    // Verify success flag
    expect(result.success).toBe(true);

    // Verify completed action identifier
    expect(result.completedAction).toBe("action-06");

    // Verify notification timestamp in ISO 8601 format
    expect(result.notificationTimestamp).toBe(notificationTimestampIso);

    // Verify recipient email
    expect(result.recipientEmail).toBe(directorEmail);

    // Verify agent execution ID is passed through
    expect(result.agentExecutionId).toBe(agentExecutionId);

    // Verify notification message content structure
    expect(result.notificationMessage).toBeDefined();
    expect(result.notificationMessage).toContain(meetingMaterialsFilename);
    expect(result.notificationMessage).toContain(meetingMaterialsUrl);
    expect(result.notificationMessage).toContain(completionTimestamp);
    expect(result.notificationMessage).toContain(processingDate);
    expect(result.notificationMessage).toContain(String(unsubmittedCount));
    expect(result.notificationMessage).toContain(String(extractedIssueCount));

    // Verify audit log entry was created
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.action).toBe("send_notification_to_director");
    expect(result.auditLog.actionNumber).toBe(6);
    expect(result.auditLog.status).toBe("completed");
    expect(result.auditLog.timestamp).toBe(notificationTimestampIso);
    expect(result.auditLog.agentExecutionId).toBe(agentExecutionId);

    // Verify prior action results are preserved and accessible
    expect(result.priorActionsPreserved).toBe(true);
    expect(result.preservedContext).toEqual(priorActionsContext);
  });
});