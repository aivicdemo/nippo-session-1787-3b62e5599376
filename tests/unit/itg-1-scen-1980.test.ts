import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-1980
  test('影響度スコアが変動する場合、適切なグラフ形式が自動選択されボトルネック変化パターンが可視化される', async () => {
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-21';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const mockAssessImpactScoreResults = [35, 62, 48];
    let impactScoreCallCount = 0;

    const stubTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'API_TIMEOUT', frequency: 3 },
          { keyword: 'DB_LOCK', frequency: 2 },
          { keyword: 'MEMORY_LEAK', frequency: 1 }
        ]
      }),
      assessImpactScore: jest.fn().mockImplementation(() => {
        const result = mockAssessImpactScoreResults[impactScoreCallCount];
        impactScoreCallCount = (impactScoreCallCount + 1) % mockAssessImpactScoreResults.length;
        return Promise.resolve(result);
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    const stubNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'delivered' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduledAt: '2024-01-15T08:30:00Z' }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true })
    };

    const input = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId
    };

    const result = await runTx8Imp1Agent(input, stubTextAnalysisServiceAdapter, stubNotificationServiceAdapter);

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^report-/);

    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);
    expect(result.recurringIssuePatterns.length).toBeGreaterThan(0);

    const firstPattern = result.recurringIssuePatterns[0];
    expect(firstPattern.issueKeyword).toBeDefined();
    expect(typeof firstPattern.issueKeyword).toBe('string');
    expect(firstPattern.occurrenceCount).toBeGreaterThanOrEqual(minimumRecurrenceThreshold);
    expect(firstPattern.timeSeriesPattern).toBeDefined();
    expect(['増加傾向', '周期的', '急増', '低下傾向', '安定']).toContain(firstPattern.timeSeriesPattern);
    expect(firstPattern.priorityScore).toBeGreaterThanOrEqual(0);
    expect(firstPattern.priorityScore).toBeLessThanOrEqual(100);

    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    const lineChartGraph = result.visualizationGraphs.find((graph) => graph.graphType === 'LineChart');
    expect(lineChartGraph).toBeDefined();
    expect(lineChartGraph!.title).toBeDefined();
    expect(typeof lineChartGraph!.title).toBe('string');

    expect(lineChartGraph!.dataPoints).toBeDefined();
    expect(Array.isArray(lineChartGraph!.dataPoints)).toBe(true);
    expect(lineChartGraph!.dataPoints.length).toBe(3);

    expect(lineChartGraph!.dataPoints[0].value).toBe(35);
    expect(lineChartGraph!.dataPoints[1].value).toBe(62);
    expect(lineChartGraph!.dataPoints[2].value).toBe(48);

    expect(lineChartGraph!.dataPoints[0].date).toBeDefined();
    expect(lineChartGraph!.dataPoints[1].date).toBeDefined();
    expect(lineChartGraph!.dataPoints[2].date).toBeDefined();

    expect(result.emailSentAt).toBeDefined();
    expect(result.emailSentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    expect(stubTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
  });
});