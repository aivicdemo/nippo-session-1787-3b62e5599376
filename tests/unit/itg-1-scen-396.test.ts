import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { syncExtractedIssuesToExternalTool } from "../../src/logic/existing-tool-integration";

describe("existing-tool-integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-396
  test("should handle partial failure with 5+ duplicate issues merged when syncing to external tool", async () => {
    const extractedIssueDataList = [
      {
        issueId: "issue-001",
        issueContent: "Database performance degradation",
        priorityScore: 85,
        impactLevel: "high" as const,
        extractedKeywords: ["database", "performance"],
        reportDate: "2024-01-15T09:00:00Z",
        reporterId: "eng-001",
        teamId: "team-001",
      },
      {
        issueId: "issue-002",
        issueContent: "API timeout errors occurring",
        priorityScore: 78,
        impactLevel: "high" as const,
        extractedKeywords: ["api", "timeout"],
        reportDate: "2024-01-15T09:05:00Z",
        reporterId: "eng-002",
        teamId: "team-001",
      },
      {
        issueId: "issue-003",
        issueContent: "Database performance degradation",
        priorityScore: 82,
        impactLevel: "high" as const,
        extractedKeywords: ["database", "performance"],
        reportDate: "2024-01-15T09:10:00Z",
        reporterId: "eng-003",
        teamId: "team-001",
      },
      {
        issueId: "issue-004",
        issueContent: "Memory leak in service",
        priorityScore: 80,
        impactLevel: "medium" as const,
        extractedKeywords: ["memory", "leak"],
        reportDate: "2024-01-15T09:15:00Z",
        reporterId: "eng-004",
        teamId: "team-001",
      },
      {
        issueId: "issue-005",
        issueContent: "Database performance degradation",
        priorityScore: 79,
        impactLevel: "high" as const,
        extractedKeywords: ["database", "performance"],
        reportDate: "2024-01-15T09:20:00Z",
        reporterId: "eng-005",
        teamId: "team-001",
      },
      {
        issueId: "issue-006",
        issueContent: "API timeout errors occurring",
        priorityScore: 75,
        impactLevel: "high" as const,
        extractedKeywords: ["api", "timeout"],
        reportDate: "2024-01-15T09:25:00Z",
        reporterId: "eng-006",
        teamId: "team-001",
      },
      {
        issueId: "issue-007",
        issueContent: "Database performance degradation",
        priorityScore: 81,
        impactLevel: "high" as const,
        extractedKeywords: ["database", "performance"],
        reportDate: "2024-01-15T09:30:00Z",
        reporterId: "eng-007",
        teamId: "team-001",
      },
      {
        issueId: "issue-008",
        issueContent: "Deployment pipeline failure",
        priorityScore: 88,
        impactLevel: "high" as const,
        extractedKeywords: ["deployment", "pipeline"],
        reportDate: "2024-01-15T09:35:00Z",
        reporterId: "eng-008",
        teamId: "team-001",
      },
      {
        issueId: "issue-009",
        issueContent: "Memory leak in service",
        priorityScore: 77,
        impactLevel: "medium" as const,
        extractedKeywords: ["memory", "leak"],
        reportDate: "2024-01-15T09:40:00Z",
        reporterId: "eng-009",
        teamId: "team-001",
      },
      {
        issueId: "issue-010",
        issueContent: "API timeout errors occurring",
        priorityScore: 76,
        impactLevel: "high" as const,
        extractedKeywords: ["api", "timeout"],
        reportDate: "2024-01-15T09:45:00Z",
        reporterId: "eng-010",
        teamId: "team-001",
      },
    ];

    const toolApiEndpoint = "https://jira.example.com/rest/api/3/issues";
    const toolApiAuthToken = "Bearer valid-token-12345";
    const projectManagerId = "manager-001";
    const maxRetryAttempts = 3;

    const mockNormalizedIssues = extractedIssueDataList.map((issue) => ({
      id: issue.issueId,
      title: issue.issueContent.substring(0, 50),
      description: issue.issueContent,
      priority: issue.priorityScore,
      keywords: issue.extractedKeywords,
    }));

    const mockApiResponses = [
      { success: true, toolIssueId: "JIRA-001", httpStatusCode: 201, retryCount: 0, executionTimeMs: 150 },
      { success: true, toolIssueId: "JIRA-002", httpStatusCode: 201, retryCount: 0, executionTimeMs: 145 },
      {
        success: false,
        httpStatusCode: 409,
        retryCount: 0,
        errorType: "duplicate",
        errorMessage: "Issue with similar content already exists",
        executionTimeMs: 120,
      },
      { success: true, toolIssueId: "JIRA-004", httpStatusCode: 201, retryCount: 0, executionTimeMs: 155 },
      {
        success: false,
        httpStatusCode: 409,
        retryCount: 0,
        errorType: "duplicate",
        errorMessage: "Issue with similar content already exists",
        executionTimeMs: 125,
      },
      {
        success: false,
        httpStatusCode: 409,
        retryCount: 0,
        errorType: "duplicate",
        errorMessage: "Issue with similar content already exists",
        executionTimeMs: 130,
      },
      {
        success: false,
        httpStatusCode: 409,
        retryCount: 0,
        errorType: "duplicate",
        errorMessage: "Issue with similar content already exists",
        executionTimeMs: 128,
      },
      { success: true, toolIssueId: "JIRA-008", httpStatusCode: 201, retryCount: 0, executionTimeMs: 160 },
      {
        success: false,
        httpStatusCode: 409,
        retryCount: 0,
        errorType: "duplicate",
        errorMessage: "Issue with similar content already exists",
        executionTimeMs: 122,
      },
      { success: true, toolIssueId: "JIRA-010", httpStatusCode: 201, retryCount: 0, executionTimeMs: 148 },
    ];

    const mockValidationResult = {
      isConsistent: true,
      inconsistencies: [],
      requiresResync: false,
    };

    const mockAuditLogId = "audit-log-20240115-001";

    const mockExecuteToolApiCallWithRetry = jest.fn(async () => {
      const response = mockApiResponses.shift();
      return response;
    });

    const mockValidateIssueData = jest.fn(async () => ({
      isValid: true,
      validationErrors: [],
    }));

    const mockNormalizeIssueData = jest.fn(async () => ({
      normalizedIssues: mockNormalizedIssues,
      mappingMetadata: {
        fieldMappings: {
          issueId: "key",
          issueContent: "summary",
          priorityScore: "priority",
        },
        valueTransformations: {},
      },
      normalizationTimestamp: "2024-01-15T10:00:00Z",
    }));

    const mockVerifyConsistency = jest.fn(async () => ({
      isConsistent: true,
      inconsistencies: [],
      requiresResync: false,
      itemCount: 10,
      fieldValidationPassed: true,
      statusMatchValidation: true,
    }));

    const mockRecordAuditLog = jest.fn(async () => ({
      auditLogId: mockAuditLogId,
      recordedTimestamp: new Date("2024-01-15T10:00:05Z"),
      persistenceStatus: "recorded" as const,
    }));

    const result = await syncExtractedIssuesToExternalTool(
      extractedIssueDataList,
      "jira",
      toolApiEndpoint,
      toolApiAuthToken,
      projectManagerId,
      maxRetryAttempts,
      {
        executeToolApiCallWithRetry: mockExecuteToolApiCallWithRetry,
        validateIssueDataForToolIntegration: mockValidateIssueData,
        normalizeIssueDataForExternalTool: mockNormalizeIssueData,
        verifyToolIntegrationDataConsistency: mockVerifyConsistency,
        recordToolIntegrationAuditLog: mockRecordAuditLog,
      }
    );

    expect(result.integrationStatus).toBe("partial_failure");
    expect(result.syncedIssueCount).toBe(5);
    expect(result.failedIssueCount).toBe(0);
    expect(result.duplicateIssuesMerged).toBe(5);
    expect(result.dataConsistencyValidationResult.isConsistent).toBe(true);
    expect(result.dataConsistencyValidationResult.fieldValidationPassed).toBe(true);
    expect(result.dataConsistencyValidationResult.statusMatchValidation).toBe(true);
    expect(result.retryAttemptsExecuted).toBe(0);
    expect(typeof result.integrationCompletedAt).toBe("string");
    expect(result.integrationCompletedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/
    );
    expect(result.managerNotificationRequired).toBe(false);
    expect(result.failureReasonIfAny).toBeNull();
  });
});