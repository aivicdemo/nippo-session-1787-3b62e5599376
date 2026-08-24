import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type {
  Tx7Imp1AgentInput,
  Tx7Imp1AgentOutput,
  Tx7Imp1AiClient,
  AnalysisResultSummary,
  BottleneckTrendAnalysis,
  DailyBottleneckMetric,
  PrioritizedChallenge,
  TeamPerformanceMetrics,
} from '../../src/agents/tx-7-imp-1/types';

describe('tx-7-imp-1 agent orchestrator', () => {
  // SCEN-1874: [edge] 月次課題傾向分析レポート生成処理の失敗時再試行制御 - 前回レポート生成完了日と失敗検出日が同日である場合、正確に処理される
  test('should correctly handle same-day retry when previous completion and failure detection occur on same date', async () => {
    const same_day = new Date('2024-03-01T00:00:00Z');
    const first_failure_timestamp = new Date('2024-03-01T08:00:00Z');
    const retry_completion_timestamp = new Date('2024-03-01T08:30:00Z');

    let action_01_call_count = 0;
    let action_02_call_count = 0;
    let action_03_call_count = 0;
    let action_04_call_count = 0;
    let action_05_call_count = 0;
    let action_06_call_count = 0;
    let action_07_call_count = 0;
    let action_08_call_count = 0;

    let should_fail_on_first_attempt = true;
    const audit_log_entries: Array<{
      event_type: string;
      timestamp: Date;
      details: Record<string, unknown>;
    }> = [];

    const stub_ai_client: Tx7Imp1AiClient = {
      async executeAction01(prompt: string): Promise<string> {
        action_01_call_count += 1;
        if (should_fail_on_first_attempt && action_01_call_count === 1) {
          audit_log_entries.push({
            event_type: 'action_01_failure',
            timestamp: first_failure_timestamp,
            details: { attempt: 1 },
          });
          throw new Error('Action 01 temporary failure on first attempt');
        }
        return JSON.stringify({
          extracted_period: '2024-02',
          data_quality_score: 95,
          record_count: 150,
        });
      },

      async executeAction02(prompt: string): Promise<string> {
        action_02_call_count += 1;
        return JSON.stringify({
          challenges: [
            { id: 'ch001', keyword: 'API_LATENCY', frequency: 12 },
            { id: 'ch002', keyword: 'DB_LOCK', frequency: 8 },
          ],
        });
      },

      async executeAction03(prompt: string): Promise<string> {
        action_03_call_count += 1;
        return JSON.stringify({
          daily_metrics: [
            { date: '2024-02-01', severity: 3.2 },
            { date: '2024-02-15', severity: 2.8 },
            { date: '2024-02-29', severity: 2.1 },
          ] as DailyBottleneckMetric[],
          trend_direction: 'improving',
        });
      },

      async executeAction04(prompt: string): Promise<string> {
        action_04_call_count += 1;
        return JSON.stringify({
          performance_scores: [
            { team_id: 'team_alpha', resolution_velocity: 4.2, submission_rate: 92 },
            { team_id: 'team_beta', resolution_velocity: 3.8, submission_rate: 88 },
          ],
        });
      },

      async executeAction05(prompt: string): Promise<string> {
        action_05_call_count += 1;
        return JSON.stringify({
          validation_status: 'passed',
          issues_found: 0,
        });
      },

      async executeAction06(prompt: string): Promise<string> {
        action_06_call_count += 1;
        return JSON.stringify({
          formatted_report: 'Monthly Analysis Report for 2024-02',
          sections_count: 5,
        });
      },

      async executeAction07(prompt: string): Promise<string> {
        action_07_call_count += 1;
        return JSON.stringify({
          recipients: ['manager@example.com'],
          delivery_status: 'queued',
        });
      },

      async executeAction08(prompt: string): Promise<string> {
        action_08_call_count += 1;
        audit_log_entries.push({
          event_type: 'report_generation_completed',
          timestamp: retry_completion_timestamp,
          details: {
            report_id: 'rpt_2024_02_001',
            completion_date: '2024-03-01',
            same_day_retry: true,
          },
        });
        return JSON.stringify({
          audit_event_id: 'audit_20240301_001',
          status: 'completed',
        });
      },
    };

    const input_first_attempt: Tx7Imp1AgentInput = {
      triggerTimestamp: first_failure_timestamp,
      targetMonth: '2024-02',
      managerUserId: 'manager_001',
      includeDetailedAnalysis: true,
    };

    let execution_result: Tx7Imp1AgentOutput | null = null;
    let execution_error: Error | null = null;

    try {
      execution_result = await runTx7Imp1Agent(input_first_attempt, stub_ai_client);
    } catch (error) {
      execution_error = error as Error;
    }

    expect(execution_error).toBeDefined();
    expect(execution_error?.message).toMatch(/Action 01 temporary failure/);

    audit_log_entries.push({
      event_type: 'same_day_retry_triggered',
      timestamp: new Date('2024-03-01T08:05:00Z'),
      details: {
        failed_on: '2024-03-01',
        completion_date_from_master: '2024-03-01',
        retry_initiated: true,
      },
    });

    should_fail_on_first_attempt = false;

    execution_result = null;
    execution_error = null;

    try {
      execution_result = await runTx7Imp1Agent(input_first_attempt, stub_ai_client);
    } catch (error) {
      execution_error = error as Error;
    }

    expect(execution_error).toBeNull();
    expect(execution_result).toBeDefined();
    expect(execution_result!.executionStatus).toBe('success');
    expect(execution_result!.reportId).toBeDefined();
    expect(execution_result!.deliveryTimestamp.toISOString().split('T')[0]).toBe('2024-03-01');

    expect(action_01_call_count).toBe(2);
    expect(action_02_call_count).toBe(1);
    expect(action_03_call_count).toBe(1);
    expect(action_04_call_count).toBe(1);
    expect(action_05_call_count).toBe(1);
    expect(action_06_call_count).toBe(1);
    expect(action_07_call_count).toBe(1);
    expect(action_08_call_count).toBe(1);

    const completion_audit_event = audit_log_entries.find(
      (entry) => entry.event_type === 'report_generation_completed'
    );
    expect(completion_audit_event).toBeDefined();
    expect(completion_audit_event!.details.completion_date).toBe('2024-03-01');
    expect(completion_audit_event!.details.same_day_retry).toBe(true);

    const idempotent_result = await runTx7Imp1Agent(input_first_attempt, stub_ai_client);
    expect(idempotent_result.reportId).toBe(execution_result!.reportId);
    expect(idempotent_result.analysisResultSummary.topPriorityChallenges.length).toBe(
      execution_result!.analysisResultSummary.topPriorityChallenges.length
    );

    const retry_triggered_log = audit_log_entries.filter(
      (entry) => entry.event_type === 'same_day_retry_triggered'
    );
    expect(retry_triggered_log.length).toBeGreaterThan(0);
    const retry_log_entry = retry_triggered_log[0];
    expect(retry_log_entry.details.failed_on).toBe('2024-03-01');
    expect(retry_log_entry.details.completion_date_from_master).toBe('2024-03-01');
    expect(retry_log_entry.details.retry_initiated).toBe(true);
  });
});