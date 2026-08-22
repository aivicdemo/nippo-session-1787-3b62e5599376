import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import { type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import { type Tx9AggregationRequest, type Tx9AnalysisReport } from '../../src/types/tx9';

describe('Tx9Imp1Agent', () => {
  test('SCEN-166: orchestrator executes actions 1-7 in sequence and generates analysis report with mocked AI client', async () => {
    // Initialize execution log to track action sequence
    const executionLog: string[] = [];

    // Mock AI client implementing Tx9Imp1AiClient interface
    const mockedAiClient: Tx9Imp1AiClient = {
      executeAction01: jest.fn(async (prompt: string) => {
        executionLog.push('Action 1: aggregate daily reports');
        return {
          aggregatedReportsCount: 100,
          successCount: 90,
          failedCount: 10,
          timestamp: '2024-01-31T09:00:00Z',
        };
      }),

      executeAction02: jest.fn(async (prompt: string) => {
        executionLog.push('Action 2: send reminder notifications');
        return {
          remindersSentCount: 10,
          notificationTimestamp: '2024-01-31T09:15:00Z',
        };
      }),

      executeAction03: jest.fn(async (prompt: string) => {
        executionLog.push('Action 3: quantify productivity metrics');
        return {
          totalIssueCount: 45,
          averageResolutionDays: 2.3,
          responseSpeedScore: 78,
          metricsCalculatedAt: '2024-01-31T09:30:00Z',
        };
      }),

      executeAction04: jest.fn(async (prompt: string) => {
        executionLog.push('Action 4: classify issues by priority');
        return {
          highPriorityCount: 5,
          mediumPriorityCount: 12,
          lowPriorityCount: 28,
          classificationTimestamp: '2024-01-31T09:45:00Z',
        };
      }),

      executeAction05: jest.fn(async (prompt: string) => {
        executionLog.push('Action 5: detect recurrence patterns');
        return {
          detectedPatterns: [
            {
              patternName: 'database error',
              occurrenceCount: 3,
              lastOccurrence: '2024-01-30T14:22:00Z',
            },
            {
              patternName: 'api timeout',
              occurrenceCount: 2,
              lastOccurrence: '2024-01-29T11:15:00Z',
            },
            {
              patternName: 'cache miss',
              occurrenceCount: 2,
              lastOccurrence: '2024-01-28T16:45:00Z',
            },
          ],
          patternsDetectedAt: '2024-01-31T10:00:00Z',
        };
      }),

      executeAction06: jest.fn(async (prompt: string) => {
        executionLog.push('Action 6: propose countermeasures');
        return {
          proposals: [
            {
              proposalId: 'measure-001',
              title: 'implement connection pool',
              rationale: 'reduces database connection overhead',
              expectedImpact: 'high',
            },
            {
              proposalId: 'measure-002',
              title: 'add api retry logic',
              rationale: 'handles transient timeout failures',
              expectedImpact: 'high',
            },
            {
              proposalId: 'measure-003',
              title: 'configure cache ttl',
              rationale: 'prevents stale cache data',
              expectedImpact: 'medium',
            },
            {
              proposalId: 'measure-004',
              title: 'add monitoring alerts',
              rationale: 'enables early detection of degradation',
              expectedImpact: 'medium',
            },
            {
              proposalId: 'measure-005',
              title: 'document incident procedures',
              rationale: 'standardizes response to recurring issues',
              expectedImpact: 'low',
            },
          ],
          proposalsGeneratedAt: '2024-01-31T10:15:00Z',
        };
      }),

      executeAction07: jest.fn(async (prompt: string) => {
        executionLog.push('Action 7: create analysis report for director');
        const report: Tx9AnalysisReport = {
          reportId: 'report-tx9-20240131-001',
          aggregationPeriod: {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
          productivityMetrics: {
            issueResolutionSpeed: 2.3,
            reportSubmissionRate: 90,
            issueRecurrenceRate: 15,
          },
          prioritizedIssues: [
            {
              issueId: 'issue-001',
              title: 'critical database connection pool exhaustion',
              priority: 'high',
              priorityScore: 95,
            },
            {
              issueId: 'issue-002',
              title: 'api service timeout patterns increasing',
              priority: 'high',
              priorityScore: 88,
            },
            {
              issueId: 'issue-003',
              title: 'cache invalidation inconsistency',
              priority: 'high',
              priorityScore: 82,
            },
            {
              issueId: 'issue-004',
              title: 'moderate performance degradation',
              priority: 'medium',
              priorityScore: 65,
            },
            {
              issueId: 'issue-005',
              title: 'low priority logging issues',
              priority: 'low',
              priorityScore: 30,
            },
          ],
          recommendedCountermeasures: [
            {
              measureId: 'measure-001',
              title: 'implement connection pool',
              rationale: 'reduces database connection overhead',
              estimatedImplementationDays: 3,
              expectedBenefit: 'eliminates connection exhaustion incidents',
            },
            {
              measureId: 'measure-002',
              title: 'add api retry logic',
              rationale: 'handles transient timeout failures',
              estimatedImplementationDays: 2,
              expectedBenefit: 'reduces timeout-related errors by 80%',
            },
            {
              measureId: 'measure-003',
              title: 'configure cache ttl',
              rationale: 'prevents stale cache data',
              estimatedImplementationDays: 1,
              expectedBenefit: 'improves cache hit rate by 25%',
            },
            {
              measureId: 'measure-004',
              title: 'add monitoring alerts',
              rationale: 'enables early detection of degradation',
              estimatedImplementationDays: 2,
              expectedBenefit: 'reduces mean time to detection by 60%',
            },
            {
              measureId: 'measure-005',
              title: 'document incident procedures',
              rationale: 'standardizes response to recurring issues',
              estimatedImplementationDays: 1,
              expectedBenefit: 'reduces mean time to resolution by 30%',
            },
          ],
          generatedAt: '2024-01-31T10:30:00Z',
        };
        return report;
      }),
    };

    // Prepare aggregation request input
    const aggregationRequest: Tx9AggregationRequest = {
      aggregationStartDate: '2024-01-01',
      aggregationEndDate: '2024-01-31',
      targetTeamIds: [],
      requestedByUserId: 'director-001',
    };

    // Execute orchestrator with mocked AI client
    const result = await runTx9Imp1Agent(aggregationRequest, mockedAiClient);

    // Verify action execution sequence
    expect(executionLog.length).toBe(7);
    expect(executionLog[0]).toBe('Action 1: aggregate daily reports');
    expect(executionLog[1]).toBe('Action 2: send reminder notifications');
    expect(executionLog[2]).toBe('Action 3: quantify productivity metrics');
    expect(executionLog[3]).toBe('Action 4: classify issues by priority');
    expect(executionLog[4]).toBe('Action 5: detect recurrence patterns');
    expect(executionLog[5]).toBe('Action 6: propose countermeasures');
    expect(executionLog[6]).toBe('Action 7: create analysis report for director');

    // Verify report structure and content
    expect(result).toBeDefined();
    expect(result.reportId).toBe('report-tx9-20240131-001');
    expect(result.aggregationPeriod.startDate).toBe('2024-01-01');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-31');

    // Verify productivity metrics
    expect(result.productivityMetrics.issueResolutionSpeed).toBe(2.3);
    expect(result.productivityMetrics.reportSubmissionRate).toBe(90);
    expect(result.productivityMetrics.issueRecurrenceRate).toBe(15);

    // Verify prioritized issues count and priority classification
    expect(result.prioritizedIssues.length).toBe(5);
    const highPriorityIssues = result.prioritizedIssues.filter(
      (issue) => issue.priority === 'high',
    );
    expect(highPriorityIssues.length).toBe(3);
    const mediumPriorityIssues = result.prioritizedIssues.filter(
      (issue) => issue.priority === 'medium',
    );
    expect(mediumPriorityIssues.length).toBe(1);
    const lowPriorityIssues = result.prioritizedIssues.filter(
      (issue) => issue.priority === 'low',
    );
    expect(lowPriorityIssues.length).toBe(1);

    // Verify priority scores are present and numeric
    result.prioritizedIssues.forEach((issue) => {
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
    });

    // Verify recommended countermeasures
    expect(result.recommendedCountermeasures.length).toBe(5);
    result.recommendedCountermeasures.forEach((measure) => {
      expect(measure.measureId).toBeDefined();
      expect(measure.title).toBeDefined();
      expect(measure.rationale).toBeDefined();
      expect(measure.estimatedImplementationDays).toBeGreaterThan(0);
      expect(measure.expectedBenefit).toBeDefined();
    });

    // Verify report generation timestamp
    expect(result.generatedAt).toBe('2024-01-31T10:30:00Z');

    // Verify AI client methods were called
    expect(mockedAiClient.executeAction01).toHaveBeenCalled();
    expect(mockedAiClient.executeAction02).toHaveBeenCalled();
    expect(mockedAiClient.executeAction03).toHaveBeenCalled();
    expect(mockedAiClient.executeAction04).toHaveBeenCalled();
    expect(mockedAiClient.executeAction05).toHaveBeenCalled();
    expect(mockedAiClient.executeAction06).toHaveBeenCalled();
    expect(mockedAiClient.executeAction07).toHaveBeenCalled();

    // Verify that all prompts were executed (actions received prompts)
    expect(mockedAiClient.executeAction01).toHaveBeenCalledWith(expect.any(String));
    expect(mockedAiClient.executeAction07).toHaveBeenCalledWith(expect.any(String));
  });
});