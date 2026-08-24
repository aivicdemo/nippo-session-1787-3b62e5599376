import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern, type VisualizationGraph } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: ボトルネック変化パターン可視化レポート生成機能', () => {
  // SCEN-2009
  test('影響度スコア49（閾値未満）のときボトルネック軽微と判定される', async () => {
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-31';
    const teamIds = ['team-001', 'team-002'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const input: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const mockAiClient: Tx8Imp1AiClient = {
      buildAction01Prompt: jest.fn().mockResolvedValue({
        prompt: 'Extract recurring issue patterns...',
        version: '1.0.0',
      }),
      buildAction02Prompt: jest.fn().mockResolvedValue({
        prompt: 'Analyze time series patterns...',
        version: '1.0.0',
      }),
      buildAction03Prompt: jest.fn().mockResolvedValue({
        prompt:
          'Classify bottleneck patterns. Impact score 49 is below threshold 50. Classify as Minor Bottleneck.',
        version: '1.0.0',
      }),
      buildAction04Prompt: jest.fn().mockResolvedValue({
        prompt: 'Generate visualization report with severity classification...',
        version: '1.0.0',
      }),
      buildAction05Prompt: jest.fn().mockResolvedValue({
        prompt: 'Prepare report for manager presentation...',
        version: '1.0.0',
      }),
      invokeAction01: jest
        .fn()
        .mockResolvedValue([
          {
            issueKeyword: 'database-performance',
            occurrenceCount: 5,
            timeSeriesPattern: 'increasing',
            priorityScore: 75,
          },
          {
            issueKeyword: 'api-latency',
            occurrenceCount: 4,
            timeSeriesPattern: 'stable',
            priorityScore: 65,
          },
        ] as RecurringIssuePattern[]),
      invokeAction02: jest
        .fn()
        .mockResolvedValue([
          {
            issueKeyword: 'database-performance',
            occurrenceCount: 5,
            timeSeriesPattern: 'increasing-trend',
            priorityScore: 75,
          },
          {
            issueKeyword: 'api-latency',
            occurrenceCount: 4,
            timeSeriesPattern: 'cyclic-pattern',
            priorityScore: 65,
          },
        ] as RecurringIssuePattern[]),
      invokeAction03: jest.fn().mockResolvedValue({
        classificationResult: 'minor',
        impactScore: 49,
        bottleneckType: 'Minor Bottleneck',
        affectedTeams: 2,
        estimatedResolutionDays: 3,
      }),
      invokeAction04: jest.fn().mockResolvedValue({
        reportId: 'report-tx8-20240131-001',
        bottleneckSeverity: 'minor',
        escalationRequired: false,
        correspondingActionsArray: [],
        graphs: [
          {
            graphType: 'line',
            title: 'Issue Occurrence Trend',
            dataPoints: [
              { date: '2024-01-01', count: 2 },
              { date: '2024-01-08', count: 3 },
              { date: '2024-01-15', count: 4 },
              { date: '2024-01-22', count: 5 },
              { date: '2024-01-31', count: 5 },
            ],
          },
        ],
        auditEventData: {
          action: 'BOTTLENECK_CLASSIFIED',
          result: 'MINOR_SEVERITY',
          impactScore: 49,
          timestamp: '2024-01-31T15:30:00Z',
        },
      }),
      invokeAction05: jest.fn().mockResolvedValue({
        readyForPresentation: true,
        deliveryTime: '2024-01-31T15:35:00Z',
      }),
    };

    const output: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    expect(output).toBeDefined();
    expect(output.reportId).toBe('report-tx8-20240131-001');
    expect(output.recurringIssuePatterns).toHaveLength(2);
    expect(output.recurringIssuePatterns[0].issueKeyword).toBe(
      'database-performance'
    );
    expect(output.recurringIssuePatterns[0].occurrenceCount).toBe(5);
    expect(output.recurringIssuePatterns[0].timeSeriesPattern).toBe(
      'increasing-trend'
    );
    expect(output.recurringIssuePatterns[0].priorityScore).toBe(75);

    expect(output.visualizationGraphs).toHaveLength(1);
    expect(output.visualizationGraphs[0].graphType).toBe('line');
    expect(output.visualizationGraphs[0].title).toBe('Issue Occurrence Trend');
    expect(output.visualizationGraphs[0].dataPoints).toHaveLength(5);

    expect(output.emailSentAt).toBe('2024-01-31T15:35:00Z');

    expect(mockAiClient.invokeAction03).toHaveBeenCalledWith(
      expect.objectContaining({
        impactScore: 49,
      })
    );

    expect(mockAiClient.invokeAction04).toHaveBeenCalledWith(
      expect.objectContaining({
        classificationResult: 'minor',
        impactScore: 49,
      })
    );

    const auditEvent = mockAiClient.invokeAction05.mock.calls[0][0];
    expect(auditEvent).toMatchObject({
      action: 'BOTTLENECK_CLASSIFIED',
      result: 'MINOR_SEVERITY',
      impactScore: 49,
    });

    expect(mockAiClient.buildAction03Prompt).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisStartDate,
        analysisEndDate,
        minimumRecurrenceThreshold,
      })
    );
  });
});