import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-3208
  test('分析結果に矛盾がある場合に副作用確定前に人へ引き継ぐ', async () => {
    const audit_events: Array<{
      timestamp: string;
      event_type: string;
      contradicted_issue_id: string;
      analysis_period_1: string;
      priority_period_1: string;
      analysis_period_2: string;
      priority_period_2: string;
      handover_target: string;
    }> = [];

    const fake_ai_client: Tx8Imp1AiClient = {
      // Action 1: 朝会報告管理システムから課題データを検索・抽出する
      searchIssueData: async (input: {
        analysisStartDate: string;
        analysisEndDate: string;
        teamIds?: string[];
      }) => {
        return {
          issueCount: 50,
          issues: Array.from({ length: 50 }, (_, index) => ({
            issue_id: `ISSUE_${String(index + 1).padStart(3, '0')}`,
            keyword: index < 10 ? 'ビルドエラー' : index < 20 ? 'テストスイート失敗' : 'デプロイ遅延',
            first_reported_date: '2024-01-15',
            last_reported_date: '2024-02-28',
            frequency_count: 10 - (index % 10),
          })),
          format_status: 'unified',
        };
      },

      // Action 2: 課題の再発パターンを時系列で分析する
      analyzeRecurrencePattern: async (input: { issues: unknown[] }) => {
        return {
          patterns: [
            {
              issue_id: 'ISSUE_001',
              keyword: 'ビルドエラー',
              occurrence_dates: ['2024-01-15', '2024-01-22', '2024-01-29', '2024-02-05'],
              time_series_pattern: 'increasing_trend',
            },
            {
              issue_id: 'ISSUE_011',
              keyword: 'テストスイート失敗',
              occurrence_dates: ['2024-01-20', '2024-02-10', '2024-02-20'],
              time_series_pattern: 'periodic',
            },
          ],
        };
      },

      // Action 3: ボトルネック変化パターンを特定する
      identifyBottleneckPattern: async (input: { patterns: unknown[] }) => {
        return {
          bottleneck_changes: [
            {
              issue_id: 'ISSUE_001',
              keyword: 'ビルドエラー',
              period_1: { start: '2024-01-15', end: '2024-01-31', pattern: 'increasing' },
              period_2: { start: '2024-02-01', end: '2024-02-28', pattern: 'stable' },
            },
          ],
        };
      },

      // Action 4: 可視化レポート自動生成処理を実行する
      generateVisualizationReport: async (input: { bottleneck_data: unknown[] }) => {
        return {
          report_id: 'RPT_20240301_001',
          graphs: [
            {
              graph_type: 'line_chart',
              title: 'ビルドエラー発生頻度の推移',
              data_points: [
                { date: '2024-01-15', count: 3 },
                { date: '2024-01-22', count: 5 },
                { date: '2024-01-29', count: 8 },
                { date: '2024-02-05', count: 7 },
              ],
            },
          ],
          status: 'draft',
        };
      },

      // Action 5: 優先度の高い課題を抽出して強調表示する処理
      // このアクションの前に矛盾検出が発動するため、呼び出されるべきではない
      highlightHighPriorityCases: async (input: { report_id: string }) => {
        throw new Error('This action should not be called due to contradiction detection');
      },

      // 矛盾検出ロジックをシミュレート
      detectAnalysisContradictions: async (input: { report_id: string; graph_data: unknown[] }) => {
        // 意図的に矛盾を注入: 同一課題の相反する分析結果
        return {
          has_contradictions: true,
          contradictions: [
            {
              issue_id: 'ISSUE_001',
              keyword: 'ビルドエラー',
              period_1: {
                date_range: '2024-01-15 to 2024-01-31',
                analyzed_priority: 'HIGH',
                frequency: 16,
              },
              period_2: {
                date_range: '2024-02-01 to 2024-02-28',
                analyzed_priority: 'LOW', // 相反する判定
                frequency: 7,
              },
              contradiction_type: 'conflicting_priority_assignment',
            },
          ],
        };
      },
    };

    // オーケストレーターの初期入力
    const orchestrator_input = {
      analysisStartDate: '2024-01-15',
      analysisEndDate: '2024-02-28',
      teamIds: ['TEAM_001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'MGR_001',
    };

    // runTx8Imp1Agent を実行
    const result = await runTx8Imp1Agent(orchestrator_input, fake_ai_client);

    // (1) Action 4 までは正常に完了したか検証
    expect(result.reportId).toBe('RPT_20240301_001');
    expect(result.visualizationGraphs).toBeDefined();
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);
    expect(result.visualizationGraphs[0].graphType).toBe('line_chart');

    // (2) Action 5 実行前に矛盾検出ロジックが同一課題の相反する分析結果を特定したか
    // この検証は escalationReason で判定
    expect(result).toHaveProperty('escalationReason');
    expect(result.escalationReason).toMatch(/矛盾/);

    // (3) runTx8Imp1Agent が escalation 状態に遷移したか検証
    expect(result).toHaveProperty('escalationStatus');
    expect(result.escalationStatus).toBe('escalated');

    // (4) audit ログに「矛盾検出による人への引き継ぎ」イベントが記録されたか検証
    expect(result).toHaveProperty('auditLog');
    expect(Array.isArray(result.auditLog)).toBe(true);
    expect(result.auditLog.length).toBeGreaterThan(0);

    const contradiction_audit_event = result.auditLog.find(
      (event: Record<string, unknown>) => event.eventType === 'contradiction_detected_handover'
    );
    expect(contradiction_audit_event).toBeDefined();
    expect(contradiction_audit_event).toHaveProperty('timestamp');
    expect(typeof contradiction_audit_event.timestamp).toBe('string');
    expect(contradiction_audit_event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(contradiction_audit_event).toHaveProperty('contradictionDetails');
    expect(contradiction_audit_event.contradictionDetails).toHaveProperty('issueId');
    expect(contradiction_audit_event.contradictionDetails.issueId).toBe('ISSUE_001');
    expect(contradiction_audit_event.contradictionDetails).toHaveProperty('analysisResults');
    expect(contradiction_audit_event.contradictionDetails.analysisResults).toHaveProperty('period1Priority');
    expect(contradiction_audit_event.contradictionDetails.analysisResults.period1Priority).toBe('HIGH');
    expect(contradiction_audit_event.contradictionDetails.analysisResults).toHaveProperty('period2Priority');
    expect(contradiction_audit_event.contradictionDetails.analysisResults.period2Priority).toBe('LOW');
    expect(contradiction_audit_event).toHaveProperty('handoverTarget');
    expect(contradiction_audit_event.handoverTarget).toBe('MGR_001');

    // (5) レポートはドラフト状態のまま保持され、部長への自動提示が確定していないか検証
    expect(result).toHaveProperty('reportStatus');
    expect(result.reportStatus).toBe('draft');
    expect(result).toHaveProperty('emailSentAt');
    expect(result.emailSentAt).toBeNull();

    // NotificationServiceAdapter の sendReminderNotification が呼び出されていないか検証
    // これは実装側で sendReminderNotification が呼び出されないこと、
    // または呼び出されても escalation 状態では通知不可となることを確認
    expect(result).toHaveProperty('notificationSent');
    expect(result.notificationSent).toBe(false);

    // TextAnalysisServiceAdapter も再呼び出しされていないか検証
    expect(result).toHaveProperty('aiClientCallCount');
    expect(result.aiClientCallCount).toBeLessThanOrEqual(4); // Action 1-4 までのみ

    // escalation 遷移時の詳細情報を検証
    expect(result).toHaveProperty('escalationDetails');
    expect(result.escalationDetails).toHaveProperty('detectedAt');
    expect(result.escalationDetails).toHaveProperty('sideEffectRolledBack');
    expect(result.escalationDetails.sideEffectRolledBack).toBe(true);
  });
});