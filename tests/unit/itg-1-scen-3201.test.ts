import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import {
  buildAction01Prompt,
  ACTION_01_PROMPT_VERSION,
} from '../../src/agents/tx-8-imp-1/prompts/action-01';
import {
  buildAction02Prompt,
  ACTION_02_PROMPT_VERSION,
} from '../../src/agents/tx-8-imp-1/prompts/action-02';
import {
  buildAction03Prompt,
  ACTION_03_PROMPT_VERSION,
} from '../../src/agents/tx-8-imp-1/prompts/action-03';
import {
  buildAction04Prompt,
  ACTION_04_PROMPT_VERSION,
} from '../../src/agents/tx-8-imp-1/prompts/action-04';
import {
  buildAction05Prompt,
  ACTION_05_PROMPT_VERSION,
} from '../../src/agents/tx-8-imp-1/prompts/action-05';

describe('Tx8Imp1Agent: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-3201
  test('should execute complete autonomous actions from issue search to visualization report creation', async () => {
    const analysisStartDate = '2024-10-01T00:00:00Z';
    const analysisEndDate = '2024-12-31T23:59:59Z';
    const teamIds = ['team-001', 'team-002'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const mockIssueData = [
      {
        issueId: 'issue-001',
        issueDate: '2024-10-05T09:00:00Z',
        category: 'quality',
        description: 'Test case coverage insufficient',
        status: 'open',
      },
      {
        issueId: 'issue-002',
        issueDate: '2024-10-12T09:15:00Z',
        category: 'quality',
        description: 'Test coverage needs improvement',
        status: 'open',
      },
      {
        issueId: 'issue-003',
        issueDate: '2024-10-19T08:45:00Z',
        category: 'quality',
        description: 'Insufficient test cases in module',
        status: 'open',
      },
      {
        issueId: 'issue-004',
        issueDate: '2024-10-26T10:00:00Z',
        category: 'schedule',
        description: 'Delay in API integration',
        status: 'open',
      },
      {
        issueId: 'issue-005',
        issueDate: '2024-11-02T09:30:00Z',
        category: 'schedule',
        description: 'Schedule slippage on delivery',
        status: 'open',
      },
      {
        issueId: 'issue-006',
        issueDate: '2024-11-09T08:00:00Z',
        category: 'quality',
        description: 'Code review findings not addressed',
        status: 'open',
      },
      {
        issueId: 'issue-007',
        issueDate: '2024-11-16T11:20:00Z',
        category: 'communication',
        description: 'Missing status updates in reports',
        status: 'closed',
      },
      {
        issueId: 'issue-008',
        issueDate: '2024-11-23T09:45:00Z',
        category: 'quality',
        description: 'Test failures in regression suite',
        status: 'open',
      },
      {
        issueId: 'issue-009',
        issueDate: '2024-11-30T14:30:00Z',
        category: 'schedule',
        description: 'Milestone deadline at risk',
        status: 'open',
      },
      {
        issueId: 'issue-010',
        issueDate: '2024-12-07T10:15:00Z',
        category: 'quality',
        description: 'Defect escape in UAT phase',
        status: 'open',
      },
      {
        issueId: 'issue-011',
        issueDate: '2024-12-14T09:00:00Z',
        category: 'quality',
        description: 'Test automation gaps identified',
        status: 'open',
      },
      {
        issueId: 'issue-012',
        issueDate: '2024-12-21T13:45:00Z',
        category: 'schedule',
        description: 'Resource allocation conflict',
        status: 'open',
      },
    ];

    const mockAction01Result = {
      extractedIssues: [
        {
          issueId: 'issue-001',
          issueDate: '2024-10-05T09:00:00Z',
          category: 'quality',
          keyword: 'test_coverage',
        },
        {
          issueId: 'issue-002',
          issueDate: '2024-10-12T09:15:00Z',
          category: 'quality',
          keyword: 'test_coverage',
        },
        {
          issueId: 'issue-003',
          issueDate: '2024-10-19T08:45:00Z',
          category: 'quality',
          keyword: 'test_coverage',
        },
        {
          issueId: 'issue-004',
          issueDate: '2024-10-26T10:00:00Z',
          category: 'schedule',
          keyword: 'api_integration_delay',
        },
        {
          issueId: 'issue-005',
          issueDate: '2024-11-02T09:30:00Z',
          category: 'schedule',
          keyword: 'schedule_slippage',
        },
        {
          issueId: 'issue-006',
          issueDate: '2024-11-09T08:00:00Z',
          category: 'quality',
          keyword: 'code_review',
        },
        {
          issueId: 'issue-008',
          issueDate: '2024-11-23T09:45:00Z',
          category: 'quality',
          keyword: 'test_coverage',
        },
        {
          issueId: 'issue-009',
          issueDate: '2024-11-30T14:30:00Z',
          category: 'schedule',
          keyword: 'milestone_deadline',
        },
        {
          issueId: 'issue-010',
          issueDate: '2024-12-07T10:15:00Z',
          category: 'quality',
          keyword: 'test_coverage',
        },
        {
          issueId: 'issue-011',
          issueDate: '2024-12-14T09:00:00Z',
          category: 'quality',
          keyword: 'test_automation',
        },
        {
          issueId: 'issue-012',
          issueDate: '2024-12-21T13:45:00Z',
          category: 'schedule',
          keyword: 'resource_allocation',
        },
      ],
      totalIssuesFound: 11,
    };

    const mockAction02Result = {
      recurringPatterns: [
        {
          patternId: 'pattern-001',
          keyword: 'test_coverage',
          occurrenceCount: 5,
          occurrenceDates: [
            '2024-10-05T09:00:00Z',
            '2024-10-12T09:15:00Z',
            '2024-10-19T08:45:00Z',
            '2024-11-23T09:45:00Z',
            '2024-12-07T10:15:00Z',
          ],
          timeSeriesPattern: 'increasing_trend',
          confidenceScore: 92,
        },
        {
          patternId: 'pattern-002',
          keyword: 'schedule_delay',
          occurrenceCount: 4,
          occurrenceDates: [
            '2024-10-26T10:00:00Z',
            '2024-11-02T09:30:00Z',
            '2024-11-30T14:30:00Z',
            '2024-12-21T13:45:00Z',
          ],
          timeSeriesPattern: 'cyclical_weekly',
          confidenceScore: 88,
        },
      ],
      patternsDetected: 2,
    };

    const mockAction03Result = {
      bottleneckPatterns: [
        {
          patternId: 'bottleneck-001',
          patternName: 'Test Coverage Crisis',
          changeType: 'escalating_recurrence',
          impactScore: 85,
          affectedAreas: ['quality', 'development'],
          recommendedActionSequence: [1, 2, 3],
          startDate: '2024-10-05T09:00:00Z',
          latestDate: '2024-12-07T10:15:00Z',
        },
        {
          patternId: 'bottleneck-002',
          patternName: 'Schedule Pressure',
          changeType: 'cyclical_recurrence',
          impactScore: 78,
          affectedAreas: ['schedule', 'resource'],
          recommendedActionSequence: [1, 2],
          startDate: '2024-10-26T10:00:00Z',
          latestDate: '2024-12-21T13:45:00Z',
        },
      ],
      bottlenecksIdentified: 2,
    };

    const mockAction04Result = {
      reportId: 'report-20241231-001',
      reportFormat: 'json',
      visualizationGraphs: [
        {
          graphType: 'line',
          title: 'Issue Recurrence Trend Over Time',
          dataPoints: [
            { date: '2024-10-05', count: 1, category: 'quality' },
            { date: '2024-10-12', count: 2, category: 'quality' },
            { date: '2024-10-19', count: 3, category: 'quality' },
            { date: '2024-10-26', count: 1, category: 'schedule' },
            { date: '2024-11-02', count: 2, category: 'schedule' },
            { date: '2024-11-09', count: 4, category: 'quality' },
            { date: '2024-11-23', count: 5, category: 'quality' },
            { date: '2024-11-30', count: 3, category: 'schedule' },
            { date: '2024-12-07', count: 6, category: 'quality' },
            { date: '2024-12-14', count: 7, category: 'quality' },
            { date: '2024-12-21', count: 4, category: 'schedule' },
          ],
        },
        {
          graphType: 'bar',
          title: 'Issue Count by Category',
          dataPoints: [
            { category: 'quality', count: 7, color: '#FF6B6B' },
            { category: 'schedule', count: 4, color: '#FFA500' },
          ],
        },
        {
          graphType: 'heatmap',
          title: 'Issue Density Heatmap by Week',
          dataPoints: [
            { week: 'Week 41', density: 3, intensity: 0.6 },
            { week: 'Week 42', density: 1, intensity: 0.2 },
            { week: 'Week 43', density: 2, intensity: 0.4 },
            { week: 'Week 44', density: 1, intensity: 0.2 },
            { week: 'Week 45', density: 1, intensity: 0.2 },
            { week: 'Week 46', density: 2, intensity: 0.4 },
            { week: 'Week 47', density: 2, intensity: 0.4 },
            { week: 'Week 48', density: 2, intensity: 0.4 },
            { week: 'Week 49', density: 2, intensity: 0.4 },
            { week: 'Week 50', density: 1, intensity: 0.2 },
            { week: 'Week 51', density: 1, intensity: 0.2 },
          ],
        },
      ],
      reportContent: {
        summary: 'Comprehensive analysis of issue patterns from Oct-Dec 2024',
        bottleneckSections: [
          {
            sectionId: 'section-001',
            title: 'Test Coverage Crisis Analysis',
            description: 'Recurring quality issues related to test coverage gaps',
          },
          {
            sectionId: 'section-002',
            title: 'Schedule Pressure Analysis',
            description: 'Cyclical scheduling delays affecting project milestones',
          },
        ],
      },
      generatedAt: '2024-12-31T15:30:00Z',
      qualityScore: 0.87,
    };

    const mockAction05Result = {
      prioritizedIssues: [
        {
          issueId: 'issue-010',
          priorityRank: 1,
          priorityScore: 95,
          highlightFlag: true,
          recommendedActionDate: '2024-12-28T00:00:00Z',
          rationale: 'Most recent defect escape with highest recurrence pattern',
        },
        {
          issueId: 'issue-012',
          priorityRank: 2,
          priorityScore: 88,
          highlightFlag: true,
          recommendedActionDate: '2024-12-29T00:00:00Z',
          rationale: 'Resource constraint impacting multiple milestones',
        },
        {
          issueId: 'issue-011',
          priorityRank: 3,
          priorityScore: 82,
          highlightFlag: true,
          recommendedActionDate: '2024-12-30T00:00:00Z',
          rationale: 'Test automation gaps requiring systematic resolution',
        },
        {
          issueId: 'issue-009',
          priorityRank: 4,
          priorityScore: 75,
          highlightFlag: false,
          recommendedActionDate: '2024-12-31T00:00:00Z',
          rationale: 'Milestone deadline manageable with focused effort',
        },
        {
          issueId: 'issue-006',
          priorityRank: 5,
          priorityScore: 68,
          highlightFlag: false,
          recommendedActionDate: '2025-01-02T00:00:00Z',
          rationale: 'Code review findings lower urgency at current phase',
        },
      ],
      prioritizedCount: 5,
    };

    const mockAiClient = {
      callAction01_ExtractIssues: jest.fn().mockResolvedValue(mockAction01Result),
      callAction02_AnalyzeTimeSeriesPattern: jest
        .fn()
        .mockResolvedValue(mockAction02Result),
      callAction03_IdentifyBottleneckPatterns: jest
        .fn()
        .mockResolvedValue(mockAction03Result),
      callAction04_GenerateVisualizationReport: jest
        .fn()
        .mockResolvedValue(mockAction04Result),
      callAction05_ExtractPrioritizedIssues: jest
        .fn()
        .mockResolvedValue(mockAction05Result),
    };

    const result = await runTx8Imp1Agent(
      {
        analysisStartDate,
        analysisEndDate,
        teamIds,
        minimumRecurrenceThreshold,
        recipientManagerId,
      },
      mockAiClient as any
    );

    expect(mockAiClient.callAction01_ExtractIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction01_ExtractIssues).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.any(String),
        promptVersion: ACTION_01_PROMPT_VERSION,
        issueDataContext: expect.any(Array),
      })
    );

    expect(mockAiClient.callAction02_AnalyzeTimeSeriesPattern).toHaveBeenCalledTimes(
      1
    );
    expect(mockAiClient.callAction02_AnalyzeTimeSeriesPattern).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.any(String),
        promptVersion: ACTION_02_PROMPT_VERSION,
        extractedIssuesContext: mockAction01Result.extractedIssues,
      })
    );

    expect(mockAiClient.callAction03_IdentifyBottleneckPatterns).toHaveBeenCalledTimes(
      1
    );
    expect(mockAiClient.callAction03_IdentifyBottleneckPatterns).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.any(String),
        promptVersion: ACTION_03_PROMPT_VERSION,
        patternAnalysisContext: mockAction02Result.recurringPatterns,
      })
    );

    expect(mockAiClient.callAction04_GenerateVisualizationReport).toHaveBeenCalledTimes(
      1
    );
    expect(mockAiClient.callAction04_GenerateVisualizationReport).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.any(String),
        promptVersion: ACTION_04_PROMPT_VERSION,
        bottleneckPatternsContext: mockAction03Result.bottleneckPatterns,
      })
    );

    expect(mockAiClient.callAction05_ExtractPrioritizedIssues).toHaveBeenCalledTimes(
      1
    );
    expect(mockAiClient.callAction05_ExtractPrioritizedIssues).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.any(String),
        promptVersion: ACTION_05_PROMPT_VERSION,
        reportContentContext: expect.any(Object),
      })
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBe('report-20241231-001');
    expect(result.recurringIssuePatterns).toHaveLength(2);
    expect(result.recurringIssuePatterns[0]).toEqual(
      expect.objectContaining({
        issueKeyword: 'test_coverage',
        occurrenceCount: 5,
        timeSeriesPattern: 'increasing_trend',
        priorityScore: 95,
      })
    );
    expect(result.recurringIssuePatterns[1]).toEqual(
      expect.objectContaining({
        issueKeyword: 'schedule_delay',
        occurrenceCount: 4,
        timeSeriesPattern: 'cyclical_weekly',
        priorityScore: 88,
      })
    );

    expect(result.visualizationGraphs).toHaveLength(3);
    expect(result.visualizationGraphs[0]).toEqual(
      expect.objectContaining({
        graphType: 'line',
        title: 'Issue Recurrence Trend Over Time',
        dataPoints: expect.any(Array),
      })
    );
    expect(result.visualizationGraphs[1]).toEqual(
      expect.objectContaining({
        graphType: 'bar',
        title: 'Issue Count by Category',
        dataPoints: expect.any(Array),
      })
    );
    expect(result.visualizationGraphs[2]).toEqual(
      expect.objectContaining({
        graphType: 'heatmap',
        title: 'Issue Density Heatmap by Week',
        dataPoints: expect.any(Array),
      })
    );

    expect(result.emailSentAt).toBeDefined();
    expect(new Date(result.emailSentAt).getTime()).toBeGreaterThan(0);

    const emailSentTime = new Date(result.emailSentAt);
    expect(emailSentTime.toISOString()).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(result).toEqual(
      expect.objectContaining({
        reportId: expect.any(String),
        recurringIssuePatterns: expect.arrayContaining([
          expect.objectContaining({
            issueKeyword: expect.any(String),
            occurrenceCount: expect.any(Number),
            timeSeriesPattern: expect.any(String),
            priorityScore: expect.any(Number),
          }),
        ]),
        visualizationGraphs: expect.arrayContaining([
          expect.objectContaining({
            graphType: expect.any(String),
            title: expect.any(String),
            dataPoints: expect.any(Array),
          }),
        ]),
        emailSentAt: expect.any(String),
      })
    );
  });
});