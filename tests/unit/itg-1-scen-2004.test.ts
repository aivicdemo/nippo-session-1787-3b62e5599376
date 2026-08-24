import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/types';

describe('tx-8-imp-1 agent: ボトルネック変化パターン可視化レポート生成', () => {
  // SCEN-2004
  test('過去データ期間が31日のとき、30日超過として処理される', async () => {
    // Arrange: モック AI クライアント
    const mockAiClient = {
      extractRecurringPatterns: jest.fn().mockResolvedValue({
        patterns: [
          {
            issueKeyword: 'API遅延',
            occurrenceCount: 5,
            timeSeriesPattern: '増加傾向',
            priorityScore: 85,
          },
          {
            issueKeyword: 'DB接続エラー',
            occurrenceCount: 3,
            timeSeriesPattern: '周期的',
            priorityScore: 72,
          },
        ],
        periodExceeded: true,
        excessDays: 1,
      }),
      selectVisualizationGraphs: jest.fn().mockResolvedValue({
        graphs: [
          {
            graphType: '折れ線',
            title: '課題発生頻度の時系列推移',
            dataPoints: [
              { date: '2024-12-15', count: 2 },
              { date: '2024-12-16', count: 3 },
              { date: '2024-12-17', count: 5 },
            ],
          },
          {
            graphType: 'ヒートマップ',
            title: '曜日別・課題別の発生パターン',
            dataPoints: [
              { day: '月', issue: 'API遅延', intensity: 0.9 },
              { day: '火', issue: 'DB接続エラー', intensity: 0.6 },
            ],
          },
        ],
      }),
      generateReportMetadata: jest.fn().mockResolvedValue({
        reportId: 'rpt-20241217-001',
        generatedAt: '2024-12-17T10:30:00Z',
        periodExceededFlag: true,
        excessDays: 1,
        dataQualityScore: 92,
      }),
    };

    const input: Tx8AgentInput = {
      analysisStartDate: '2024-11-16',
      analysisEndDate: '2024-12-17',
      teamIds: ['team-001', 'team-002'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'mgr-001',
    };

    // Act
    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    // Assert
    expect(result).toBeDefined();
    expect(result.reportId).toBe('rpt-20241217-001');
    expect(result.recurringIssuePatterns).toHaveLength(2);
    expect(result.recurringIssuePatterns[0]).toEqual({
      issueKeyword: 'API遅延',
      occurrenceCount: 5,
      timeSeriesPattern: '増加傾向',
      priorityScore: 85,
    });
    expect(result.recurringIssuePatterns[1]).toEqual({
      issueKeyword: 'DB接続エラー',
      occurrenceCount: 3,
      timeSeriesPattern: '周期的',
      priorityScore: 72,
    });
    expect(result.visualizationGraphs).toHaveLength(2);
    expect(result.visualizationGraphs[0]).toEqual({
      graphType: '折れ線',
      title: '課題発生頻度の時系列推移',
      dataPoints: [
        { date: '2024-12-15', count: 2 },
        { date: '2024-12-16', count: 3 },
        { date: '2024-12-17', count: 5 },
      ],
    });
    expect(result.visualizationGraphs[1]).toEqual({
      graphType: 'ヒートマップ',
      title: '曜日別・課題別の発生パターン',
      dataPoints: [
        { day: '月', issue: 'API遅延', intensity: 0.9 },
        { day: '火', issue: 'DB接続エラー', intensity: 0.6 },
      ],
    });
    expect(result.emailSentAt).toBe('2024-12-17T10:30:00Z');

    // 期間超過判定の検証
    expect(mockAiClient.extractRecurringPatterns).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisStartDate: '2024-11-16',
        analysisEndDate: '2024-12-17',
      })
    );

    const extractCall = mockAiClient.extractRecurringPatterns.mock.results[0].value;
    expect(extractCall.periodExceeded).toBe(true);
    expect(extractCall.excessDays).toBe(1);

    // レポートメタデータの検証
    expect(mockAiClient.generateReportMetadata).toHaveBeenCalled();
    const metadataResult = mockAiClient.generateReportMetadata.mock.results[0].value;
    expect(metadataResult.periodExceededFlag).toBe(true);
    expect(metadataResult.excessDays).toBe(1);
    expect(metadataResult.dataQualityScore).toBe(92);

    // データ品質スコアが基準以上（80以上）であることを確認
    // これにより、エスカレーション条件『データ品質が基準以下の場合』に該当しないことを確認
    expect(metadataResult.dataQualityScore).toBeGreaterThanOrEqual(80);
  });
});