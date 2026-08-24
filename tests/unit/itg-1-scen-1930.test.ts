import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('TX8 Imp1 Agent - Recurring Issue Pattern Analysis', () => {
  // SCEN-1930: [edge] 課題の再発パターン分析機能 - 課題キーワードの類似度が80.1%の場合、同一グループとして認識される
  test('should group issues with 80.1% similarity as same recurring pattern', async () => {
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-31T23:59:59Z';
    const minimumRecurrenceThreshold = 2;
    const recipientManagerId = 'manager-001';
    const reportId = 'report-tx8-001';

    const issueGroupId = 'group-db-connection-001';
    const similarityScore = 80.1;
    const occurrenceCount = 2;

    const mockAiClient: Tx8Imp1AiClient = {
      analyzeRecurringPatterns: jest.fn().mockResolvedValue({
        patterns: [
          {
            groupId: issueGroupId,
            issueKeyword: 'データベース接続エラー',
            keywords: ['データベース接続エラーが発生', 'DB接続エラーが発生'],
            similarityScore: similarityScore,
            occurrenceCount: occurrenceCount,
            timeSeriesPattern: '周期的',
            priorityScore: 75,
            sourceIssueIds: ['issue-001', 'issue-002'],
            firstOccurrenceDate: '2024-01-05T09:30:00Z',
            lastOccurrenceDate: '2024-01-20T14:15:00Z',
          },
        ],
        analysisMetadata: {
          totalIssuesAnalyzed: 15,
          groupsIdentified: 1,
          analysisExecutedAt: '2024-01-31T15:00:00Z',
          similarityThreshold: 80,
        },
      }),
      selectVisualizationGraphs: jest.fn().mockResolvedValue({
        graphs: [
          {
            graphType: 'line',
            title: 'Issue Occurrence Trend Over Time',
            dataPoints: [
              { date: '2024-01-05', count: 1 },
              { date: '2024-01-20', count: 1 },
            ],
          },
          {
            graphType: 'bar',
            title: 'Recurring Issues by Priority',
            dataPoints: [
              { priority: 'high', count: 1 },
            ],
          },
        ],
      }),
      sendReportToManager: jest.fn().mockResolvedValue({
        emailSentAt: '2024-01-31T15:05:00Z',
        deliveryStatus: 'success',
      }),
    };

    const input = {
      analysisStartDate,
      analysisEndDate,
      teamIds: ['team-001', 'team-002'],
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const result = await runTx8Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.reportId).toBe(reportId);
    expect(result.recurringIssuePatterns).toHaveLength(1);

    const groupedPattern = result.recurringIssuePatterns[0];
    expect(groupedPattern.issueKeyword).toBe('データベース接続エラー');
    expect(groupedPattern.occurrenceCount).toBe(occurrenceCount);
    expect(groupedPattern.priorityScore).toBe(75);
    expect(groupedPattern.timeSeriesPattern).toBe('周期的');

    expect(result.visualizationGraphs).toBeDefined();
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);
    expect(result.visualizationGraphs[0].graphType).toBe('line');
    expect(result.visualizationGraphs[0].title).toBe('Issue Occurrence Trend Over Time');
    expect(result.visualizationGraphs[0].dataPoints.length).toBe(2);

    expect(result.emailSentAt).toBe('2024-01-31T15:05:00Z');

    expect(mockAiClient.analyzeRecurringPatterns).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisStartDate,
        analysisEndDate,
        minimumRecurrenceThreshold,
      })
    );

    expect(mockAiClient.selectVisualizationGraphs).toHaveBeenCalledWith(
      expect.objectContaining({
        recurringPatterns: expect.any(Array),
      })
    );

    expect(mockAiClient.sendReportToManager).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientManagerId,
        reportId,
      })
    );
  });
});