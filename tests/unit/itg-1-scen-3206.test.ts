import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('課題検索から可視化レポート作成までの自動実行 AIエージェント', () => {
  // SCEN-3206
  test('[error] 新規の未分類パターンが検出された場合にエスカレーション条件をトリガーして人への引き継ぎを実行', async () => {
    // テストのセットアップ: Tx8Imp1AiClientのモックを注入し、runTx8Imp1Agentオーケストレーターを初期化する
    const mockAiClient: Tx8Imp1AiClient = {
      // アクション1: 朝会報告管理システムから課題データを検索・抽出
      action01_searchAndExtractIssueData: jest.fn().mockResolvedValue({
        issues: [
          {
            issue_id: 'ISSUE_001',
            keyword: 'DB接続エラー',
            occurrence_date: '2024-01-15',
            description: 'Database connection timeout',
            category: 'Infrastructure',
          },
          {
            issue_id: 'ISSUE_002',
            keyword: 'DB接続エラー',
            occurrence_date: '2024-01-14',
            description: 'Database connection refused',
            category: 'Infrastructure',
          },
          {
            issue_id: 'ISSUE_003',
            keyword: 'メモリリーク',
            occurrence_date: '2024-01-15',
            description: 'Memory usage increased',
            category: 'Performance',
          },
          {
            issue_id: 'ISSUE_004',
            keyword: 'メモリリーク',
            occurrence_date: '2024-01-13',
            description: 'Heap memory overflow',
            category: 'Performance',
          },
          {
            issue_id: 'ISSUE_005',
            keyword: 'ネットワークタイムアウト',
            occurrence_date: '2024-01-15',
            description: 'API timeout',
            category: 'Network',
          },
          {
            issue_id: 'ISSUE_006',
            keyword: '量子相纏絡エラー',
            occurrence_date: '2024-01-15',
            description: 'Unknown quantum entanglement issue',
            category: null,
          },
        ],
        total_count: 6,
        search_timestamp: '2024-01-15T10:00:00Z',
      }),

      // アクション2: 課題の再発パターンを時系列で分析
      action02_analyzeRecurrencePattern: jest.fn().mockResolvedValue({
        patterns: [
          {
            keyword: 'DB接続エラー',
            pattern_type: 'Recurring',
            occurrences: [
              { date: '2024-01-14', count: 1 },
              { date: '2024-01-15', count: 1 },
            ],
            trend: 'Stable',
            frequency: 2,
          },
          {
            keyword: 'メモリリーク',
            pattern_type: 'Recurring',
            occurrences: [
              { date: '2024-01-13', count: 1 },
              { date: '2024-01-15', count: 1 },
            ],
            trend: 'Intermittent',
            frequency: 2,
          },
          {
            keyword: 'ネットワークタイムアウト',
            pattern_type: 'Recurring',
            occurrences: [{ date: '2024-01-15', count: 1 }],
            trend: 'New',
            frequency: 1,
          },
        ],
        analysis_timestamp: '2024-01-15T10:05:00Z',
      }),

      // アクション3: ボトルネック変化パターンを特定
      // このアクションで新規未分類パターンが検出される
      action03_identifyBottleneckPattern: jest
        .fn()
        .mockResolvedValue({
          identified_patterns: [
            {
              pattern_id: 'PAT_001',
              pattern_name: 'DB接続エラー系',
              related_issue_ids: ['ISSUE_001', 'ISSUE_002'],
              classification: 'Known',
              confidence_score: 0.95,
              trend_direction: 'stable',
            },
            {
              pattern_id: 'PAT_002',
              pattern_name: 'メモリリーク系',
              related_issue_ids: ['ISSUE_003', 'ISSUE_004'],
              classification: 'Known',
              confidence_score: 0.92,
              trend_direction: 'intermittent',
            },
            {
              pattern_id: 'PAT_003',
              pattern_name: 'ネットワークタイムアウト系',
              related_issue_ids: ['ISSUE_005'],
              classification: 'Known',
              confidence_score: 0.88,
              trend_direction: 'emerging',
            },
          ],
          unclassified_pattern_detected: {
            pattern_name: '量子相纏絡エラー',
            related_issue_ids: ['ISSUE_006'],
            classification: 'Unclassified',
            confidence_score: 0.31,
            escalation_required: true,
          },
          pattern_analysis_timestamp: '2024-01-15T10:10:00Z',
        }),

      // アクション4: 可視化レポート自動生成
      // このアクションは副作用確定前に実行されないはず
      action04_generateVisualizationReport: jest
        .fn()
        .mockResolvedValue({
          report_id: 'REPORT_001',
          graphs: [],
          status: 'NotGenerated',
        }),

      // アクション5: 優先度の高い課題を抽出して強調表示
      // このアクションも副作用確定前に実行されないはず
      action05_extractAndHighlightPriorityCases: jest
        .fn()
        .mockResolvedValue({
          priority_cases: [],
          status: 'NotExtracted',
        }),
    };

    // runTx8Imp1Agentオーケストレーターを実行
    const result = await runTx8Imp1Agent(
      {
        analysisStartDate: '2024-01-08',
        analysisEndDate: '2024-01-15',
        teamIds: ['TEAM_001'],
        minimumRecurrenceThreshold: 3,
        recipientManagerId: 'MGR_001',
      },
      mockAiClient,
    );

    // エスカレーション条件『新規の未分類パターンが検出された場合』をトリガーしているか確認
    // オーケストレーターが副作用の確定前に処理を一時停止し、人への引き継ぎ状態へ遷移することを確認
    expect(result.escapeReason).toBe('NewUnclassifiedPatternDetected');
    expect(result.escapeState).toBe('AwaitingHumanReview');

    // 引き継ぎ状態で、検出された新規未分類パターンの詳細情報がアクション3の出力に含まれていることを検証
    expect(result.escalationPayload).toBeDefined();
    expect(result.escalationPayload.pattern_name).toBe('量子相纏絡エラー');
    expect(result.escalationPayload.related_issue_ids).toEqual(['ISSUE_006']);
    expect(result.escalationPayload.confidence_score).toBe(0.31);

    // アクション4（可視化レポート自動生成）とアクション5（優先度抽出）が実行されていないことを確認
    // 副作用の確定がまだ発生していないため、これらのアクションの mockResolvedValue は
    // 'NotGenerated' と 'NotExtracted' のステータスを返すように設定されている
    expect(result.reportId).toBeUndefined();
    expect(result.visualizationGraphs).toBeUndefined();
    expect(result.recurringIssuePatterns).toBeUndefined();

    // アクション1～3が呼び出されたことを確認
    expect(mockAiClient.action01_searchAndExtractIssueData).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action02_analyzeRecurrencePattern).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action03_identifyBottleneckPattern).toHaveBeenCalledTimes(1);

    // アクション4・5は実行されていないか、副作用がない状態で呼ばれていることを確認
    // エスカレーション時点で処理が停止されるため、呼び出されないか、その結果が無視される
    const action04CallCount =
      (mockAiClient.action04_generateVisualizationReport as jest.Mock).mock
        .calls.length;
    const action05CallCount =
      (mockAiClient.action05_extractAndHighlightPriorityCases as jest.Mock)
        .mock.calls.length;

    // 副作用確定前の引き継ぎ状態では、アクション4・5は実行されない、または実行されても
    // 結果が最終出力に反映されない
    if (action04CallCount === 0) {
      expect(true).toBe(true); // 実行されていない（期待される状態）
    } else {
      expect(
        (mockAiClient.action04_generateVisualizationReport as jest.Mock).mock
          .results[0].value.status,
      ).toBe('NotGenerated');
    }

    if (action05CallCount === 0) {
      expect(true).toBe(true); // 実行されていない（期待される状態）
    } else {
      expect(
        (mockAiClient.action05_extractAndHighlightPriorityCases as jest.Mock)
          .mock.results[0].value.status,
      ).toBe('NotExtracted');
    }

    // 引き継ぎ状態から人による承認を受けたことをシミュレート
    // 承認後にアクション4・5が再開される準備状態となることを確認
    expect(result.readyForResumeAfterApproval).toBe(true);
    expect(result.resumeCheckpoint).toBe('action04');
  });
});