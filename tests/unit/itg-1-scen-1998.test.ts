import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('TX-8 ボトルネック変化パターン可視化レポート生成機能', () => {
  // SCEN-1998
  test('TextAnalysisServiceAdapterが影響度スコア算出に失敗したとき、レポート生成がエラーになる', async () => {
    const analysisStartDate = '2024-01-08';
    const analysisEndDate = '2024-01-15';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const issueDataset = [
      {
        id: 'ISSUE-001',
        text: 'API応答遅延',
        keyword: 'API',
        frequency: 5,
      },
      {
        id: 'ISSUE-002',
        text: 'データベース接続エラー',
        keyword: 'DB',
        frequency: 8,
      },
    ];

    const stubAiClient: Tx8Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: issueDataset.map((issue) => ({
          keyword: issue.keyword,
          frequency: issue.frequency,
        })),
      }),
      assessImpactScore: jest
        .fn()
        .mockRejectedValue(
          new Error('Impact score calculation failed')
        ),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
      generateVisualizationGraphs: jest.fn().mockResolvedValue({
        graphs: [
          {
            graphType: 'line',
            title: 'Issue Frequency Trend',
            dataPoints: [
              { date: '2024-01-08', count: 2 },
              { date: '2024-01-15', count: 5 },
            ],
          },
        ],
      }),
      identifyRecurringPatterns: jest.fn().mockResolvedValue({
        patterns: [
          {
            issueKeyword: 'API',
            occurrenceCount: 5,
            timeSeriesPattern: '増加傾向',
            priorityScore: 85,
          },
        ],
      }),
      sendReportToManager: jest.fn().mockResolvedValue({
        reportId: 'report-tx8-001',
        sentAt: '2024-01-15T10:30:00Z',
      }),
    };

    const input = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    await expect(
      runTx8Imp1Agent(input, stubAiClient)
    ).rejects.toThrow(/Impact score calculation failed/);

    expect(stubAiClient.assessImpactScore).toHaveBeenCalled();
  });
});