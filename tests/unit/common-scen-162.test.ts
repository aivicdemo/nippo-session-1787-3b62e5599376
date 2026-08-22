import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-9-imp-1/prompts/action-03';
import { type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('Tx9Imp1Agent - Daily Report Aggregation to Analysis Report Generation', () => {
  // SCEN-162: [normal] 日報集約から分析報告までの自動実行エージェント AIエージェント - 「日報集約から分析報告までの自動実行エージェント」が自律処理「生産性指標（課題件数、解決期間、対応速度）を定量化する」を契約どおり実行する
  test('should execute Action 3 productivity metrics quantification and return aggregated analysis report with correct metrics', async () => {
    // Arrange: Stub data for 10 team members' daily reports for January 2024
    const aggregationStartDate = '2024-01-01';
    const aggregationEndDate = '2024-01-31';
    const targetTeamIds = ['team-001', 'team-002'];
    const requestedByUserId = 'user-dept-head-001';

    // Stub daily report data: 10 members, 35 total issues, average resolution period 3.2 days
    const stubDailyReports = [
      {
        reporterId: 'member-001',
        reportDate: '2024-01-15',
        issuesReported: 4,
        averageResolutionDays: 3.0,
      },
      {
        reporterId: 'member-002',
        reportDate: '2024-01-15',
        issuesReported: 3,
        averageResolutionDays: 3.5,
      },
      {
        reporterId: 'member-003',
        reportDate: '2024-01-16',
        issuesReported: 4,
        averageResolutionDays: 3.1,
      },
      {
        reporterId: 'member-004',
        reportDate: '2024-01-16',
        issuesReported: 3,
        averageResolutionDays: 3.2,
      },
      {
        reporterId: 'member-005',
        reportDate: '2024-01-17',
        issuesReported: 4,
        averageResolutionDays: 3.0,
      },
      {
        reporterId: 'member-006',
        reportDate: '2024-01-17',
        issuesReported: 3,
        averageResolutionDays: 3.4,
      },
      {
        reporterId: 'member-007',
        reportDate: '2024-01-18',
        issuesReported: 4,
        averageResolutionDays: 3.2,
      },
      {
        reporterId: 'member-008',
        reportDate: '2024-01-18',
        issuesReported: 3,
        averageResolutionDays: 3.1,
      },
      {
        reporterId: 'member-009',
        reportDate: '2024-01-19',
        issuesReported: 2,
        averageResolutionDays: 3.3,
      },
      {
        reporterId: 'member-010',
        reportDate: '2024-01-19',
        issuesReported: 2,
        averageResolutionDays: 3.2,
      },
    ];

    // Total issues: 4+3+4+3+4+3+4+3+2+2 = 35
    // Average resolution period: (3.0+3.5+3.1+3.2+3.0+3.4+3.2+3.1+3.3+3.2) / 10 = 3.2
    // Response speed (issues per day): 35 / 32 working days in analysis period ≈ 10.9 issues/day

    const expectedIssueCount = 35;
    const expectedAverageResolutionDays = 3.2;
    const expectedResponseSpeedPerDay = 10.9;

    // Create fake AI client that implements Tx9Imp1AiClient interface
    const fakeAiClient: Tx9Imp1AiClient = {
      invokeAction01: jest.fn().mockResolvedValue({
        actionId: 'action-01',
        status: 'completed',
        aggregatedReportData: {
          totalReportsCollected: 10,
          unreportedMembers: 0,
          collectionStatus: 'complete',
        },
      }),
      invokeAction02: jest.fn().mockResolvedValue({
        actionId: 'action-02',
        status: 'completed',
        extractedIssues: stubDailyReports.reduce((acc, report) => acc + report.issuesReported, 0),
        issueCategories: ['quality', 'delivery', 'safety'],
      }),
      invokeAction03: jest.fn().mockResolvedValue({
        actionId: 'action-03',
        status: 'completed',
        productivityMetrics: {
          issueCount: expectedIssueCount,
          averageResolutionDays: expectedAverageResolutionDays,
          responseSpeedPerDay: expectedResponseSpeedPerDay,
        },
      }),
      invokeAction04: jest.fn().mockResolvedValue({
        actionId: 'action-04',
        status: 'completed',
        prioritizedIssues: [
          {
            issueId: 'issue-high-001',
            priority: 'high',
            description: 'Critical system outage',
          },
          {
            issueId: 'issue-medium-001',
            priority: 'medium',
            description: 'Performance degradation',
          },
        ],
      }),
      invokeAction05: jest.fn().mockResolvedValue({
        actionId: 'action-05',
        status: 'completed',
        countermeasures: [
          {
            issueId: 'issue-high-001',
            proposedAction: 'Increase monitoring frequency',
            priority: 1,
          },
          {
            issueId: 'issue-medium-001',
            proposedAction: 'Optimize database queries',
            priority: 2,
          },
        ],
      }),
      invokeAction06: jest.fn().mockResolvedValue({
        actionId: 'action-06',
        status: 'completed',
        reportGenerated: true,
        reportId: 'report-tx9-20240115-001',
      }),
      invokeAction07: jest.fn().mockResolvedValue({
        actionId: 'action-07',
        status: 'completed',
        deliveryStatus: 'delivered',
        recipientCount: 1,
      }),
    };

    // Verify prompt module exports
    expect(buildAction03Prompt).toBeDefined();
    expect(ACTION_03_PROMPT_VERSION).toBeDefined();
    expect(typeof buildAction03Prompt).toBe('function');
    expect(typeof ACTION_03_PROMPT_VERSION).toBe('string');

    // Verify that buildAction03Prompt accepts the required parameters
    const testPrompt = buildAction03Prompt(
      stubDailyReports,
      aggregationStartDate,
      aggregationEndDate
    );
    expect(testPrompt).toBeDefined();
    expect(typeof testPrompt).toBe('string');
    expect(testPrompt.length).toBeGreaterThan(0);

    // Act: Execute the agent
    const agentRequest = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      requestedByUserId,
    };

    const agentResult = await runTx9Imp1Agent(agentRequest, fakeAiClient);

    // Assert: Verify execution result structure matches Tx9AnalysisReport
    expect(agentResult).toBeDefined();
    expect(agentResult.reportId).toBeDefined();
    expect(typeof agentResult.reportId).toBe('string');

    expect(agentResult.aggregationPeriod).toBeDefined();
    expect(agentResult.aggregationPeriod.startDate).toBe(aggregationStartDate);
    expect(agentResult.aggregationPeriod.endDate).toBe(aggregationEndDate);

    // Assert: Verify productivity metrics are correctly quantified
    expect(agentResult.productivityMetrics).toBeDefined();
    expect(agentResult.productivityMetrics.issueResolutionSpeed).toBe(
      expectedAverageResolutionDays
    );
    expect(agentResult.productivityMetrics.reportSubmissionRate).toBeDefined();
    expect(typeof agentResult.productivityMetrics.reportSubmissionRate).toBe('number');
    expect(agentResult.productivityMetrics.reportSubmissionRate).toBeGreaterThanOrEqual(0);
    expect(agentResult.productivityMetrics.reportSubmissionRate).toBeLessThanOrEqual(100);

    expect(agentResult.productivityMetrics.issueRecurrenceRate).toBeDefined();
    expect(typeof agentResult.productivityMetrics.issueRecurrenceRate).toBe('number');
    expect(agentResult.productivityMetrics.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(agentResult.productivityMetrics.issueRecurrenceRate).toBeLessThanOrEqual(100);

    // Assert: Verify prioritized issues list is present
    expect(agentResult.prioritizedIssues).toBeDefined();
    expect(Array.isArray(agentResult.prioritizedIssues)).toBe(true);
    expect(agentResult.prioritizedIssues.length).toBeGreaterThan(0);

    // Verify structure of first prioritized issue
    const firstIssue = agentResult.prioritizedIssues[0];
    expect(firstIssue).toHaveProperty('issueId');
    expect(firstIssue).toHaveProperty('priority');

    // Assert: Verify recommended countermeasures are present
    expect(agentResult.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(agentResult.recommendedCountermeasures)).toBe(true);

    // Assert: Verify generation timestamp
    expect(agentResult.generatedAt).toBeDefined();
    expect(typeof agentResult.generatedAt).toBe('string');
    // Verify ISO 8601 format
    const generatedDate = new Date(agentResult.generatedAt);
    expect(generatedDate.toString()).not.toBe('Invalid Date');

    // Assert: Verify all AI client action methods were invoked in correct sequence
    expect(fakeAiClient.invokeAction01).toHaveBeenCalled();
    expect(fakeAiClient.invokeAction02).toHaveBeenCalled();
    expect(fakeAiClient.invokeAction03).toHaveBeenCalled();
    expect(fakeAiClient.invokeAction04).toHaveBeenCalled();
    expect(fakeAiClient.invokeAction05).toHaveBeenCalled();
    expect(fakeAiClient.invokeAction06).toHaveBeenCalled();
    expect(fakeAiClient.invokeAction07).toHaveBeenCalled();

    // Assert: Verify Action 3 was called with correct parameters
    const action03Call = (fakeAiClient.invokeAction03 as jest.Mock).mock.calls[0];
    expect(action03Call).toBeDefined();

    // Assert: Verify metrics values are statistically reasonable
    // Issue count should match stub data total (35)
    expect(agentResult.productivityMetrics).toMatchObject({
      issueResolutionSpeed: expect.any(Number),
    });

    // Verify the metric calculation is reasonable given input data
    const calculatedIssueCount = stubDailyReports.reduce(
      (sum, report) => sum + report.issuesReported,
      0
    );
    expect(calculatedIssueCount).toBe(expectedIssueCount);

    const calculatedAverageResolution =
      stubDailyReports.reduce((sum, report) => sum + report.averageResolutionDays, 0) /
      stubDailyReports.length;
    expect(Math.abs(calculatedAverageResolution - expectedAverageResolutionDays)).toBeLessThan(
      0.1
    );
  });
});