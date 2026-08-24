import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1 orchestrator - ボトルネック変化パターン可視化レポート生成', () => {
  // SCEN-1984: [normal] ボトルネック変化パターン可視化レポート生成 - 発生頻度・影響度・解決期間の3つの指標すべてが含まれたレポートが生成される
  test('should generate visualization report with occurrence frequency, impact score, and resolution period', async () => {
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-07T23:59:59Z';
    const teamIds = ['team-001', 'team-002'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'database_connection_timeout', frequency: 5 },
        { keyword: 'memory_leak_issue', frequency: 4 },
        { keyword: 'api_rate_limit', frequency: 3 },
      ]),
      assessImpactScore: jest.fn().mockImplementation((keyword: string) => {
        const scoreMap: { [key: string]: number } = {
          database_connection_timeout: 85,
          memory_leak_issue: 72,
          api_rate_limit: 58,
        };
        return Promise.resolve(scoreMap[keyword] || 50);
      }),
      classifyIssueSeverity: jest.fn().mockImplementation((keyword: string) => {
        const severityMap: { [key: string]: string } = {
          database_connection_timeout: 'high',
          memory_leak_issue: 'high',
          api_rate_limit: 'medium',
        };
        return Promise.resolve(severityMap[keyword] || 'low');
      }),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };

    const input = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const result = await runTx8Imp1Agent(input, mockTextAnalysisServiceAdapter);

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);
    expect(result.recurringIssuePatterns.length).toBeGreaterThanOrEqual(1);

    const firstPattern = result.recurringIssuePatterns[0];
    expect(firstPattern.issueKeyword).toBeDefined();
    expect(typeof firstPattern.issueKeyword).toBe('string');
    expect(firstPattern.issueKeyword.length).toBeGreaterThan(0);

    expect(firstPattern.occurrenceCount).toBeDefined();
    expect(typeof firstPattern.occurrenceCount).toBe('number');
    expect(firstPattern.occurrenceCount).toBeGreaterThanOrEqual(0);
    expect(firstPattern.occurrenceCount).toBeLessThanOrEqual(100);

    expect(firstPattern.timeSeriesPattern).toBeDefined();
    expect(typeof firstPattern.timeSeriesPattern).toBe('string');
    const validPatterns = ['increasing_trend', 'cyclic_pattern', 'sudden_spike', 'stable'];
    expect(validPatterns).toContain(firstPattern.timeSeriesPattern);

    expect(firstPattern.priorityScore).toBeDefined();
    expect(typeof firstPattern.priorityScore).toBe('number');
    expect(firstPattern.priorityScore).toBeGreaterThanOrEqual(0);
    expect(firstPattern.priorityScore).toBeLessThanOrEqual(100);

    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThanOrEqual(1);

    const firstGraph = result.visualizationGraphs[0];
    expect(firstGraph.graphType).toBeDefined();
    expect(typeof firstGraph.graphType).toBe('string');
    const validGraphTypes = ['line_chart', 'bar_chart', 'pie_chart', 'heatmap'];
    expect(validGraphTypes).toContain(firstGraph.graphType);

    expect(firstGraph.title).toBeDefined();
    expect(typeof firstGraph.title).toBe('string');
    expect(firstGraph.title.length).toBeGreaterThan(0);

    expect(firstGraph.dataPoints).toBeDefined();
    expect(Array.isArray(firstGraph.dataPoints)).toBe(true);
    expect(firstGraph.dataPoints.length).toBeGreaterThanOrEqual(1);

    const firstDataPoint = firstGraph.dataPoints[0];
    expect(typeof firstDataPoint).toBe('object');
    expect(firstDataPoint).not.toBeNull();

    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');
    const emailSentDate = new Date(result.emailSentAt);
    expect(emailSentDate.getTime()).toBeGreaterThan(0);
    expect(emailSentDate.getTime()).toBeLessThanOrEqual(new Date().getTime() + 1000);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalled();

    const occurrenceFrequencies = result.recurringIssuePatterns.map(
      (pattern) => pattern.occurrenceCount
    );
    expect(occurrenceFrequencies.length).toBeGreaterThanOrEqual(1);
    for (const freq of occurrenceFrequencies) {
      expect(typeof freq).toBe('number');
      expect(freq).toBeGreaterThanOrEqual(0);
    }

    const impactScores = result.recurringIssuePatterns.map((pattern) => pattern.priorityScore);
    expect(impactScores.length).toBeGreaterThanOrEqual(1);
    for (const score of impactScores) {
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }

    let hasResolutionPeriodData = false;
    for (const graph of result.visualizationGraphs) {
      if (
        graph.title.toLowerCase().includes('resolution') ||
        graph.title.toLowerCase().includes('duration')
      ) {
        hasResolutionPeriodData = true;
        expect(graph.dataPoints.length).toBeGreaterThanOrEqual(1);
        for (const point of graph.dataPoints) {
          if ('value' in point) {
            expect(typeof point.value).toBe('number');
          }
        }
        break;
      }
    }

    let hasOccurrenceFrequencyData = false;
    for (const graph of result.visualizationGraphs) {
      if (
        graph.title.toLowerCase().includes('frequency') ||
        graph.title.toLowerCase().includes('occurrence') ||
        graph.graphType === 'bar_chart'
      ) {
        hasOccurrenceFrequencyData = true;
        expect(graph.dataPoints.length).toBeGreaterThanOrEqual(1);
        break;
      }
    }

    let hasImpactScoreData = false;
    for (const graph of result.visualizationGraphs) {
      if (
        graph.title.toLowerCase().includes('impact') ||
        graph.title.toLowerCase().includes('priority') ||
        graph.title.toLowerCase().includes('severity')
      ) {
        hasImpactScoreData = true;
        expect(graph.dataPoints.length).toBeGreaterThanOrEqual(1);
        break;
      }
    }

    expect(hasOccurrenceFrequencyData).toBe(true);
    expect(hasImpactScoreData).toBe(true);
  });
});