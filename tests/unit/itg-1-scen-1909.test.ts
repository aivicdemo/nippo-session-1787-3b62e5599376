import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題の時系列パターン可視化レポート生成', () => {
  // SCEN-1909: [normal] 課題の再発パターン分析機能 - 課題の時系列パターンが時間順に可視化される
  test('should generate recurring issue patterns with time-series visualization for correct recurring analysis', async () => {
    // Arrange: テストデータベースに以下の課題レコードを時系列で投入
    const analysisStartDate = '2024-01-15T00:00:00Z';
    const analysisEndDate = '2024-01-20T23:59:59Z';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 2;
    const recipientManagerId = 'manager-001';

    const agentInput: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    // モック化されたAIクライアント: TextAnalysisServiceAdapterをシミュレート
    // 課題Aは3回発生（2024-01-15, 2024-01-16, 2024-01-18）
    // 課題Bは2回発生（2024-01-17, 2024-01-19）
    // 課題Cは1回発生（2024-01-20）
    const mockAiClient = {
      extractTimeSeriesPatterns: jest.fn().mockResolvedValue({
        recurringPatterns: [
          {
            issueKeyword: 'Issue A',
            occurrenceCount: 3,
            occurrenceDates: [
              '2024-01-15T10:00:00Z',
              '2024-01-16T14:30:00Z',
              '2024-01-18T09:15:00Z',
            ],
            timeSeriesPattern: 'accelerating',
            priorityScore: 85,
          },
          {
            issueKeyword: 'Issue B',
            occurrenceCount: 2,
            occurrenceDates: [
              '2024-01-17T11:00:00Z',
              '2024-01-19T16:45:00Z',
            ],
            timeSeriesPattern: 'periodic',
            priorityScore: 72,
          },
          {
            issueKeyword: 'Issue C',
            occurrenceCount: 1,
            occurrenceDates: ['2024-01-20T13:20:00Z'],
            timeSeriesPattern: 'isolated',
            priorityScore: 45,
          },
        ],
      }),
      generateVisualizationGraphs: jest.fn().mockResolvedValue({
        graphs: [
          {
            graphType: 'timeline-chart',
            title: 'Recurring Issue Time Series Pattern',
            dataPoints: [
              {
                issueKeyword: 'Issue A',
                timestamp: '2024-01-15T10:00:00Z',
                xPosition: 0,
                yPosition: 0,
                markerLabel: 'Initial Report: 2024-01-15 10:00',
              },
              {
                issueKeyword: 'Issue A',
                timestamp: '2024-01-16T14:30:00Z',
                xPosition: 33,
                yPosition: 0,
                markerLabel: 'Recurrence: 2024-01-16 14:30',
              },
              {
                issueKeyword: 'Issue A',
                timestamp: '2024-01-18T09:15:00Z',
                xPosition: 67,
                yPosition: 0,
                markerLabel: 'Recurrence: 2024-01-18 09:15',
              },
              {
                issueKeyword: 'Issue B',
                timestamp: '2024-01-17T11:00:00Z',
                xPosition: 26,
                yPosition: 50,
                markerLabel: 'Initial Report: 2024-01-17 11:00',
              },
              {
                issueKeyword: 'Issue B',
                timestamp: '2024-01-19T16:45:00Z',
                xPosition: 60,
                yPosition: 50,
                markerLabel: 'Recurrence: 2024-01-19 16:45',
              },
              {
                issueKeyword: 'Issue C',
                timestamp: '2024-01-20T13:20:00Z',
                xPosition: 100,
                yPosition: 100,
                markerLabel: 'Initial Report: 2024-01-20 13:20',
              },
            ],
          },
        ],
      }),
    };

    // Act: 朝会報告管理システムの時系列パターン分析機能を実行
    const result: Tx8AgentOutput = await runTx8Imp1Agent(agentInput, mockAiClient);

    // Assert: 結果の妥当性を検証
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');

    // 再発パターンが3件存在することを検証
    expect(result.recurringIssuePatterns).toHaveLength(3);

    // 課題Aの再発パターン検証: 3回発生、時系列パターンは「加速傾向」
    const patternIssueA = result.recurringIssuePatterns.find(
      (p) => p.issueKeyword === 'Issue A'
    );
    expect(patternIssueA).toBeDefined();
    expect(patternIssueA?.occurrenceCount).toBe(3);
    expect(patternIssueA?.timeSeriesPattern).toBe('accelerating');
    expect(patternIssueA?.priorityScore).toBe(85);

    // 課題Bの再発パターン検証: 2回発生、時系列パターンは「周期的」
    const patternIssueB = result.recurringIssuePatterns.find(
      (p) => p.issueKeyword === 'Issue B'
    );
    expect(patternIssueB).toBeDefined();
    expect(patternIssueB?.occurrenceCount).toBe(2);
    expect(patternIssueB?.timeSeriesPattern).toBe('periodic');
    expect(patternIssueB?.priorityScore).toBe(72);

    // 課題Cの再発パターン検証: 1回発生（最小閾値未満であるため表示対象外となるが、データとしては取得されている）
    const patternIssueC = result.recurringIssuePatterns.find(
      (p) => p.issueKeyword === 'Issue C'
    );
    expect(patternIssueC).toBeDefined();
    expect(patternIssueC?.occurrenceCount).toBe(1);
    expect(patternIssueC?.timeSeriesPattern).toBe('isolated');
    expect(patternIssueC?.priorityScore).toBe(45);

    // 可視化グラフが生成されたことを検証
    expect(result.visualizationGraphs).toBeDefined();
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    // タイムラインチャートグラフの検証
    const timelineGraph = result.visualizationGraphs.find(
      (g) => g.graphType === 'timeline-chart'
    );
    expect(timelineGraph).toBeDefined();
    expect(timelineGraph?.title).toContain('Recurring Issue Time Series Pattern');

    // データポイントが正しく順序付けされているか検証
    expect(timelineGraph?.dataPoints).toBeDefined();
    expect(timelineGraph?.dataPoints?.length).toBe(6);

    // 課題Aのマーカーが3つ、時間順に左から右へ配置されているか検証
    const issueADataPoints = timelineGraph?.dataPoints?.filter(
      (dp) => dp.issueKeyword === 'Issue A'
    );
    expect(issueADataPoints).toHaveLength(3);
    expect(issueADataPoints?.[0]?.xPosition).toBe(0);
    expect(issueADataPoints?.[1]?.xPosition).toBe(33);
    expect(issueADataPoints?.[2]?.xPosition).toBe(67);
    expect(issueADataPoints?.[0]?.markerLabel).toContain('Initial Report');
    expect(issueADataPoints?.[1]?.markerLabel).toContain('Recurrence');
    expect(issueADataPoints?.[2]?.markerLabel).toContain('Recurrence');

    // 課題Bのマーカーが2つ、時間順に配置されているか検証
    const issueBDataPoints = timelineGraph?.dataPoints?.filter(
      (dp) => dp.issueKeyword === 'Issue B'
    );
    expect(issueBDataPoints).toHaveLength(2);
    expect(issueBDataPoints?.[0]?.xPosition).toBe(26);
    expect(issueBDataPoints?.[1]?.xPosition).toBe(60);

    // 課題Cのマーカーが1つ表示されているか検証
    const issueCDataPoints = timelineGraph?.dataPoints?.filter(
      (dp) => dp.issueKeyword === 'Issue C'
    );
    expect(issueCDataPoints).toHaveLength(1);
    expect(issueCDataPoints?.[0]?.xPosition).toBe(100);

    // メール送信日時が記録されているか検証
    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');
    // ISO 8601形式であることを検証
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.emailSentAt)).toBe(
      true
    );

    // AIクライアントが正しい引数で呼ばれたことを検証
    expect(mockAiClient.extractTimeSeriesPatterns).toHaveBeenCalledWith(
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold
    );
    expect(mockAiClient.generateVisualizationGraphs).toHaveBeenCalled();
  });
});