import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern, type VisualizationGraph } from '../../src/agents/tx-8-imp-1/types';

describe('Tx8Imp1Agent - Bottleneck Pattern Visualization Report Generation', () => {
  // SCEN-1981: [normal] ボトルネック変化パターン可視化レポート生成 - 解決期間が短くなる傾向を示す場合、適切なグラフ形式が自動選択される
  test('should generate visualization report with declining_trend_line chart when resolution period shows improving trend', async () => {
    const mockAnalysisStartDate = '2024-11-01T00:00:00Z';
    const mockAnalysisEndDate = '2024-12-01T00:00:00Z';
    const mockTeamIds = ['team-001'];
    const mockRecipientManagerId = 'manager-001';
    const mockMinimumRecurrenceThreshold = 3;

    const input: Tx8AgentInput = {
      analysisStartDate: mockAnalysisStartDate,
      analysisEndDate: mockAnalysisEndDate,
      teamIds: mockTeamIds,
      minimumRecurrenceThreshold: mockMinimumRecurrenceThreshold,
      recipientManagerId: mockRecipientManagerId,
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (reportText: string) => {
        return {
          keywords: [
            { keyword: 'bottleneck-database-query', frequency: 3, confidence: 0.92 },
            { keyword: 'bottleneck-api-response', frequency: 2, confidence: 0.85 },
          ],
        };
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        const scoreMap: Record<string, number> = {
          'bottleneck-database-query': 72,
          'bottleneck-api-response': 58,
        };
        return { impactScore: scoreMap[keyword] || 50 };
      }),
      classifyIssueSeverity: jest.fn(async (issueText: string) => {
        return { severity: 'high' };
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async () => ({
        status: 'delivered',
        timestamp: '2024-12-01T15:00:00Z',
      })),
      scheduleNotification: jest.fn(async () => ({
        scheduleId: 'sched-001',
        status: 'scheduled',
      })),
      getDeliveryStatus: jest.fn(async () => ({
        status: 'delivered',
        failureCount: 0,
      })),
    };

    const output: Tx8AgentOutput = await runTx8Imp1Agent(input, {
      textAnalysisAdapter: mockTextAnalysisAdapter,
      notificationAdapter: mockNotificationAdapter,
    });

    expect(output).toBeDefined();
    expect(output.reportId).toMatch(/^report-/);
    expect(output.emailSentAt).toBeDefined();

    expect(output.recurringIssuePatterns).toHaveLength(1);
    const primaryPattern: RecurringIssuePattern = output.recurringIssuePatterns[0];
    expect(primaryPattern.issueKeyword).toBe('bottleneck-database-query');
    expect(primaryPattern.occurrenceCount).toBe(3);
    expect(primaryPattern.priorityScore).toBe(72);
    expect(primaryPattern.timeSeriesPattern).toBe('declining_trend');

    expect(output.visualizationGraphs).toHaveLength(1);
    const graph: VisualizationGraph = output.visualizationGraphs[0];
    expect(graph.graphType).toBe('declining_trend_line');
    expect(graph.title).toContain('ボトルネック');
    expect(graph.title).toContain('解決期間');

    expect(graph.dataPoints).toHaveLength(3);
    const dataPoints = graph.dataPoints as Array<{
      period: string;
      averageResolutionDays: number;
      date: string;
    }>;
    expect(dataPoints[0].averageResolutionDays).toBe(15);
    expect(dataPoints[1].averageResolutionDays).toBe(10);
    expect(dataPoints[2].averageResolutionDays).toBe(5);
    expect(dataPoints[0].period).toBe('2024-11-01');
    expect(dataPoints[1].period).toBe('2024-11-15');
    expect(dataPoints[2].period).toBe('2024-12-01');

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: mockRecipientManagerId,
      })
    );

    const emailSentDate = new Date(output.emailSentAt);
    expect(emailSentDate.getTime()).toBeGreaterThan(new Date(mockAnalysisEndDate).getTime());
  });
});