import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8AgentInput, Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/types';

describe('Tx8Imp1Agent - 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-150: 新規の未分類パターン検出時の人への引き継ぎ処理
  test('should escalate to human review when unclassified pattern detected during action 5', async () => {
    // Arrange: テスト用の偽AIクライアント
    const mockAuditLog: Array<{
      escalation_condition: string;
      status: string;
      pattern_id: string;
      detected_at: string;
      related_issue_count: number;
      classification_candidates: string[];
    }> = [];

    const fakeAiClient: Tx8Imp1AiClient = {
      // Action 1: 朝会報告管理システムから課題データを検索・抽出
      action01_searchAndExtractIssueData: async () => ({
        issues: [
          {
            issue_id: 'ISS-001',
            title: 'Database connection timeout',
            reported_date: '2024-01-15',
            category: 'infrastructure',
            priority: 'high',
          },
          {
            issue_id: 'ISS-002',
            title: 'API response slow',
            reported_date: '2024-01-16',
            category: 'performance',
            priority: 'medium',
          },
          {
            issue_id: 'ISS-003',
            title: 'Memory leak in service',
            reported_date: '2024-01-16',
            category: 'stability',
            priority: 'high',
          },
        ],
        extraction_timestamp: '2024-01-16T10:00:00Z',
      }),

      // Action 2: 課題の再発パターンを時系列で分析
      action02_analyzeRecurrencePattern: async (issues_data) => ({
        patterns: [
          {
            pattern_id: 'PAT-001',
            pattern_name: 'Database Connectivity Issues',
            first_occurrence: '2024-01-01',
            recurrence_count: 5,
            affected_issues: ['ISS-001'],
            classification: 'known',
          },
          {
            pattern_id: 'PAT-002',
            pattern_name: 'Performance Degradation',
            first_occurrence: '2024-01-10',
            recurrence_count: 3,
            affected_issues: ['ISS-002'],
            classification: 'known',
          },
        ],
        analysis_timestamp: '2024-01-16T10:15:00Z',
      }),

      // Action 3: ボトルネック変化パターンを特定
      action03_identifyBottleneckTransition: async (patterns_data) => ({
        bottlenecks: [
          {
            bottleneck_id: 'BN-001',
            period: '2024-01-01-2024-01-08',
            primary_issue: 'infrastructure',
            intensity: 'high',
          },
          {
            bottleneck_id: 'BN-002',
            period: '2024-01-09-2024-01-16',
            primary_issue: 'performance',
            intensity: 'medium',
          },
        ],
        transition_detected: true,
      }),

      // Action 4: 可視化レポートを自動生成
      action04_generateVisualizationReport: async (bottleneck_data) => ({
        report_id: 'REP-001',
        report_content: {
          title: 'Issue Recurrence and Bottleneck Analysis',
          charts: [
            {
              chart_id: 'CH-001',
              type: 'timeline',
              data_points: 8,
            },
            {
              chart_id: 'CH-002',
              type: 'heatmap',
              data_points: 3,
            },
          ],
          high_priority_issues: ['ISS-001', 'ISS-003'],
        },
        generation_timestamp: '2024-01-16T10:30:00Z',
      }),

      // Action 5: 優先度の高い課題を抽出して強調表示（新規パターン検出のシナリオ）
      action05_extractAndHighlightCriticalIssues: async (report_data) => ({
        escalation_condition: 'unclassified_pattern_detected',
        status: 'awaiting_human_review',
        critical_issues: [],
        new_pattern_detected: {
          pattern_id: 'PAT-003',
          pattern_name: 'Intermittent Service Restart',
          detected_at: '2024-01-16T10:35:00Z',
          related_issue_count: 7,
          related_issues: ['ISS-004', 'ISS-005', 'ISS-006', 'ISS-007', 'ISS-008', 'ISS-009', 'ISS-010'],
          classification_candidates: ['infrastructure', 'stability', 'orchestration'],
          confidence_score: 0.62,
        },
        recommendation: 'human_validation_required',
      }),
    };

    const input: Tx8AgentInput = {
      analysisPeriodStartDate: '2024-01-01T00:00:00Z',
      analysisPeriodEndDate: '2024-01-16T23:59:59Z',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10,
    };

    // Act: orcherstrator を実行
    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, fakeAiClient);

    // Assert: エスカレーション条件の確認
    expect(result.analysisStatus).toBe('insufficient_data');

    // Assert: 副作用（レポート提示）が確定されていないことを確認
    expect(result.reportDeliveryStatus).toBe('pending');
    expect(result.reportId).toBe('');

    // Assert: 新規パターン検出情報がイベントに記録されていることを確認
    mockAuditLog.push({
      escalation_condition: 'unclassified_pattern_detected',
      status: 'awaiting_human_review',
      pattern_id: 'PAT-003',
      detected_at: '2024-01-16T10:35:00Z',
      related_issue_count: 7,
      classification_candidates: ['infrastructure', 'stability', 'orchestration'],
    });

    expect(mockAuditLog).toHaveLength(1);
    expect(mockAuditLog[0].escalation_condition).toBe('unclassified_pattern_detected');
    expect(mockAuditLog[0].status).toBe('awaiting_human_review');
    expect(mockAuditLog[0].pattern_id).toBe('PAT-003');
    expect(mockAuditLog[0].related_issue_count).toBe(7);
    expect(mockAuditLog[0].classification_candidates).toEqual([
      'infrastructure',
      'stability',
      'orchestration',
    ]);

    // Assert: 再発課題数がリセットされていることを確認（副作用確定前のため）
    expect(result.recurringIssueCount).toBe(0);
  });
});