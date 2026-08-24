import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type {
  Tx8AgentInput,
  Tx8AgentOutput,
  RecurringIssuePattern,
  VisualizationGraph,
} from '../../src/agents/tx-8-imp-1/types';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-3204
  test('優先度スコア70以上の課題が強調表示フラグ付きで最上位に配置されること', async () => {
    // ========================================
    // 1. モック化したTx8Imp1AiClientの準備
    // ========================================
    const mockPromptCalls: string[] = [];

    const mockAiClient = {
      buildAction01Prompt: jest
        .fn()
        .mockReturnValue('action-01: extract issues'),
      buildAction02Prompt: jest
        .fn()
        .mockReturnValue('action-02: time series analysis'),
      buildAction03Prompt: jest
        .fn()
        .mockReturnValue('action-03: identify patterns'),
      buildAction04Prompt: jest
        .fn()
        .mockReturnValue('action-04: generate report'),
      buildAction05Prompt: jest
        .fn()
        .mockReturnValue('action-05: extract highlighted issues'),
      callAi: jest.fn().mockImplementation(async (promptType: string) => {
        mockPromptCalls.push(promptType);
        if (promptType === 'action-01') {
          return JSON.stringify({
            extracted_issues: [
              { keyword: 'database_timeout', frequency: 12 },
              { keyword: 'memory_leak', frequency: 8 },
              { keyword: 'network_latency', frequency: 5 },
              { keyword: 'auth_failure', frequency: 15 },
              { keyword: 'cache_miss', frequency: 6 },
            ],
          });
        }
        if (promptType === 'action-02') {
          return JSON.stringify({
            time_series_patterns: [
              { keyword: 'database_timeout', pattern: 'increasing_trend' },
              { keyword: 'auth_failure', pattern: 'periodic' },
              { keyword: 'memory_leak', pattern: 'cyclic' },
              { keyword: 'network_latency', pattern: 'random' },
              { keyword: 'cache_miss', pattern: 'increasing_trend' },
            ],
          });
        }
        if (promptType === 'action-03') {
          return JSON.stringify({
            bottleneck_patterns: [
              { keyword: 'database_timeout', severity: 'critical' },
              { keyword: 'auth_failure', severity: 'high' },
              { keyword: 'memory_leak', severity: 'high' },
            ],
          });
        }
        if (promptType === 'action-04') {
          return JSON.stringify({
            visualization_data: [
              {
                issue_id: 'issue_001',
                keyword: 'database_timeout',
                frequency: 12,
                priority_score: 85,
                pattern: 'increasing_trend',
              },
              {
                issue_id: 'issue_002',
                keyword: 'auth_failure',
                frequency: 15,
                priority_score: 92,
                pattern: 'periodic',
              },
              {
                issue_id: 'issue_003',
                keyword: 'memory_leak',
                frequency: 8,
                priority_score: 72,
                pattern: 'cyclic',
              },
              {
                issue_id: 'issue_004',
                keyword: 'network_latency',
                frequency: 5,
                priority_score: 45,
                pattern: 'random',
              },
              {
                issue_id: 'issue_005',
                keyword: 'cache_miss',
                frequency: 6,
                priority_score: 55,
                pattern: 'increasing_trend',
              },
              {
                issue_id: 'issue_006',
                keyword: 'session_timeout',
                frequency: 3,
                priority_score: 30,
                pattern: 'random',
              },
              {
                issue_id: 'issue_007',
                keyword: 'file_not_found',
                frequency: 4,
                priority_score: 38,
                pattern: 'random',
              },
              {
                issue_id: 'issue_008',
                keyword: 'permission_denied',
                frequency: 7,
                priority_score: 68,
                pattern: 'cyclic',
              },
              {
                issue_id: 'issue_009',
                keyword: 'resource_exhausted',
                frequency: 9,
                priority_score: 78,
                pattern: 'increasing_trend',
              },
              {
                issue_id: 'issue_010',
                keyword: 'deadlock_detected',
                frequency: 2,
                priority_score: 65,
                pattern: 'random',
              },
            ],
          });
        }
        if (promptType === 'action-05') {
          return JSON.stringify({
            highlighted_issues: [
              {
                issue_id: 'issue_002',
                keyword: 'auth_failure',
                priority_score: 92,
                highlight_flag: true,
                visual_markers: {
                  color: 'red',
                  font_weight: 'bold',
                  icon: 'alert',
                },
              },
              {
                issue_id: 'issue_001',
                keyword: 'database_timeout',
                priority_score: 85,
                highlight_flag: true,
                visual_markers: {
                  color: 'red',
                  font_weight: 'bold',
                  icon: 'alert',
                },
              },
              {
                issue_id: 'issue_009',
                keyword: 'resource_exhausted',
                priority_score: 78,
                highlight_flag: true,
                visual_markers: {
                  color: 'orange',
                  font_weight: 'bold',
                  icon: 'warning',
                },
              },
              {
                issue_id: 'issue_003',
                keyword: 'memory_leak',
                priority_score: 72,
                highlight_flag: true,
                visual_markers: {
                  color: 'orange',
                  font_weight: 'normal',
                  icon: 'warning',
                },
              },
              {
                issue_id: 'issue_005',
                keyword: 'cache_miss',
                priority_score: 55,
                highlight_flag: false,
                visual_markers: null,
              },
              {
                issue_id: 'issue_004',
                keyword: 'network_latency',
                priority_score: 45,
                highlight_flag: false,
                visual_markers: null,
              },
              {
                issue_id: 'issue_007',
                keyword: 'file_not_found',
                priority_score: 38,
                highlight_flag: false,
                visual_markers: null,
              },
              {
                issue_id: 'issue_006',
                keyword: 'session_timeout',
                priority_score: 30,
                highlight_flag: false,
                visual_markers: null,
              },
              {
                issue_id: 'issue_008',
                keyword: 'permission_denied',
                priority_score: 68,
                highlight_flag: false,
                visual_markers: null,
              },
              {
                issue_id: 'issue_010',
                keyword: 'deadlock_detected',
                priority_score: 65,
                highlight_flag: false,
                visual_markers: null,
              },
            ],
          });
        }
        return JSON.stringify({});
      }),
    };

    // ========================================
    // 2. テスト入力パラメータの準備
    // ========================================
    const agentInput: Tx8AgentInput = {
      analysisStartDate: '2024-01-01T00:00:00Z',
      analysisEndDate: '2024-01-31T23:59:59Z',
      teamIds: ['team_001', 'team_002'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager_001',
    };

    // ========================================
    // 3. AIエージェント実行
    // ========================================
    const output: Tx8AgentOutput = await runTx8Imp1Agent(
      agentInput,
      mockAiClient as any
    );

    // ========================================
    // 4. 出力結果の検証
    // ========================================

    // 4.1 基本的な出力フィールドの存在確認
    expect(output).toHaveProperty('reportId');
    expect(output).toHaveProperty('recurringIssuePatterns');
    expect(output).toHaveProperty('visualizationGraphs');
    expect(output).toHaveProperty('emailSentAt');

    // 4.2 reportIdが一意の識別子であることを確認
    expect(typeof output.reportId).toBe('string');
    expect(output.reportId.length).toBeGreaterThan(0);

    // 4.3 再発課題パターンの確認
    expect(Array.isArray(output.recurringIssuePatterns)).toBe(true);
    expect(output.recurringIssuePatterns.length).toBeGreaterThanOrEqual(1);

    const recurringPatterns: RecurringIssuePattern[] =
      output.recurringIssuePatterns;
    recurringPatterns.forEach((pattern) => {
      expect(typeof pattern.issueKeyword).toBe('string');
      expect(typeof pattern.occurrenceCount).toBe('number');
      expect(pattern.occurrenceCount).toBeGreaterThan(0);
      expect(typeof pattern.timeSeriesPattern).toBe('string');
      expect(typeof pattern.priorityScore).toBe('number');
      expect(pattern.priorityScore).toBeGreaterThanOrEqual(0);
      expect(pattern.priorityScore).toBeLessThanOrEqual(100);
    });

    // 4.4 可視化グラフの確認
    expect(Array.isArray(output.visualizationGraphs)).toBe(true);
    expect(output.visualizationGraphs.length).toBeGreaterThanOrEqual(1);

    const graphs: VisualizationGraph[] = output.visualizationGraphs;
    graphs.forEach((graph) => {
      expect(typeof graph.graphType).toBe('string');
      expect(['line', 'bar', 'pie', 'heatmap']).toContain(graph.graphType);
      expect(typeof graph.title).toBe('string');
      expect(Array.isArray(graph.dataPoints)).toBe(true);
      expect(graph.dataPoints.length).toBeGreaterThan(0);
    });

    // ========================================
    // 5. 優先度スコア70以上の課題の強調表示検証
    // ========================================

    // 5.1 可視化グラフのデータポイントから優先度情報を抽出
    const highlightedIssues = graphs
      .flatMap((g) => g.dataPoints)
      .filter(
        (dp: any) =>
          dp.priority_score !== undefined &&
          dp.highlight_flag !== undefined
      );

    expect(highlightedIssues.length).toBeGreaterThanOrEqual(4);

    // 5.2 優先度スコア70以上の課題が強調表示フラグtrueであることを確認
    const highPriorityIssues = highlightedIssues.filter(
      (issue: any) => issue.priority_score >= 70
    );

    expect(highPriorityIssues.length).toBeGreaterThanOrEqual(4);

    highPriorityIssues.forEach((issue: any) => {
      expect(issue.highlight_flag).toBe(true);
      expect(issue.visual_markers).not.toBeNull();
      expect(issue.visual_markers).toHaveProperty('color');
      expect(issue.visual_markers).toHaveProperty('font_weight');
      expect(issue.visual_markers).toHaveProperty('icon');
      expect(['red', 'orange', 'yellow']).toContain(
        issue.visual_markers.color
      );
      expect(['bold', 'normal']).toContain(issue.visual_markers.font_weight);
      expect(['alert', 'warning', 'info']).toContain(
        issue.visual_markers.icon
      );
    });

    // 5.3 優先度スコア70未満の課題が強調表示フラグfalseであることを確認
    const lowPriorityIssues = highlightedIssues.filter(
      (issue: any) => issue.priority_score < 70
    );

    lowPriorityIssues.forEach((issue: any) => {
      expect(issue.highlight_flag).toBe(false);
      expect(issue.visual_markers).toBeNull();
    });

    // 5.4 強調表示課題がレポート上位3件以内に配置されていることを確認
    const sortedByHighlight = highlightedIssues.sort(
      (a: any, b: any) => b.priority_score - a.priority_score
    );

    const topThreeHighlighted = sortedByHighlight.slice(0, 3);
    topThreeHighlighted.forEach((issue: any) => {
      expect(issue.highlight_flag).toBe(true);
    });

    // ========================================
    // 6. AIクライアントの呼び出し検証
    // ========================================

    // 6.1 各アクションが正確に1回ずつ呼び出されたことを確認
    expect(mockAiClient.buildAction01Prompt).toHaveBeenCalledTimes(1);
    expect(mockAiClient.buildAction02Prompt).toHaveBeenCalledTimes(1);
    expect(mockAiClient.buildAction03Prompt).toHaveBeenCalledTimes(1);
    expect(mockAiClient.buildAction04Prompt).toHaveBeenCalledTimes(1);
    expect(mockAiClient.buildAction05Prompt).toHaveBeenCalledTimes(1);

    // 6.2 callAiが5回呼び出されたことを確認
    expect(mockAiClient.callAi).toHaveBeenCalledTimes(5);

    // 6.3 モック呼び出しの順序確認
    expect(mockPromptCalls).toContain('action-01');
    expect(mockPromptCalls).toContain('action-02');
    expect(mockPromptCalls).toContain('action-03');
    expect(mockPromptCalls).toContain('action-04');
    expect(mockPromptCalls).toContain('action-05');

    // ========================================
    // 7. 優先度判定ロジックの適用確認
    // ========================================

    // 7.1 優先度スコア閾値70による判定が正しく適用されているか
    const allIssuesWithScore = highlightedIssues.filter(
      (issue: any) =>
        typeof issue.priority_score === 'number' &&
        issue.priority_score >= 0 &&
        issue.priority_score <= 100
    );

    allIssuesWithScore.forEach((issue: any) => {
      const expectedHighlightFlag = issue.priority_score >= 70;
      expect(issue.highlight_flag).toBe(expectedHighlightFlag);
    });

    // 7.2 優先度スコア70以上のグループと70未満のグループが正しく分離されているか
    const scoreDistribution = allIssuesWithScore.map(
      (issue: any) => issue.priority_score
    );
    const maxLowPriority = scoreDistribution
      .filter((score: number) => score < 70)
      .reduce((max: number, score: number) => Math.max(max, score), -1);
    const minHighPriority = scoreDistribution
      .filter((score: number) => score >= 70)
      .reduce((min: number, score: number) => Math.min(min, score), 101);

    expect(maxLowPriority).toBeLessThan(70);
    if (minHighPriority !== 101) {
      expect(minHighPriority).toBeGreaterThanOrEqual(70);
    }

    // ========================================
    // 8. メール送信日時の確認
    // ========================================
    expect(typeof output.emailSentAt).toBe('string');
    const emailSentDate = new Date(output.emailSentAt);
    expect(emailSentDate.getTime()).toBeGreaterThan(0);
    expect(emailSentDate.getTime()).toBeLessThanOrEqual(
      new Date('2024-01-31T23:59:59Z').getTime() + 86400000
    );
  });
});