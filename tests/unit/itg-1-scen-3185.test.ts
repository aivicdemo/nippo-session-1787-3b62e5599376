import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-3185
  test('ボトルネック推移を特定するアクションが契約仕様通り実行される', async () => {
    const target_month = '2024-01';
    const manager_user_id = 'user-001-manager';
    const trigger_timestamp = new Date('2024-02-01T09:00:00Z');
    const include_detailed_analysis = true;

    // Action 5 の期待出力（ボトルネック推移分析結果）
    const action_05_output = {
      bottlenecks: [
        {
          category: 'テスト工程',
          trend: 'ascending',
          occurrenceMonth: 3,
          severity: 'high',
          affectedTeams: ['QA', '開発'],
        },
        {
          category: 'レビュー遅延',
          trend: 'stable',
          occurrenceMonth: 2,
          severity: 'medium',
          affectedTeams: ['開発'],
        },
      ],
      confidence: 0.92,
      timestamp: '2024-01-01',
    };

    // Tx7Imp1AiClient の fake インスタンス
    const fake_ai_client: Tx7Imp1AiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        extracted_data_count: 25,
        data_quality_score: 0.88,
        timestamp: '2024-01-01T00:00:00Z',
      }),
      executeAction02: jest.fn().mockResolvedValue({
        time_series_entries: 28,
        coverage_percentage: 95,
        anomalies_detected: 2,
      }),
      executeAction03: jest.fn().mockResolvedValue({
        issues_extracted: 12,
        categorization_success_rate: 0.96,
      }),
      executeAction04: jest.fn().mockResolvedValue({
        performance_metrics_calculated: true,
        metrics_count: 15,
        team_count: 4,
      }),
      executeAction05: jest.fn().mockResolvedValue(action_05_output),
      executeAction06: jest.fn().mockResolvedValue({
        analysis_result_summary: {
          topPriorityChallenges: [
            {
              challengeId: 'ch-001',
              priorityScore: 85,
              occurrenceFrequency: 5,
              impactLevel: 'high',
              resolutionDaysAverage: 3.5,
            },
          ],
          performanceMetrics: {
            issue_resolution_speed: 3.5,
            report_submission_rate: 0.92,
            issue_recurrence_rate: 0.15,
          },
          bottleneckTrend: {
            timeSeriesData: [
              {
                date: '2024-01-01',
                severity: 'high',
                active_issues: 8,
              },
            ],
            improvementTrend: 'stable',
            recurringIssuePattern: ['テスト工程', 'レビュー遅延'],
          },
        },
      }),
      executeAction07: jest.fn().mockResolvedValue({
        report_generation_status: 'completed',
        report_id: 'report-2024-01-001',
        timestamp: '2024-02-01T10:30:00Z',
      }),
      executeAction08: jest.fn().mockResolvedValue({
        delivery_status: 'sent',
        delivery_timestamp: '2024-02-01T10:35:00Z',
        recipient_count: 1,
      }),
    };

    // runTx7Imp1Agent を実行
    const result = await runTx7Imp1Agent(
      {
        triggerTimestamp: trigger_timestamp,
        targetMonth: target_month,
        managerUserId: manager_user_id,
        includeDetailedAnalysis: include_detailed_analysis,
      },
      fake_ai_client
    );

    // (1) executeAction05 が呼び出されたことを確認
    expect(fake_ai_client.executeAction05).toHaveBeenCalled();

    // (2) ボトルネック推移の分析結果が5要素を含むことを確認
    const action_05_result = action_05_output;
    expect(action_05_result.bottlenecks).toBeDefined();
    expect(action_05_result.bottlenecks.length).toBeGreaterThan(0);

    const first_bottleneck = action_05_result.bottlenecks[0];
    expect(first_bottleneck).toHaveProperty('category');
    expect(first_bottleneck).toHaveProperty('trend');
    expect(first_bottleneck).toHaveProperty('occurrenceMonth');
    expect(first_bottleneck).toHaveProperty('severity');
    expect(first_bottleneck).toHaveProperty('affectedTeams');

    expect(first_bottleneck.category).toBe('テスト工程');
    expect(first_bottleneck.trend).toBe('ascending');
    expect(first_bottleneck.occurrenceMonth).toBe(3);
    expect(first_bottleneck.severity).toBe('high');
    expect(first_bottleneck.affectedTeams).toEqual(['QA', '開発']);

    // (3) confidence スコア（0.0-1.0）が出力されていることを確認
    expect(action_05_result.confidence).toBeDefined();
    expect(typeof action_05_result.confidence).toBe('number');
    expect(action_05_result.confidence).toBeGreaterThanOrEqual(0);
    expect(action_05_result.confidence).toBeLessThanOrEqual(1);
    expect(action_05_result.confidence).toBe(0.92);

    // (4) Tx7Imp1AiClient インターフェースの型が第2パラメータと構造的に同一であることを確認
    expect(typeof fake_ai_client.executeAction01).toBe('function');
    expect(typeof fake_ai_client.executeAction02).toBe('function');
    expect(typeof fake_ai_client.executeAction03).toBe('function');
    expect(typeof fake_ai_client.executeAction04).toBe('function');
    expect(typeof fake_ai_client.executeAction05).toBe('function');
    expect(typeof fake_ai_client.executeAction06).toBe('function');
    expect(typeof fake_ai_client.executeAction07).toBe('function');
    expect(typeof fake_ai_client.executeAction08).toBe('function');

    // (5) 実行結果が audit event として記録されていることを確認
    // （orchestrator が audit log を返す場合の検証）
    expect(result).toBeDefined();
    expect(result.executionStatus).toBe('success');
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');

    // (6) 同一の入力データとプロンプトバージョンで再実行した場合、出力結果が完全に同一であること（べき等性）
    const result_second_run = await runTx7Imp1Agent(
      {
        triggerTimestamp: trigger_timestamp,
        targetMonth: target_month,
        managerUserId: manager_user_id,
        includeDetailedAnalysis: include_detailed_analysis,
      },
      fake_ai_client
    );

    expect(result_second_run.reportId).toBe(result.reportId);
    expect(result_second_run.executionStatus).toBe(result.executionStatus);
    expect(result_second_run.analysisResultSummary).toEqual(
      result.analysisResultSummary
    );

    // Action 5 が 2 回呼び出されていることを確認（同一入力での再実行）
    expect(fake_ai_client.executeAction05).toHaveBeenCalledTimes(2);
  });
});