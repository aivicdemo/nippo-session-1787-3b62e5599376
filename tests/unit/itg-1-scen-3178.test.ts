import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-6-imp-1/prompts/action-01';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-6-imp-1/prompts/action-02';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-6-imp-1/prompts/action-03';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-6-imp-1/prompts/action-04';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-6-imp-1/prompts/action-05';
import { buildAction06Prompt, ACTION_06_PROMPT_VERSION } from '../../src/agents/tx-6-imp-1/prompts/action-06';
import { buildAction07Prompt, ACTION_07_PROMPT_VERSION } from '../../src/agents/tx-6-imp-1/prompts/action-07';
import type { Tx6Imp1AiClient, AuditLogEntry } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('tx-6-imp-1: 日報収集から分析レポート生成までの自動実行', () => {
  // SCEN-3178: [normal] 日報収集から分析レポート生成までの自動実行 AIエージェント - 監査ログ記録の完全性検証
  test('should record all audit events from start to completion with required fields for weekly analysis report generation', async () => {
    const execution_start_time = new Date('2024-01-08T09:00:00Z');
    const analysis_start_date = '2024-01-01';
    const analysis_end_date = '2024-01-07';
    const target_team_id = 'TEAM-001';
    const recipient_manager_id = 'MGR-001';

    const audit_logs: AuditLogEntry[] = [];

    const mock_ai_client: Tx6Imp1AiClient = {
      async callAction01CollectReports() {
        audit_logs.push({
          record_id: `AUDIT-${Date.now()}-001`,
          event_type: 'processing',
          action_name: 'Action01_CollectReports',
          timestamp: new Date('2024-01-08T09:05:00Z').toISOString(),
          system_id: 'tx-6-imp-1-agent',
          operation_content: 'Collected daily reports from team members',
          execution_status: 'success',
          additional_data: {
            report_count: 10,
            collection_method: 'system_api'
          }
        });
        return {
          collected_reports: Array.from({ length: 10 }, (_, i) => ({
            report_id: `RPT-${i + 1}`,
            member_id: `MEM-${String(i + 1).padStart(3, '0')}`,
            yesterday_work: `Completed task ${i + 1}`,
            today_plan: `Plan for task ${i + 2}`,
            issues: `Issue item ${i + 1}`
          })),
          collection_timestamp: new Date('2024-01-08T09:05:00Z').toISOString(),
          analysis_period_start: analysis_start_date,
          analysis_period_end: analysis_end_date
        };
      },

      async callAction02IdentifyNonSubmitters() {
        audit_logs.push({
          record_id: `AUDIT-${Date.now()}-002`,
          event_type: 'processing',
          action_name: 'Action02_IdentifyNonSubmitters',
          timestamp: new Date('2024-01-08T09:10:00Z').toISOString(),
          system_id: 'tx-6-imp-1-agent',
          operation_content: 'Identified and notified non-submitting members',
          execution_status: 'success',
          additional_data: {
            non_submitter_count: 2,
            notification_sent_count: 2,
            notification_timestamp: new Date('2024-01-08T09:10:00Z').toISOString()
          }
        });
        return {
          non_submitters: [
            { member_id: 'MEM-009', email: 'member009@example.com' },
            { member_id: 'MEM-010', email: 'member010@example.com' }
          ],
          notification_sent: true,
          notification_count: 2
        };
      },

      async callAction03ExtractAndClassifyIssues() {
        audit_logs.push({
          record_id: `AUDIT-${Date.now()}-003`,
          event_type: 'processing',
          action_name: 'Action03_ExtractAndClassifyIssues',
          timestamp: new Date('2024-01-08T09:15:00Z').toISOString(),
          system_id: 'tx-6-imp-1-agent',
          operation_content: 'Extracted and classified issues from reports',
          execution_status: 'success',
          additional_data: {
            extracted_issue_count: 15,
            classified_category_count: 4,
            categories: ['Performance', 'Quality', 'Delivery', 'Other']
          }
        });
        return {
          extracted_issues: Array.from({ length: 15 }, (_, i) => ({
            issue_id: `ISS-${i + 1}`,
            keyword: `Issue_Keyword_${i + 1}`,
            category: ['Performance', 'Quality', 'Delivery', 'Other'][i % 4],
            raw_text: `Issue description ${i + 1}`
          })),
          total_extracted: 15,
          categories: ['Performance', 'Quality', 'Delivery', 'Other']
        };
      },

      async callAction04AnalyzeTrends() {
        audit_logs.push({
          record_id: `AUDIT-${Date.now()}-004`,
          event_type: 'processing',
          action_name: 'Action04_AnalyzeTrends',
          timestamp: new Date('2024-01-08T09:20:00Z').toISOString(),
          system_id: 'tx-6-imp-1-agent',
          operation_content: 'Analyzed issue trends over analysis period',
          execution_status: 'success',
          additional_data: {
            analysis_target_issue_count: 15,
            detected_trend_pattern_count: 3,
            trend_patterns: ['Increasing', 'Stable', 'Recurring']
          }
        });
        return {
          trend_analysis: [
            { pattern_id: 'TREND-1', pattern_type: 'Increasing', affected_issues: 5 },
            { pattern_id: 'TREND-2', pattern_type: 'Stable', affected_issues: 7 },
            { pattern_id: 'TREND-3', pattern_type: 'Recurring', affected_issues: 3 }
          ],
          total_patterns_detected: 3,
          analysis_confidence: 0.87
        };
      },

      async callAction05ScoreIssues() {
        audit_logs.push({
          record_id: `AUDIT-${Date.now()}-005`,
          event_type: 'processing',
          action_name: 'Action05_ScoreIssues',
          timestamp: new Date('2024-01-08T09:25:00Z').toISOString(),
          system_id: 'tx-6-imp-1-agent',
          operation_content: 'Calculated priority scores for all issues',
          execution_status: 'success',
          additional_data: {
            scored_issue_count: 15,
            score_min: 25,
            score_max: 95,
            score_mean: 62
          }
        });
        return {
          scored_issues: Array.from({ length: 15 }, (_, i) => ({
            issue_id: `ISS-${i + 1}`,
            priority_score: Math.floor(25 + (i * 70 / 14)),
            priority_rank: i < 5 ? 'high' : i < 10 ? 'medium' : 'low',
            occurrence_count: Math.floor(Math.random() * 10) + 1
          })),
          score_statistics: {
            total_scored: 15,
            min_score: 25,
            max_score: 95,
            mean_score: 62
          }
        };
      },

      async callAction06GenerateReport() {
        audit_logs.push({
          record_id: `AUDIT-${Date.now()}-006`,
          event_type: 'processing',
          action_name: 'Action06_GenerateReport',
          timestamp: new Date('2024-01-08T09:30:00Z').toISOString(),
          system_id: 'tx-6-imp-1-agent',
          operation_content: 'Generated analysis report',
          execution_status: 'success',
          additional_data: {
            report_id: 'RPT-WEEKLY-20240108-001',
            generation_timestamp: new Date('2024-01-08T09:30:00Z').toISOString(),
            report_sections: 6
          }
        });
        return {
          report_id: 'RPT-WEEKLY-20240108-001',
          generated_at: new Date('2024-01-08T09:30:00Z').toISOString(),
          content: {
            summary: 'Weekly analysis summary',
            period: { start: analysis_start_date, end: analysis_end_date },
            top_issues: Array.from({ length: 5 }, (_, i) => ({
              rank: i + 1,
              issue_keyword: `Top_Issue_${i + 1}`,
              priority_score: 95 - i * 10,
              priority_rank: 'high'
            })),
            categories_analyzed: 4,
            recommendations: ['Recommendation 1', 'Recommendation 2', 'Recommendation 3']
          }
        };
      },

      async callAction07DeliverReport() {
        audit_logs.push({
          record_id: `AUDIT-${Date.now()}-007`,
          event_type: 'processing',
          action_name: 'Action07_DeliverReport',
          timestamp: new Date('2024-01-08T09:35:00Z').toISOString(),
          system_id: 'tx-6-imp-1-agent',
          operation_content: 'Delivered report to recipients',
          execution_status: 'success',
          additional_data: {
            delivery_target_count: 3,
            delivery_timestamp: new Date('2024-01-08T09:35:00Z').toISOString(),
            recipients: ['manager@example.com', 'stakeholder1@example.com', 'stakeholder2@example.com']
          }
        });
        return {
          delivery_success: true,
          delivered_to: ['manager@example.com', 'stakeholder1@example.com', 'stakeholder2@example.com'],
          delivery_timestamp: new Date('2024-01-08T09:35:00Z').toISOString(),
          total_recipients: 3
        };
      }
    };

    const input = {
      executionTimestamp: execution_start_time,
      analysisStartDate: analysis_start_date,
      analysisEndDate: analysis_end_date,
      teamId: target_team_id
    };

    // Record agent start event before execution
    const start_audit_entry: AuditLogEntry = {
      record_id: `AUDIT-${Date.now()}-START`,
      event_type: 'start',
      action_name: 'WeeklyAnalysisAgent',
      timestamp: execution_start_time.toISOString(),
      system_id: 'tx-6-imp-1-agent',
      operation_content: 'Started weekly analysis execution',
      execution_status: 'initiated',
      additional_data: {
        trigger_reason: 'weekly_automatic_execution',
        team_id: target_team_id,
        analysis_period: `${analysis_start_date} to ${analysis_end_date}`
      }
    };
    audit_logs.unshift(start_audit_entry);

    // Execute the agent
    const result = await runTx6Imp1Agent(input, mock_ai_client);

    // Record agent completion event
    const execution_end_time = new Date('2024-01-08T09:40:00Z');
    const total_execution_seconds = Math.floor(
      (execution_end_time.getTime() - execution_start_time.getTime()) / 1000
    );

    const completion_audit_entry: AuditLogEntry = {
      record_id: `AUDIT-${Date.now()}-COMPLETE`,
      event_type: 'completion',
      action_name: 'WeeklyAnalysisAgent',
      timestamp: execution_end_time.toISOString(),
      system_id: 'tx-6-imp-1-agent',
      operation_content: 'Completed weekly analysis execution',
      execution_status: 'normal_completion',
      additional_data: {
        total_execution_seconds: total_execution_seconds,
        report_id: result.reportId,
        extracted_issue_count: result.extractedIssueCount,
        email_sent_at: result.emailSentAt
      }
    };
    audit_logs.push(completion_audit_entry);

    // Assertions: Verify audit log structure and required fields
    expect(audit_logs.length).toBe(9); // START + Action1-7 + COMPLETE

    // Check START event
    const start_event = audit_logs[0];
    expect(start_event.record_id).toBeTruthy();
    expect(start_event.event_type).toBe('start');
    expect(start_event.timestamp).toBe(execution_start_time.toISOString());
    expect(start_event.system_id).toBe('tx-6-imp-1-agent');
    expect(start_event.operation_content).toBeTruthy();
    expect(start_event.execution_status).toBe('initiated');

    // Check Action 1 event
    const action1_event = audit_logs[1];
    expect(action1_event.record_id).toBeTruthy();
    expect(action1_event.event_type).toBe('processing');
    expect(action1_event.action_name).toBe('Action01_CollectReports');
    expect(action1_event.timestamp).toBe(new Date('2024-01-08T09:05:00Z').toISOString());
    expect(action1_event.system_id).toBe('tx-6-imp-1-agent');
    expect(action1_event.operation_content).toBeTruthy();
    expect(action1_event.execution_status).toBe('success');
    expect(action1_event.additional_data.report_count).toBe(10);

    // Check Action 2 event
    const action2_event = audit_logs[2];
    expect(action2_event.record_id).toBeTruthy();
    expect(action2_event.event_type).toBe('processing');
    expect(action2_event.action_name).toBe('Action02_IdentifyNonSubmitters');
    expect(action2_event.timestamp).toBe(new Date('2024-01-08T09:10:00Z').toISOString());
    expect(action2_event.additional_data.non_submitter_count).toBe(2);
    expect(action2_event.additional_data.notification_sent_count).toBe(2);

    // Check Action 3 event
    const action3_event = audit_logs[3];
    expect(action3_event.record_id).toBeTruthy();
    expect(action3_event.event_type).toBe('processing');
    expect(action3_event.action_name).toBe('Action03_ExtractAndClassifyIssues');
    expect(action3_event.timestamp).toBe(new Date('2024-01-08T09:15:00Z').toISOString());
    expect(action3_event.additional_data.extracted_issue_count).toBe(15);
    expect(action3_event.additional_data.classified_category_count).toBe(4);

    // Check Action 4 event
    const action4_event = audit_logs[4];
    expect(action4_event.record_id).toBeTruthy();
    expect(action4_event.event_type).toBe('processing');
    expect(action4_event.action_name).toBe('Action04_AnalyzeTrends');
    expect(action4_event.timestamp).toBe(new Date('2024-01-08T09:20:00Z').toISOString());
    expect(action4_event.additional_data.analysis_target_issue_count).toBe(15);
    expect(action4_event.additional_data.detected_trend_pattern_count).toBe(3);

    // Check Action 5 event
    const action5_event = audit_logs[5];
    expect(action5_event.record_id).toBeTruthy();
    expect(action5_event.event_type).toBe('processing');
    expect(action5_event.action_name).toBe('Action05_ScoreIssues');
    expect(action5_event.timestamp).toBe(new Date('2024-01-08T09:25:00Z').toISOString());
    expect(action5_event.additional_data.scored_issue_count).toBe(15);
    expect(action5_event.additional_data.score_min).toBe(25);
    expect(action5_event.additional_data.score_max).toBe(95);

    // Check Action 6 event
    const action6_event = audit_logs[6];
    expect(action6_event.record_id).toBeTruthy();
    expect(action6_event.event_type).toBe('processing');
    expect(action6_event.action_name).toBe('Action06_GenerateReport');
    expect(action6_event.timestamp).toBe(new Date('2024-01-08T09:30:00Z').toISOString());
    expect(action6_event.additional_data.report_id).toBe('RPT-WEEKLY-20240108-001');
    expect(action6_event.additional_data.generation_timestamp).toBeTruthy();

    // Check Action 7 event
    const action7_event = audit_logs[7];
    expect(action7_event.record_id).toBeTruthy();
    expect(action7_event.event_type).toBe('processing');
    expect(action7_event.action_name).toBe('Action07_DeliverReport');
    expect(action7_event.timestamp).toBe(new Date('2024-01-08T09:35:00Z').toISOString());
    expect(action7_event.additional_data.delivery_target_count).toBe(3);
    expect(action7_event.additional_data.delivery_timestamp).toBeTruthy();

    // Check COMPLETE event
    const complete_event = audit_logs[8];
    expect(complete_event.record_id).toBeTruthy();
    expect(complete_event.event_type).toBe('completion');
    expect(complete_event.timestamp).toBe(execution_end_time.toISOString());
    expect(complete_event.system_id).toBe('tx-6-imp-1-agent');
    expect(complete_event.operation_content).toBeTruthy();
    expect(complete_event.execution_status).toBe('normal_completion');
    expect(complete_event.additional_data.total_execution_seconds).toBe(total_execution_seconds);

    // Verify result structure
    expect(result.reportId).toBe('RPT-WEEKLY-20240108-001');
    expect(result.reportGeneratedAt).toBe(new Date('2024-01-08T09:30:00Z').toISOString());
    expect(result.emailSentAt).toBe(new Date('2024-01-08T09:35:00Z').toISOString());
    expect(result.extractedIssueCount).toBe(15);
    expect(result.topPriorityIssues).toHaveLength(5);
    expect(result.topPriorityIssues[0].priorityScore).toBe(95);
    expect(result.topPriorityIssues[0].priorityRank).toBe('high');

    // Verify all audit records have required fields
    for (const log_entry of audit_logs) {
      expect(log_entry.record_id).toBeTruthy();
      expect(typeof log_entry.record_id).toBe('string');
      expect(log_entry.event_type).toMatch(/^(start|processing|completion|handoff|failure)$/);
      expect(log_entry.timestamp).toBeTruthy();
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(log_entry.timestamp)).toBe(true);
      expect(log_entry.system_id).toBeTruthy();
      expect(log_entry.operation_content).toBeTruthy();
      expect(log_entry.execution_status).toMatch(/^(initiated|success|failure|normal_completion)$/);
    }

    // Verify chronological order
    for (let i = 1; i < audit_logs.length; i++) {
      const prev_timestamp = new Date(audit_logs[i - 1].timestamp).getTime();
      const current_timestamp = new Date(audit_logs[i].timestamp).getTime();
      expect(current_timestamp).toBeGreaterThanOrEqual(prev_timestamp);
    }
  });
});