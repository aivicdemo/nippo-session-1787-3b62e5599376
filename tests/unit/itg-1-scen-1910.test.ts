import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1 orchestrator - 課題の再発パターン分析機能', () => {
  // SCEN-1910: [normal] 課題の再発パターン分析機能 - 複数の同一キーワード課題が存在する場合に全て同一グループで集約される
  test('同一キーワードを持つ複数課題がグループ化されて返される', async () => {
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-31T23:59:59Z';
    const recipientManagerId = 'manager-001';
    const minimumRecurrenceThreshold = 3;

    const mockAiClient: Tx8Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            occurrenceCount: 3,
            issueIds: ['ISS-001', 'ISS-002', 'ISS-003'],
            impactScore: 75,
          },
        ],
      }),
      analyzeTimeSeriesPattern: jest.fn().mockResolvedValue({
        pattern: '周期的',
        trendDescription: '毎週月曜日に発生',
      }),
      generateVisualizationGraphs: jest.fn().mockResolvedValue({
        graphs: [
          {
            graphType: '折れ線',
            title: 'データベース接続エラーの発生頻度推移',
            dataPoints: [
              { date: '2024-01-08', count: 1 },
              { date: '2024-01-15', count: 1 },
              { date: '2024-01-22', count: 1 },
            ],
          },
        ],
      }),
      generateReport: jest.fn().mockResolvedValue({
        reportId: 'report-12345',
        generatedAt: '2024-01-31T10:00:00Z',
      }),
      sendEmailToManager: jest.fn().mockResolvedValue({
        emailSentAt: '2024-01-31T10:05:00Z',
      }),
    };

    const input = {
      analysisStartDate,
      analysisEndDate,
      teamIds: undefined,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const result = await runTx8Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.reportId).toBe('report-12345');
    expect(result.recurringIssuePatterns).toHaveLength(1);

    const firstPattern = result.recurringIssuePatterns[0];
    expect(firstPattern.issueKeyword).toBe('データベース接続エラー');
    expect(firstPattern.occurrenceCount).toBe(3);
    expect(firstPattern.timeSeriesPattern).toBe('周期的');
    expect(firstPattern.priorityScore).toBe(75);

    expect(result.visualizationGraphs).toHaveLength(1);
    expect(result.visualizationGraphs[0].graphType).toBe('折れ線');
    expect(result.visualizationGraphs[0].title).toBe(
      'データベース接続エラーの発生頻度推移'
    );
    expect(result.visualizationGraphs[0].dataPoints).toHaveLength(3);

    expect(result.emailSentAt).toBe('2024-01-31T10:05:00Z');

    expect(mockAiClient.extractKeywords).toHaveBeenCalledWith({
      analysisStartDate,
      analysisEndDate,
      minimumRecurrenceThreshold,
    });

    expect(mockAiClient.analyzeTimeSeriesPattern).toHaveBeenCalledWith({
      issueKeyword: 'データベース接続エラー',
      occurrenceCount: 3,
    });

    expect(mockAiClient.generateVisualizationGraphs).toHaveBeenCalledWith({
      recurringIssuePatterns: expect.arrayContaining([
        expect.objectContaining({
          issueKeyword: 'データベース接続エラー',
          occurrenceCount: 3,
        }),
      ]),
    });

    expect(mockAiClient.generateReport).toHaveBeenCalledWith({
      recurringIssuePatterns: expect.arrayContaining([
        expect.objectContaining({
          issueKeyword: 'データベース接続エラー',
          occurrenceCount: 3,
          timeSeriesPattern: '周期的',
          priorityScore: 75,
        }),
      ]),
      visualizationGraphs: expect.any(Array),
    });

    expect(mockAiClient.sendEmailToManager).toHaveBeenCalledWith({
      recipientManagerId,
      reportId: 'report-12345',
      recurringIssuePatterns: expect.any(Array),
      visualizationGraphs: expect.any(Array),
    });
  });
});