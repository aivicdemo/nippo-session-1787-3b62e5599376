import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern, type VisualizationGraph } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('TX-8-IMP-1: 課題検索から可視化レポート作成までの自動実行 - ボトルネック変化パターン可視化レポート生成', () => {
  test('SCEN-2005: 課題発生頻度がちょうど閾値（10回/月）のとき、閾値対応グラフ形式が選択される', async () => {
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-03-31T23:59:59Z';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'mgr-001';

    const networkErrorIssueKeyword = 'ネットワーク接続エラー';
    const normalIssueKeyword = 'データベース接続遅延';

    const issueDataset = [
      {
        issueKeyword: networkErrorIssueKeyword,
        occurrenceDate: '2024-01-10',
        occurrenceCount: 3,
      },
      {
        issueKeyword: networkErrorIssueKeyword,
        occurrenceDate: '2024-01-20',
        occurrenceCount: 4,
      },
      {
        issueKeyword: networkErrorIssueKeyword,
        occurrenceDate: '2024-01-31',
        occurrenceCount: 3,
      },
      {
        issueKeyword: networkErrorIssueKeyword,
        occurrenceDate: '2024-02-05',
        occurrenceCount: 3,
      },
      {
        issueKeyword: networkErrorIssueKeyword,
        occurrenceDate: '2024-02-15',
        occurrenceCount: 4,
      },
      {
        issueKeyword: networkErrorIssueKeyword,
        occurrenceDate: '2024-02-28',
        occurrenceCount: 3,
      },
      {
        issueKeyword: networkErrorIssueKeyword,
        occurrenceDate: '2024-03-10',
        occurrenceCount: 3,
      },
      {
        issueKeyword: networkErrorIssueKeyword,
        occurrenceDate: '2024-03-20',
        occurrenceCount: 4,
      },
      {
        issueKeyword: networkErrorIssueKeyword,
        occurrenceDate: '2024-03-30',
        occurrenceCount: 3,
      },
      {
        issueKeyword: normalIssueKeyword,
        occurrenceDate: '2024-01-15',
        occurrenceCount: 2,
      },
      {
        issueKeyword: normalIssueKeyword,
        occurrenceDate: '2024-02-10',
        occurrenceCount: 1,
      },
      {
        issueKeyword: normalIssueKeyword,
        occurrenceDate: '2024-03-15',
        occurrenceCount: 2,
      },
    ];

    const expectedNetworkErrorMonthlyFrequency = {
      '2024-01': 10,
      '2024-02': 10,
      '2024-03': 10,
    };

    const mockAiClient: Tx8Imp1AiClient = {
      executeAction01SearchAndExtract: async () => ({
        extractedIssues: issueDataset.map((item) => ({
          keyword: item.issueKeyword,
          date: item.occurrenceDate,
          count: item.occurrenceCount,
        })),
      }),
      executeAction02TimeSeriesAnalysis: async () => ({
        timeSeriesPatterns: [
          {
            issueKeyword: networkErrorIssueKeyword,
            monthlyFrequency: expectedNetworkErrorMonthlyFrequency,
            pattern: 'stable',
            averageFrequency: 10,
          },
          {
            issueKeyword: normalIssueKeyword,
            monthlyFrequency: { '2024-01': 2, '2024-02': 1, '2024-03': 2 },
            pattern: 'fluctuating',
            averageFrequency: 1.67,
          },
        ],
      }),
      executeAction03BottleneckDetection: async () => ({
        bottleneckPatterns: [
          {
            issueKeyword: networkErrorIssueKeyword,
            monthlyFrequency: 10,
            severityLevel: 'warning',
            requiresGraphFormat: 'threshold_warning_line_chart',
          },
          {
            issueKeyword: normalIssueKeyword,
            monthlyFrequency: 1.67,
            severityLevel: 'normal',
            requiresGraphFormat: 'standard_line_chart',
          },
        ],
      }),
      executeAction04GraphTypeSelection: async () => ({
        selectedGraphTypes: [
          {
            bottleneckIssueKeyword: networkErrorIssueKeyword,
            graphType: 'threshold_warning_line_chart',
            title: 'ネットワーク接続エラーの月別発生頻度（閾値警告)',
            displayStyle: {
              color: 'yellow',
              lineStyle: 'dashed',
              markerShape: 'warning_diamond',
              annotationText: '閾値レベル: 10回/月',
            },
          },
          {
            bottleneckIssueKeyword: normalIssueKeyword,
            graphType: 'standard_line_chart',
            title: 'データベース接続遅延の月別発生頻度',
            displayStyle: {
              color: 'blue',
              lineStyle: 'solid',
              markerShape: 'circle',
              annotationText: null,
            },
          },
        ],
      }),
      executeAction05ReportGeneration: async () => ({
        reportId: 'report-threshold-2024-001',
        recurringIssuePatterns: [
          {
            issueKeyword: networkErrorIssueKeyword,
            occurrenceCount: 30,
            timeSeriesPattern: 'stable',
            priorityScore: 85,
          },
          {
            issueKeyword: normalIssueKeyword,
            occurrenceCount: 5,
            timeSeriesPattern: 'fluctuating',
            priorityScore: 35,
          },
        ],
        visualizationGraphs: [
          {
            graphType: 'threshold_warning_line_chart',
            title: 'ネットワーク接続エラーの月別発生頻度（閾値警告)',
            dataPoints: [
              {
                month: '2024-01',
                frequency: 10,
                severity: 'warning',
                style: 'yellow_dashed_diamond',
                annotation: '閾値レベル: 10回/月',
              },
              {
                month: '2024-02',
                frequency: 10,
                severity: 'warning',
                style: 'yellow_dashed_diamond',
                annotation: '閾値レベル: 10回/月',
              },
              {
                month: '2024-03',
                frequency: 10,
                severity: 'warning',
                style: 'yellow_dashed_diamond',
                annotation: '閾値レベル: 10回/月',
              },
            ],
          },
          {
            graphType: 'standard_line_chart',
            title: 'データベース接続遅延の月別発生頻度',
            dataPoints: [
              {
                month: '2024-01',
                frequency: 2,
                severity: 'normal',
                style: 'blue_solid_circle',
                annotation: null,
              },
              {
                month: '2024-02',
                frequency: 1,
                severity: 'normal',
                style: 'blue_solid_circle',
                annotation: null,
              },
              {
                month: '2024-03',
                frequency: 2,
                severity: 'normal',
                style: 'blue_solid_circle',
                annotation: null,
              },
            ],
          },
        ],
        emailSentAt: '2024-04-01T09:00:00Z',
      }),
    };

    const input: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    expect(result.reportId).toBe('report-threshold-2024-001');
    expect(result.recurringIssuePatterns).toHaveLength(2);

    const networkErrorPattern = result.recurringIssuePatterns.find(
      (p) => p.issueKeyword === networkErrorIssueKeyword
    );
    expect(networkErrorPattern).toBeDefined();
    expect(networkErrorPattern?.occurrenceCount).toBe(30);
    expect(networkErrorPattern?.timeSeriesPattern).toBe('stable');
    expect(networkErrorPattern?.priorityScore).toBe(85);

    expect(result.visualizationGraphs).toHaveLength(2);

    const thresholdGraph = result.visualizationGraphs.find(
      (g) => g.graphType === 'threshold_warning_line_chart'
    );
    expect(thresholdGraph).toBeDefined();
    expect(thresholdGraph?.title).toBe(
      'ネットワーク接続エラーの月別発生頻度（閾値警告)'
    );
    expect(thresholdGraph?.dataPoints).toHaveLength(3);

    const allThresholdDataPointsHaveWarningStyle = thresholdGraph?.dataPoints.every(
      (dp) => dp.style === 'yellow_dashed_diamond'
    );
    expect(allThresholdDataPointsHaveWarningStyle).toBe(true);

    const allThresholdDataPointsHaveAnnotation = thresholdGraph?.dataPoints.every(
      (dp) => dp.annotation === '閾値レベル: 10回/月'
    );
    expect(allThresholdDataPointsHaveAnnotation).toBe(true);

    const normalGraph = result.visualizationGraphs.find(
      (g) => g.graphType === 'standard_line_chart'
    );
    expect(normalGraph).toBeDefined();
    expect(normalGraph?.title).toBe('データベース接続遅延の月別発生頻度');

    const allNormalDataPointsHaveNormalStyle = normalGraph?.dataPoints.every(
      (dp) => dp.style === 'blue_solid_circle'
    );
    expect(allNormalDataPointsHaveNormalStyle).toBe(true);

    const allNormalDataPointsHaveNoAnnotation = normalGraph?.dataPoints.every(
      (dp) => dp.annotation === null
    );
    expect(allNormalDataPointsHaveNoAnnotation).toBe(true);

    expect(result.emailSentAt).toBe('2024-04-01T09:00:00Z');

    const thresholdGraphFrequencies = thresholdGraph?.dataPoints.map(
      (dp) => dp.frequency
    );
    expect(thresholdGraphFrequencies).toEqual([10, 10, 10]);

    const networkErrorInThresholdGraph = thresholdGraph?.dataPoints.every(
      (dp) => dp.severity === 'warning'
    );
    expect(networkErrorInThresholdGraph).toBe(true);
  });
});