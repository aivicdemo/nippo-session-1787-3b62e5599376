import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('TX-8 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-2006: [edge] ボトルネック変化パターン可視化レポート生成機能 - 課題発生頻度が閾値未満（9回/月）のとき、別のグラフ形式が選択される
  test('should generate visualization report with table_format graph type when issue occurrence frequency is below threshold (8/month < 9/month threshold)', async () => {
    const analysisStartDate = '2023-01-01';
    const analysisEndDate = '2024-01-31';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const mockIssueData = Array.from({ length: 96 }, (_, index) => ({
      issueKeyword: 'low_frequency_issue',
      issueId: `issue-${index}`,
      reportDate: new Date(2023, Math.floor(index / 8), (index % 8) + 1).toISOString(),
      teamId: 'team-001',
      description: 'Low frequency infrastructure issue',
      impactScore: 35,
    }));

    const mockAiClient: Tx8Imp1AiClient = {
      extractIssueDataAction: jest.fn(async () => ({
        extractedIssues: mockIssueData,
        extractionConfidence: 0.92,
      })),

      analyzeTimeSeriesPatternAction: jest.fn(async () => ({
        timeSeriesPattern: 'sporadic',
        occurrenceFrequency: 8,
        trendDirection: 'stable',
      })),

      identifyBottleneckPatternAction: jest.fn(async () => ({
        bottleneckPatterns: [
          {
            keyword: 'low_frequency_issue',
            frequency: 8,
            isAboveThreshold: false,
            thresholdValue: 9,
          },
        ],
        graphTypeRecommendation: 'table_format',
      })),

      generateVisualizationReportAction: jest.fn(async () => ({
        reportId: 'report-2024-01-tx8-001',
        graphType: 'table_format',
        title: 'Low Frequency Issues Table',
        dataPoints: [
          {
            date: '2023-01-01',
            issueKeyword: 'low_frequency_issue',
            occurrenceCount: 1,
            impactScore: 35,
          },
          {
            date: '2023-02-01',
            issueKeyword: 'low_frequency_issue',
            occurrenceCount: 1,
            impactScore: 35,
          },
        ],
        frequencyPerMonth: 8,
        thresholdValue: 9,
      })),

      extractAndHighlightHighPriorityIssuesAction: jest.fn(async () => ({
        highPriorityIssues: [],
        highlightedDataPoints: [
          {
            date: '2023-01-01',
            issueKeyword: 'low_frequency_issue',
            occurrenceCount: 1,
            emphasisLevel: 'standard',
          },
        ],
      })),
    };

    const result = await runTx8Imp1Agent(
      {
        analysisStartDate,
        analysisEndDate,
        teamIds,
        minimumRecurrenceThreshold,
        recipientManagerId,
      },
      mockAiClient,
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBe('report-2024-01-tx8-001');
    expect(result.visualizationGraphs).toHaveLength(1);
    expect(result.visualizationGraphs[0].graphType).toBe('table_format');
    expect(result.visualizationGraphs[0].graphType).not.toBe('bar_chart');
    expect(result.visualizationGraphs[0].dataPoints).toBeDefined();
    expect(result.visualizationGraphs[0].dataPoints.length).toBeGreaterThan(0);
    expect(result.visualizationGraphs[0].title).toBe('Low Frequency Issues Table');

    expect(mockAiClient.extractIssueDataAction).toHaveBeenCalledTimes(1);
    expect(mockAiClient.analyzeTimeSeriesPatternAction).toHaveBeenCalledTimes(1);
    expect(mockAiClient.identifyBottleneckPatternAction).toHaveBeenCalledTimes(1);
    expect(mockAiClient.generateVisualizationReportAction).toHaveBeenCalledTimes(1);
    expect(mockAiClient.extractAndHighlightHighPriorityIssuesAction).toHaveBeenCalledTimes(1);

    const mockAiClientRetry: Tx8Imp1AiClient = {
      extractIssueDataAction: jest.fn(async () => ({
        extractedIssues: mockIssueData,
        extractionConfidence: 0.92,
      })),

      analyzeTimeSeriesPatternAction: jest.fn(async () => ({
        timeSeriesPattern: 'sporadic',
        occurrenceFrequency: 8,
        trendDirection: 'stable',
      })),

      identifyBottleneckPatternAction: jest.fn(async () => ({
        bottleneckPatterns: [
          {
            keyword: 'low_frequency_issue',
            frequency: 8,
            isAboveThreshold: false,
            thresholdValue: 9,
          },
        ],
        graphTypeRecommendation: 'table_format',
      })),

      generateVisualizationReportAction: jest.fn(async () => ({
        reportId: 'report-2024-01-tx8-001',
        graphType: 'table_format',
        title: 'Low Frequency Issues Table',
        dataPoints: [
          {
            date: '2023-01-01',
            issueKeyword: 'low_frequency_issue',
            occurrenceCount: 1,
            impactScore: 35,
          },
          {
            date: '2023-02-01',
            issueKeyword: 'low_frequency_issue',
            occurrenceCount: 1,
            impactScore: 35,
          },
        ],
        frequencyPerMonth: 8,
        thresholdValue: 9,
      })),

      extractAndHighlightHighPriorityIssuesAction: jest.fn(async () => ({
        highPriorityIssues: [],
        highlightedDataPoints: [
          {
            date: '2023-01-01',
            issueKeyword: 'low_frequency_issue',
            occurrenceCount: 1,
            emphasisLevel: 'standard',
          },
        ],
      })),
    };

    const retryResult = await runTx8Imp1Agent(
      {
        analysisStartDate,
        analysisEndDate,
        teamIds,
        minimumRecurrenceThreshold,
        recipientManagerId,
      },
      mockAiClientRetry,
    );

    expect(retryResult.visualizationGraphs[0].graphType).toBe('table_format');
    expect(retryResult.visualizationGraphs[0].graphType).toBe(
      result.visualizationGraphs[0].graphType,
    );
  });
});