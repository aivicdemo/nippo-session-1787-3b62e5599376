import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern, type VisualizationGraph } from '../../src/agents/tx-8-imp-1/types';

describe('tx-8-imp-1: ボトルネック変化パターン可視化レポート生成', () => {
  // SCEN-2003
  test('過去データ期間が29日のとき、30日未満として処理される', async () => {
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-30T00:00:00Z';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const mockAiClient = {
      extractRecurringPatterns: jest.fn(async () => [
        {
          issueKeyword: 'デプロイ失敗',
          occurrenceCount: 5,
          timeSeriesPattern: '増加傾向',
          priorityScore: 85,
        } as RecurringIssuePattern,
        {
          issueKeyword: 'ビルドエラー',
          occurrenceCount: 4,
          timeSeriesPattern: '周期的',
          priorityScore: 72,
        } as RecurringIssuePattern,
      ]),
      selectVisualizationGraphs: jest.fn(async () => [
        {
          graphType: '折れ線',
          title: '課題発生頻度の時系列推移',
          dataPoints: [
            { date: '2024-01-08', count: 2 },
            { date: '2024-01-15', count: 3 },
            { date: '2024-01-22', count: 5 },
            { date: '2024-01-29', count: 5 },
          ],
        } as VisualizationGraph,
        {
          graphType: 'ヒートマップ',
          title: 'チーム別課題分布',
          dataPoints: [
            { team: 'team-001', issueType: 'デプロイ失敗', count: 5 },
            { team: 'team-001', issueType: 'ビルドエラー', count: 4 },
          ],
        } as VisualizationGraph,
      ]),
      sendReportToManager: jest.fn(async () => ({
        reportId: 'report-tx8-20240130',
        emailSentAt: '2024-01-30T09:00:00Z',
      })),
    };

    const input: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const output = await runTx8Imp1Agent(input, mockAiClient);

    const analysisDurationDays = Math.floor(
      (new Date(analysisEndDate).getTime() - new Date(analysisStartDate).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    expect(analysisDurationDays).toBe(29);
    expect(output.reportId).toBe('report-tx8-20240130');
    expect(output.recurringIssuePatterns).toHaveLength(2);
    expect(output.recurringIssuePatterns[0]).toEqual({
      issueKeyword: 'デプロイ失敗',
      occurrenceCount: 5,
      timeSeriesPattern: '増加傾向',
      priorityScore: 85,
    });
    expect(output.visualizationGraphs).toHaveLength(2);
    expect(output.visualizationGraphs[0]).toEqual({
      graphType: '折れ線',
      title: '課題発生頻度の時系列推移',
      dataPoints: [
        { date: '2024-01-08', count: 2 },
        { date: '2024-01-15', count: 3 },
        { date: '2024-01-22', count: 5 },
        { date: '2024-01-29', count: 5 },
      ],
    });
    expect(output.emailSentAt).toBe('2024-01-30T09:00:00Z');
    expect(mockAiClient.extractRecurringPatterns).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisStartDate,
        analysisEndDate,
        teamIds,
        minimumRecurrenceThreshold,
      })
    );
    expect(mockAiClient.selectVisualizationGraphs).toHaveBeenCalledWith(
      expect.objectContaining({
        recurringIssuePatterns: expect.arrayContaining([
          expect.objectContaining({ issueKeyword: 'デプロイ失敗' }),
        ]),
      })
    );
    expect(mockAiClient.sendReportToManager).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientManagerId,
        reportId: 'report-tx8-20240130',
      })
    );
  });
});