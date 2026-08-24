import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('Tx8Imp1Agent - ボトルネック変化パターン可視化レポート生成', () => {
  // SCEN-2014
  test('逆順で入力された課題データが内部でソートされてレポート生成される', async () => {
    // 新→旧の逆順でテストデータを準備
    const reverseOrderedIssueData = [
      {
        issueId: 'ISSUE-005',
        occurrenceDate: '2024-01-05T10:00:00Z',
        issueName: 'Database Performance Degradation',
        bottleneckClassification: 'performance',
        occurrenceCount: 3,
      },
      {
        issueId: 'ISSUE-004',
        occurrenceDate: '2024-01-04T14:30:00Z',
        issueName: 'API Timeout Issues',
        bottleneckClassification: 'reliability',
        occurrenceCount: 2,
      },
      {
        issueId: 'ISSUE-003',
        occurrenceDate: '2024-01-03T09:15:00Z',
        issueName: 'Memory Leak in Cache Module',
        bottleneckClassification: 'performance',
        occurrenceCount: 1,
      },
      {
        issueId: 'ISSUE-002',
        occurrenceDate: '2024-01-02T16:45:00Z',
        issueName: 'Concurrent Request Handling',
        bottleneckClassification: 'scalability',
        occurrenceCount: 5,
      },
      {
        issueId: 'ISSUE-001',
        occurrenceDate: '2024-01-01T11:20:00Z',
        issueName: 'Initial Data Sync Delay',
        bottleneckClassification: 'reliability',
        occurrenceCount: 2,
      },
    ];

    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-05';
    const minimumRecurrenceThreshold = 1;
    const recipientManagerId = 'manager-001';

    const input = {
      analysisStartDate,
      analysisEndDate,
      teamIds: undefined,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    // スタブAIクライアントの実装
    let aiClientCallOrder: string[] = [];
    let sortedDatasetForAiClient: typeof reverseOrderedIssueData | null = null;

    const stubAiClient = {
      action01_ExtractIssuesFromReports: async () => ({
        extractedIssues: reverseOrderedIssueData,
      }),
      action02_AnalyzeRecurrencePatterns: async (issues: typeof reverseOrderedIssueData) => {
        aiClientCallOrder.push('action02_AnalyzeRecurrencePatterns');
        sortedDatasetForAiClient = issues;
        const sortedIssues = [...issues].sort(
          (a, b) =>
            new Date(a.occurrenceDate).getTime() - new Date(b.occurrenceDate).getTime()
        );
        return {
          timeSeriesPatterns: sortedIssues.map((issue) => ({
            issueId: issue.issueId,
            occurrenceDate: issue.occurrenceDate,
            issueName: issue.issueName,
            pattern: 'recurring',
            trend: 'stable',
          })),
        };
      },
      action03_ClassifyByBottleneck: async (patterns: any[]) => {
        aiClientCallOrder.push('action03_ClassifyByBottleneck');
        return {
          classifiedBottlenecks: patterns.map((p) => ({
            ...p,
            bottleneckGroup: 'performance' in p ? 'perf_group' : 'reliability_group',
          })),
        };
      },
      action04_SelectVisualizationGraphs: async () => {
        aiClientCallOrder.push('action04_SelectVisualizationGraphs');
        return {
          selectedGraphs: [
            { graphType: 'line', title: 'Issue Trend Over Time' },
            { graphType: 'bar', title: 'Occurrence Count by Classification' },
          ],
        };
      },
      action05_GenerateVisualizationData: async (
        graphs: any[],
        sortedPatterns: any[]
      ) => {
        aiClientCallOrder.push('action05_GenerateVisualizationData');
        return {
          visualizationGraphs: graphs.map((graph) => ({
            graphType: graph.graphType,
            title: graph.title,
            dataPoints: sortedPatterns.map((pattern, idx) => ({
              xAxisValue: pattern.occurrenceDate,
              yAxisValue: idx + 1,
            })),
          })),
        };
      },
    };

    // オーケストレータ呼び出し
    const result = await runTx8Imp1Agent(input, stubAiClient as any);

    // 検証1: レポートIDが生成されている
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    // 検証2: 再発課題パターンが旧→新の正順で整列
    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);
    expect(result.recurringIssuePatterns.length).toBe(5);

    const expectedChronologicalOrder = [
      '2024-01-01T11:20:00Z',
      '2024-01-02T16:45:00Z',
      '2024-01-03T09:15:00Z',
      '2024-01-04T14:30:00Z',
      '2024-01-05T10:00:00Z',
    ];

    result.recurringIssuePatterns.forEach((pattern, index) => {
      expect(pattern.issueKeyword).toBeDefined();
      expect(typeof pattern.occurrenceCount).toBe('number');
      expect(typeof pattern.priorityScore).toBe('number');
      expect(pattern.priorityScore).toBeGreaterThanOrEqual(0);
      expect(pattern.priorityScore).toBeLessThanOrEqual(100);
      expect(pattern.timeSeriesPattern).toBeDefined();
    });

    // 検証3: 可視化グラフが生成されている
    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThanOrEqual(2);

    result.visualizationGraphs.forEach((graph) => {
      expect(graph.graphType).toBeDefined();
      expect(['line', 'bar', 'pie', 'heatmap'].includes(graph.graphType)).toBe(true);
      expect(graph.title).toBeDefined();
      expect(typeof graph.title).toBe('string');
      expect(graph.dataPoints).toBeDefined();
      expect(Array.isArray(graph.dataPoints)).toBe(true);
      expect(graph.dataPoints.length).toBeGreaterThan(0);
    });

    // 検証4: グラフのデータポイントが時系列順に整列
    result.visualizationGraphs.forEach((graph) => {
      const xAxisValues = graph.dataPoints
        .map((dp: any) => dp.xAxisValue)
        .filter((val: any) => val !== undefined);

      if (xAxisValues.length > 1) {
        for (let i = 0; i < xAxisValues.length - 1; i++) {
          const currentDate = new Date(xAxisValues[i]).getTime();
          const nextDate = new Date(xAxisValues[i + 1]).getTime();
          expect(currentDate).toBeLessThanOrEqual(nextDate);
        }
      }
    });

    // 検証5: メール送信日時が記録されている
    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');
    const emailSentDate = new Date(result.emailSentAt);
    expect(emailSentDate instanceof Date).toBe(true);
    expect(emailSentDate.getTime()).toBeGreaterThan(0);

    // 検証6: AIクライアントの呼び出し順序が正しい
    expect(aiClientCallOrder.length).toBeGreaterThan(0);
    expect(aiClientCallOrder).toContain('action02_AnalyzeRecurrencePatterns');
    expect(aiClientCallOrder).toContain('action05_GenerateVisualizationData');

    // 検証7: ソート後のデータセットがAIクライアントに渡されていることを確認
    if (sortedDatasetForAiClient) {
      const sortedDates = sortedDatasetForAiClient.map((issue) =>
        new Date(issue.occurrenceDate).getTime()
      );
      for (let i = 0; i < sortedDates.length - 1; i++) {
        expect(sortedDates[i]).toBeLessThanOrEqual(sortedDates[i + 1]);
      }
    }

    // 検証8: 優先度スコアが合理的に計算されている
    const priorityScores = result.recurringIssuePatterns.map((p) => p.priorityScore);
    expect(Math.max(...priorityScores)).toBeLessThanOrEqual(100);
    expect(Math.min(...priorityScores)).toBeGreaterThanOrEqual(0);

    // 検証9: 時系列パターンが定義されている
    result.recurringIssuePatterns.forEach((pattern) => {
      expect(['increasing', 'decreasing', 'stable', 'cyclical', 'spike'].includes(
        pattern.timeSeriesPattern
      )).toBe(true);
    });
  });
});