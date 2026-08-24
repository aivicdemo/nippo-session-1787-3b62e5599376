import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AgentInput, type Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('TX5 Imp1 Agent - Month-End Date Edge Case Handling', () => {
  test('SCEN-1252: Month-end report should extract and validate issues within correct single-day period range', async () => {
    const monthEndDate = new Date('2025-02-28T14:30:00Z');
    const reportingDateStr = '2025-02-28';

    const extractedIssueData = [
      {
        issueId: 'issue-001',
        originalText: 'Database performance degradation after month-end batch processing',
        reportedDate: reportingDateStr,
        reportedTime: '14:30',
        reporterId: 'engineer-001',
        teamId: 'team-alpha'
      },
      {
        issueId: 'issue-002',
        originalText: 'API timeout during month-end data synchronization',
        reportedDate: reportingDateStr,
        reportedTime: '14:35',
        reporterId: 'engineer-002',
        teamId: 'team-alpha'
      }
    ];

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 75,
      mediumThreshold: 50,
      lowThreshold: 0
    };

    const categoryMappings = [
      {
        issuePattern: 'performance|timeout|degradation',
        toolCategory: 'Infrastructure',
        toolCategoryId: 'CAT-001'
      },
      {
        issuePattern: 'database|api|synchronization',
        toolCategory: 'System Integration',
        toolCategoryId: 'CAT-002'
      }
    ];

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://jira.internal.example.com',
      authToken: 'mock-token-12345',
      projectKey: 'TEAM-ALPHA'
    };

    const validatedIssues = [
      {
        issueId: 'issue-001',
        priorityScore: 82,
        priorityRank: 'high' as const,
        category: 'Infrastructure',
        toolIssueId: null,
        validationStatus: 'valid' as const,
        extractionPeriodStart: '2025-02-28T00:00:00Z',
        extractionPeriodEnd: '2025-02-28T23:59:59Z'
      },
      {
        issueId: 'issue-002',
        priorityScore: 78,
        priorityRank: 'high' as const,
        category: 'System Integration',
        toolIssueId: null,
        validationStatus: 'valid' as const,
        extractionPeriodStart: '2025-02-28T00:00:00Z',
        extractionPeriodEnd: '2025-02-28T23:59:59Z'
      }
    ];

    const mockAiClient: Tx5Imp1AiClient = {
      validateAndClassifyIssues: jest.fn(async (input) => {
        return {
          issues: validatedIssues,
          classificationMetadata: {
            categorizedCount: 2,
            flaggedForManualReview: 0,
            confidenceScore: 0.92
          }
        };
      }),

      assessPriorityAndImpact: jest.fn(async (input) => {
        return {
          priorityAssessments: validatedIssues.map(issue => ({
            issueId: issue.issueId,
            priorityScore: issue.priorityScore,
            priorityRank: issue.priorityRank,
            impactAnalysis: {
              affectedSystems: 2,
              estimatedImpact: 'HIGH'
            }
          })),
          analysisTimestamp: '2025-02-28T15:00:00Z'
        };
      }),

      mapToToolCategories: jest.fn(async (input) => {
        return {
          mappedIssues: validatedIssues.map(issue => ({
            issueId: issue.issueId,
            toolCategory: issue.category,
            toolCategoryId: issue.category === 'Infrastructure' ? 'CAT-001' : 'CAT-002',
            mappingConfidence: 0.95
          })),
          unmappedCount: 0
        };
      }),

      prepareToolIntegration: jest.fn(async (input) => {
        return {
          readyForSync: true,
          integrationPayload: {
            issues: validatedIssues,
            syncTimestamp: '2025-02-28T15:00:00Z',
            targetSystem: 'jira',
            projectKey: 'TEAM-ALPHA'
          },
          validationErrors: []
        };
      })
    };

    const input: Tx5Imp1AgentInput = {
      extractedIssueData: extractedIssueData,
      toolIntegrationConfig: toolIntegrationConfig,
      priorityRules: priorityRules,
      categoryMappings: categoryMappings
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.validatedIssues).toHaveLength(2);
    expect(result.validatedIssues[0].issueId).toBe('issue-001');
    expect(result.validatedIssues[0].priorityScore).toBe(82);
    expect(result.validatedIssues[0].priorityRank).toBe('high');
    expect(result.validatedIssues[0].category).toBe('Infrastructure');
    expect(result.validatedIssues[0].validationStatus).toBe('valid');
    expect(result.validatedIssues[0].extractionPeriodStart).toBe('2025-02-28T00:00:00Z');
    expect(result.validatedIssues[0].extractionPeriodEnd).toBe('2025-02-28T23:59:59Z');

    expect(result.validatedIssues[1].issueId).toBe('issue-002');
    expect(result.validatedIssues[1].priorityScore).toBe(78);
    expect(result.validatedIssues[1].priorityRank).toBe('high');
    expect(result.validatedIssues[1].category).toBe('System Integration');
    expect(result.validatedIssues[1].validationStatus).toBe('valid');
    expect(result.validatedIssues[1].extractionPeriodStart).toBe('2025-02-28T00:00:00Z');
    expect(result.validatedIssues[1].extractionPeriodEnd).toBe('2025-02-28T23:59:59Z');

    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.successCount).toBeGreaterThanOrEqual(2);
    expect(result.integrationResult.failureCount).toBe(0);

    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.finalStatus).toBe('success');
    expect(result.executionSummary.totalProcessedIssues).toBe(2);
    expect(result.executionSummary.validIssuesCount).toBe(2);

    expect(mockAiClient.validateAndClassifyIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.validateAndClassifyIssues).toHaveBeenCalledWith(
      expect.objectContaining({
        extractedIssueData: extractedIssueData
      })
    );

    expect(mockAiClient.assessPriorityAndImpact).toHaveBeenCalledTimes(1);
    expect(mockAiClient.assessPriorityAndImpact).toHaveBeenCalledWith(
      expect.objectContaining({
        validatedIssues: expect.arrayContaining([
          expect.objectContaining({
            issueId: 'issue-001',
            extractionPeriodStart: '2025-02-28T00:00:00Z',
            extractionPeriodEnd: '2025-02-28T23:59:59Z'
          }),
          expect.objectContaining({
            issueId: 'issue-002',
            extractionPeriodStart: '2025-02-28T00:00:00Z',
            extractionPeriodEnd: '2025-02-28T23:59:59Z'
          })
        ])
      })
    );

    const extractionPeriodStarts = result.validatedIssues.map(issue => issue.extractionPeriodStart);
    const extractionPeriodEnds = result.validatedIssues.map(issue => issue.extractionPeriodEnd);

    extractionPeriodStarts.forEach(start => {
      expect(start).toBe('2025-02-28T00:00:00Z');
    });

    extractionPeriodEnds.forEach(end => {
      expect(end).toBe('2025-02-28T23:59:59Z');
    });

    extractionPeriodStarts.forEach((start, index) => {
      const startDate = new Date(start);
      const endDate = new Date(extractionPeriodEnds[index]);
      const diffInHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      expect(diffInHours).toBe(23.9999722222);
    });

    result.validatedIssues.forEach(issue => {
      const startDateObj = new Date(issue.extractionPeriodStart);
      const endDateObj = new Date(issue.extractionPeriodEnd);
      expect(startDateObj.getUTCDate()).toBe(28);
      expect(endDateObj.getUTCDate()).toBe(28);
      expect(startDateObj.getUTCMonth()).toBe(1);
      expect(endDateObj.getUTCMonth()).toBe(1);
      expect(startDateObj.getUTCFullYear()).toBe(2025);
      expect(endDateObj.getUTCFullYear()).toBe(2025);
    });

    const hasMultiDayRange = result.validatedIssues.some(issue => {
      const start = new Date(issue.extractionPeriodStart);
      const end = new Date(issue.extractionPeriodEnd);
      return start.getUTCDate() !== end.getUTCDate();
    });
    expect(hasMultiDayRange).toBe(false);
  });
});