import { runTx3Imp1Agent, type Tx3Imp1AiClient } from "../../src/agents/tx-3-imp-1/orchestrator";

describe("Tx3Imp1Agent - 日報集約から優先度別課題一覧提示までの自動判定・配信", () => {
  // SCEN-062
  test("should complete autonomous actions in order and send prioritized issue list email to manager", async () => {
    // Prepare test input data
    const reportAggregationId = "agg-20240115-001";
    const analysisExecutionTime = new Date("2024-01-15T11:00:00Z");
    const managerEmail = "manager@company.com";
    const priorityThresholds = {
      highPriorityMinScore: 75,
      mediumPriorityMinScore: 50,
    };

    // Mock AI client implementation
    const mockAiClient: Tx3Imp1AiClient = {
      action01ExtractKeywords: jest.fn().mockResolvedValue({
        keywords: ["API_ERROR", "DATABASE_TIMEOUT", "MEMORY_LEAK"],
        confidence: 0.92,
      }),

      action02ClassifyChallenges: jest.fn().mockResolvedValue({
        classified: [
          { keyword: "API_ERROR", category: "TECHNICAL", frequency: 3 },
          {
            keyword: "DATABASE_TIMEOUT",
            category: "PERFORMANCE",
            frequency: 2,
          },
          { keyword: "MEMORY_LEAK", category: "TECHNICAL", frequency: 1 },
        ],
      }),

      action03JudgePriority: jest.fn().mockResolvedValue({
        prioritized: [
          {
            keyword: "MEMORY_LEAK",
            category: "TECHNICAL",
            frequency: 1,
            impactScore: 85,
            priorityScore: 78,
            priorityLevel: "HIGH",
            color: "RED",
          },
          {
            keyword: "DATABASE_TIMEOUT",
            category: "PERFORMANCE",
            frequency: 2,
            impactScore: 65,
            priorityScore: 62,
            priorityLevel: "MEDIUM",
            color: "YELLOW",
          },
          {
            keyword: "API_ERROR",
            category: "TECHNICAL",
            frequency: 3,
            impactScore: 45,
            priorityScore: 48,
            priorityLevel: "LOW",
            color: "GREEN",
          },
        ],
      }),

      action04GeneratePrioritizedList: jest.fn().mockResolvedValue({
        prioritizedIssueList: [
          {
            rank: 1,
            keyword: "MEMORY_LEAK",
            category: "TECHNICAL",
            priorityLevel: "HIGH",
            color: "RED",
            priorityScore: 78,
            frequency: 1,
            recommendedAction: "Immediate investigation and patching required",
          },
          {
            rank: 2,
            keyword: "DATABASE_TIMEOUT",
            category: "PERFORMANCE",
            priorityLevel: "MEDIUM",
            color: "YELLOW",
            priorityScore: 62,
            frequency: 2,
            recommendedAction:
              "Review database query optimization and indexing strategy",
          },
          {
            rank: 3,
            keyword: "API_ERROR",
            category: "TECHNICAL",
            priorityLevel: "LOW",
            color: "GREEN",
            priorityScore: 48,
            frequency: 3,
            recommendedAction: "Monitor and log for pattern analysis",
          },
        ],
        generatedAt: "2024-01-15T11:00:30Z",
      }),

      action05SendEmail: jest.fn().mockResolvedValue({
        mailId: "mail-20240115-001",
        sentTo: managerEmail,
        sentAt: "2024-01-15T11:00:35Z",
        statusCode: 200,
        subject: "優先度別課題一覧 - 2024-01-15",
      }),

      recordAuditLog: jest.fn().mockResolvedValue({
        logId: "audit-20240115-001",
        recordedAt: "2024-01-15T11:00:40Z",
      }),
    };

    // Execute orchestrator
    const result = await runTx3Imp1Agent(
      {
        reportAggregationId,
        analysisExecutionTime,
        managerEmail,
        priorityThresholds,
      },
      mockAiClient
    );

    // Verify action execution order and parameters
    expect(mockAiClient.action01ExtractKeywords).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action01ExtractKeywords).toHaveBeenCalledWith(
      reportAggregationId
    );

    expect(mockAiClient.action02ClassifyChallenges).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action02ClassifyChallenges).toHaveBeenCalledWith(
      expect.objectContaining({
        keywords: ["API_ERROR", "DATABASE_TIMEOUT", "MEMORY_LEAK"],
      })
    );

    expect(mockAiClient.action03JudgePriority).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action03JudgePriority).toHaveBeenCalledWith(
      expect.objectContaining({
        priorityThresholds,
      })
    );

    expect(mockAiClient.action04GeneratePrioritizedList).toHaveBeenCalledTimes(
      1
    );

    expect(mockAiClient.action05SendEmail).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action05SendEmail).toHaveBeenCalledWith({
      managerEmail,
      prioritizedIssueList: expect.arrayContaining([
        expect.objectContaining({
          keyword: "MEMORY_LEAK",
          priorityLevel: "HIGH",
          color: "RED",
        }),
        expect.objectContaining({
          keyword: "DATABASE_TIMEOUT",
          priorityLevel: "MEDIUM",
          color: "YELLOW",
        }),
        expect.objectContaining({
          keyword: "API_ERROR",
          priorityLevel: "LOW",
          color: "GREEN",
        }),
      ]),
      executionTime: analysisExecutionTime,
    });

    // Verify audit log recording
    expect(mockAiClient.recordAuditLog).toHaveBeenCalledTimes(1);
    expect(mockAiClient.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "TX3_IMP1_COMPLETE",
        reportAggregationId,
        managerEmail,
      })
    );

    // Verify orchestrator return value
    expect(result).toMatchObject({
      extractedIssues: expect.arrayContaining([
        expect.objectContaining({
          keyword: "API_ERROR",
        }),
        expect.objectContaining({
          keyword: "DATABASE_TIMEOUT",
        }),
        expect.objectContaining({
          keyword: "MEMORY_LEAK",
        }),
      ]),
      prioritizedIssueList: expect.arrayContaining([
        expect.objectContaining({
          rank: 1,
          keyword: "MEMORY_LEAK",
          priorityScore: 78,
        }),
        expect.objectContaining({
          rank: 2,
          keyword: "DATABASE_TIMEOUT",
          priorityScore: 62,
        }),
        expect.objectContaining({
          rank: 3,
          keyword: "API_ERROR",
          priorityScore: 48,
        }),
      ]),
      emailSendStatus: expect.objectContaining({
        statusCode: 200,
        sentTo: managerEmail,
      }),
      executionTimestamp: expect.any(Date),
    });

    // Verify execution timestamp format (ISO 8601)
    expect(result.executionTimestamp.toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );

    // Verify prioritization order (scores descending: 78 > 62 > 48)
    expect(result.prioritizedIssueList[0].priorityScore).toBe(78);
    expect(result.prioritizedIssueList[1].priorityScore).toBe(62);
    expect(result.prioritizedIssueList[2].priorityScore).toBe(48);

    // Verify email was sent exactly once
    expect(mockAiClient.action05SendEmail).toHaveBeenCalledTimes(1);

    // Verify color coding matches priority thresholds
    // HIGH (78 >= 75): RED
    expect(result.prioritizedIssueList[0].color).toBe("RED");
    // MEDIUM (62 >= 50): YELLOW
    expect(result.prioritizedIssueList[1].color).toBe("YELLOW");
    // LOW (48 < 50): GREEN
    expect(result.prioritizedIssueList[2].color).toBe("GREEN");
  });
});