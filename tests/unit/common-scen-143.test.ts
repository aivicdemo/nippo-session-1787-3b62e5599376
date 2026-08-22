import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import {
  buildAction01Prompt,
  ACTION_01_PROMPT_VERSION,
} from '../../src/agents/tx-8-imp-1/prompts/action-01';
import {
  buildAction02Prompt,
  ACTION_02_PROMPT_VERSION,
} from '../../src/agents/tx-8-imp-1/prompts/action-02';
import {
  buildAction03Prompt,
  ACTION_03_PROMPT_VERSION,
} from '../../src/agents/tx-8-imp-1/prompts/action-03';
import {
  buildAction04Prompt,
  ACTION_04_PROMPT_VERSION,
} from '../../src/agents/tx-8-imp-1/prompts/action-04';
import {
  buildAction05Prompt,
  ACTION_05_PROMPT_VERSION,
} from '../../src/agents/tx-8-imp-1/prompts/action-05';

describe('Tx8Imp1Agent - 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-143
  test('通常案件で5つのアクションが順序どおり完了し、最終可視化レポートが返却される', async () => {
    // Arrange: モック AI クライアントを準備
    const mockAiClient = {
      callAi: jest.fn(),
    };

    // Action 1: 課題データ検索・抽出の戻り値
    const action01Response = {
      issues: [
        {
          issueId: 'ISS-001',
          description: 'Database connection timeout',
          occurrenceDateTime: '2024-01-10T09:30:00Z',
          category: 'Infrastructure',
        },
        {
          issueId: 'ISS-002',
          description: 'API response delay',
          occurrenceDateTime: '2024-01-10T10:15:00Z',
          category: 'Performance',
        },
        {
          issueId: 'ISS-003',
          description: 'Memory leak in batch job',
          occurrenceDateTime: '2024-01-09T14:45:00Z',
          category: 'Code Quality',
        },
        {
          issueId: 'ISS-004',
          description: 'Database connection timeout',
          occurrenceDateTime: '2024-01-08T09:20:00Z',
          category: 'Infrastructure',
        },
        {
          issueId: 'ISS-005',
          description: 'Deployment script failure',
          occurrenceDateTime: '2024-01-08T16:00:00Z',
          category: 'DevOps',
        },
        {
          issueId: 'ISS-006',
          description: 'API response delay',
          occurrenceDateTime: '2024-01-07T11:30:00Z',
          category: 'Performance',
        },
        {
          issueId: 'ISS-007',
          description: 'Cache inconsistency',
          occurrenceDateTime: '2024-01-07T13:20:00Z',
          category: 'Data Integrity',
        },
        {
          issueId: 'ISS-008',
          description: 'Database connection timeout',
          occurrenceDateTime: '2024-01-06T08:50:00Z',
          category: 'Infrastructure',
        },
        {
          issueId: 'ISS-009',
          description: 'Load balancer misconfiguration',
          occurrenceDateTime: '2024-01-06T15:10:00Z',
          category: 'Infrastructure',
        },
        {
          issueId: 'ISS-010',
          description: 'API response delay',
          occurrenceDateTime: '2024-01-05T10:00:00Z',
          category: 'Performance',
        },
      ],
    };

    // Action 2: 再発パターン時系列分析の戻り値
    const action02Response = {
      timeSeriesPatterns: [
        {
          patternId: 'PAT-001',
          description: 'Database connection timeout',
          occurrenceFrequency: 3,
          dateTimeInterval: {
            startDate: '2024-01-06T08:50:00Z',
            endDate: '2024-01-10T09:30:00Z',
          },
        },
        {
          patternId: 'PAT-002',
          description: 'API response delay',
          occurrenceFrequency: 3,
          dateTimeInterval: {
            startDate: '2024-01-05T10:00:00Z',
            endDate: '2024-01-10T10:15:00Z',
          },
        },
        {
          patternId: 'PAT-003',
          description: 'Infrastructure issues',
          occurrenceFrequency: 4,
          dateTimeInterval: {
            startDate: '2024-01-06T08:50:00Z',
            endDate: '2024-01-10T09:30:00Z',
          },
        },
      ],
    };

    // Action 3: ボトルネック変化パターン特定の戻り値
    const action03Response = {
      bottleneckPatterns: [
        {
          patternType: 'Infrastructure degradation',
          impactRange: 'System-wide',
          importanceScore: 95,
        },
        {
          patternType: 'Performance fluctuation',
          impactRange: 'API layer',
          importanceScore: 82,
        },
        {
          patternType: 'Data consistency issue',
          impactRange: 'Cache layer',
          importanceScore: 65,
        },
      ],
    };

    // Action 4: 可視化レポート自動生成の戻り値
    const action04Response = {
      visualizationReport: {
        graphData: {
          timeSeriesGraph: {
            xAxis: ['2024-01-05', '2024-01-06', '2024-01-07', '2024-01-08', '2024-01-09', '2024-01-10'],
            yAxis: [1, 2, 2, 3, 1, 2],
            title: 'Issue occurrence frequency over time',
          },
          bottleneckTrendGraph: {
            xAxis: ['2024-01-05', '2024-01-06', '2024-01-07', '2024-01-08', '2024-01-09', '2024-01-10'],
            yAxis: [20, 55, 45, 72, 38, 88],
            title: 'Bottleneck impact trend',
          },
        },
        aggregationTable: {
          columns: ['Pattern ID', 'Type', 'Frequency', 'Start Date', 'End Date'],
          rows: [
            ['PAT-001', 'Database timeout', '3', '2024-01-06', '2024-01-10'],
            ['PAT-002', 'API delay', '3', '2024-01-05', '2024-01-10'],
            ['PAT-003', 'Infrastructure', '4', '2024-01-06', '2024-01-10'],
          ],
        },
        analysisSummary: 'Infrastructure issues are the primary bottleneck, with 4 occurrences over 4 days.',
      },
    };

    // Action 5: 優先度の高い課題抽出・強調表示の戻り値
    const action05Response = {
      prioritizedIssues: [
        {
          issueId: 'ISS-001',
          priorityScore: 95,
          recommendedAction: 'Immediate infrastructure audit and optimization',
        },
        {
          issueId: 'ISS-002',
          priorityScore: 82,
          recommendedAction: 'API performance profiling and caching strategy review',
        },
        {
          issueId: 'ISS-007',
          priorityScore: 65,
          recommendedAction: 'Cache consistency mechanism improvement',
        },
      ],
    };

    // モック AI クライアントのセットアップ
    mockAiClient.callAi
      .mockResolvedValueOnce(action01Response)
      .mockResolvedValueOnce(action02Response)
      .mockResolvedValueOnce(action03Response)
      .mockResolvedValueOnce(action04Response)
      .mockResolvedValueOnce(action05Response);

    const input = {
      analysisPeriodStartDate: '2024-01-05',
      analysisPeriodEndDate: '2024-01-10',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10,
    };

    // Act: runTx8Imp1Agent を実行
    const result = await runTx8Imp1Agent(input, mockAiClient);

    // Assert: プロンプトが正しく生成されたことを確認
    expect(mockAiClient.callAi).toHaveBeenCalledTimes(5);

    // Action 1 のプロンプト確認
    const action01Call = mockAiClient.callAi.mock.calls[0][0];
    expect(action01Call).toContain(ACTION_01_PROMPT_VERSION);
    const action01Prompt = buildAction01Prompt({
      analysisPeriodStartDate: '2024-01-05',
      analysisPeriodEndDate: '2024-01-10',
    });
    expect(action01Prompt).toBeTruthy();

    // Action 2 のプロンプト確認
    const action02Call = mockAiClient.callAi.mock.calls[1][0];
    expect(action02Call).toContain(ACTION_02_PROMPT_VERSION);
    const action02Prompt = buildAction02Prompt({
      issues: action01Response.issues,
    });
    expect(action02Prompt).toBeTruthy();

    // Action 3 のプロンプト確認
    const action03Call = mockAiClient.callAi.mock.calls[2][0];
    expect(action03Call).toContain(ACTION_03_PROMPT_VERSION);
    const action03Prompt = buildAction03Prompt({
      timeSeriesPatterns: action02Response.timeSeriesPatterns,
    });
    expect(action03Prompt).toBeTruthy();

    // Action 4 のプロンプト確認
    const action04Call = mockAiClient.callAi.mock.calls[3][0];
    expect(action04Call).toContain(ACTION_04_PROMPT_VERSION);
    const action04Prompt = buildAction04Prompt({
      issues: action01Response.issues,
      bottleneckPatterns: action03Response.bottleneckPatterns,
    });
    expect(action04Prompt).toBeTruthy();

    // Action 5 のプロンプト確認
    const action05Call = mockAiClient.callAi.mock.calls[4][0];
    expect(action05Call).toContain(ACTION_05_PROMPT_VERSION);
    const action05Prompt = buildAction05Prompt({
      visualizationReport: action04Response.visualizationReport,
    });
    expect(action05Prompt).toBeTruthy();

    // 最終レポートの構成を検証
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('analysisStatus');
    expect(result).toHaveProperty('recurringIssueCount');
    expect(result).toHaveProperty('reportDeliveryStatus');

    // 通常案件の期待値
    expect(result.analysisStatus).toBe('completed');
    expect(result.recurringIssueCount).toBe(3);
    expect(result.reportDeliveryStatus).toBe('sent');

    // レポート ID が生成されていることを確認
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    // 再発パターンと優先度データが統合されていることを確認
    expect(result).toHaveProperty('recurringIssueCount', 3);
  });
});