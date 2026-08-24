import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';

// Mock types for Tx9Imp1AiClient
interface Tx9Imp1AiClient {
  executeAction01: jest.Mock;
  executeAction02: jest.Mock;
  executeAction03: jest.Mock;
  executeAction04: jest.Mock;
  executeAction05: jest.Mock;
  executeAction06: jest.Mock;
  executeAction07: jest.Mock;
}

// Mock types for notification and text analysis adapters
interface NotificationServiceAdapter {
  sendReminderNotification: jest.Mock;
}

interface TextAnalysisServiceAdapter {
  classifyIssueSeverity: jest.Mock;
}

// Mock audit log
interface AuditLogRecord {
  audit_id: string;
  timestamp: string;
  operation_user_id: string;
  source_system: string;
  event_type: string;
  agent_id?: string;
  action_name?: string;
  input_params?: Record<string, unknown>;
  status?: string;
  notification_sent_count?: number;
  all_delivery_status?: Record<string, string>;
  calculated_metrics?: Record<string, unknown>;
  severity_classification_results?: Record<string, unknown>;
  detected_recurrence_patterns?: Record<string, unknown>;
  proposed_measures?: Record<string, unknown>;
  report_generated?: boolean;
  presented_to_manager?: boolean;
  final_status?: string;
  summary_metrics?: Record<string, unknown>;
}

describe('tx-9-imp-1 agent orchestrator', () => {
  let auditLog: AuditLogRecord[];
  let mockAiClient: Tx9Imp1AiClient;
  let mockNotificationAdapter: NotificationServiceAdapter;
  let mockTextAnalysisAdapter: TextAnalysisServiceAdapter;

  beforeEach(() => {
    auditLog = [];

    mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: expect.any(String),
        status: 'delivered',
        timestamp: new Date().toISOString(),
      }),
    };

    mockTextAnalysisAdapter = {
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'HIGH',
        confidence: 0.95,
        classification: 'blocking',
      }),
    };

    mockAiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        aggregated_reports: [
          {
            member_id: 'member-001',
            date: '2026-01-20',
            yesterday_accomplishment: 'Task A completed',
            today_plan: 'Task B planned',
            issues: 'Database connection slow',
          },
          {
            member_id: 'member-002',
            date: '2026-01-20',
            yesterday_accomplishment: 'Task C completed',
            today_plan: 'Task D planned',
            issues: 'Database connection slow',
          },
          {
            member_id: 'member-003',
            date: '2026-01-20',
            yesterday_accomplishment: 'Task E completed',
            today_plan: 'Task F planned',
            issues: 'Memory leak detected',
          },
          {
            member_id: 'member-004',
            date: '2026-01-20',
            yesterday_accomplishment: 'Task G completed',
            today_plan: 'Task H planned',
            issues: 'API timeout issue',
          },
          {
            member_id: 'member-005',
            date: '2026-01-20',
            yesterday_accomplishment: 'Task I completed',
            today_plan: 'Task J planned',
            issues: 'Database connection slow',
          },
        ],
        total_submitted: 5,
        period_start: '2026-01-20',
        period_end: '2026-01-24',
      }),
      executeAction02: jest.fn().mockResolvedValue({
        unsubmitted_members: [
          { member_id: 'member-006', name: 'Engineer F' },
          { member_id: 'member-007', name: 'Engineer G' },
          { member_id: 'member-008', name: 'Engineer H' },
          { member_id: 'member-009', name: 'Engineer I' },
          { member_id: 'member-010', name: 'Engineer J' },
        ],
        reminders_sent: 5,
        delivery_statuses: {
          'member-006': 'delivered',
          'member-007': 'delivered',
          'member-008': 'delivered',
          'member-009': 'delivered',
          'member-010': 'failed',
        },
      }),
      executeAction03: jest.fn().mockResolvedValue({
        issue_count: 12,
        average_resolution_days: 2.5,
        completion_rate: 85,
        issue_frequency_per_day: 2.4,
      }),
      executeAction04: jest.fn().mockResolvedValue({
        classifications: [
          {
            issue_id: 'issue-001',
            issue_text: 'Database connection slow',
            severity: 'HIGH',
            category: 'performance',
            frequency: 3,
          },
          {
            issue_id: 'issue-002',
            issue_text: 'Memory leak detected',
            severity: 'HIGH',
            category: 'stability',
            frequency: 1,
          },
          {
            issue_id: 'issue-003',
            issue_text: 'API timeout issue',
            severity: 'MEDIUM',
            category: 'performance',
            frequency: 1,
          },
        ],
      }),
      executeAction05: jest.fn().mockResolvedValue({
        recurrence_patterns: [
          {
            pattern_id: 'pattern-001',
            issue_keyword: 'Database connection slow',
            occurrences: 3,
            first_occurrence: '2026-01-15',
            last_occurrence: '2026-01-20',
            pattern_name: 'db_connection_recurrence',
          },
        ],
      }),
      executeAction06: jest.fn().mockResolvedValue({
        proposed_measures: [
          {
            measure_id: 'measure-001',
            target_issue: 'Database connection slow',
            measure_description: 'Implement connection pooling',
            priority: 'HIGH',
            estimated_effort_days: 3,
            rationale: 'Occurs 3 times in 5 days, blocks development',
          },
        ],
      }),
      executeAction07: jest.fn().mockResolvedValue({
        report_id: 'report-20260120-001',
        report_generated_at: '2026-01-20T10:30:00Z',
        report_content: {
          aggregation_period: {
            start_date: '2026-01-20',
            end_date: '2026-01-24',
          },
          productivity_metrics: {
            issue_frequency_per_day: 2.4,
            average_resolution_days: 2.5,
            completion_rate: 85,
          },
          prioritized_issues: [
            {
              rank: 1,
              issue: 'Database connection slow',
              severity: 'HIGH',
              frequency: 3,
              priority_score: 95,
            },
          ],
          recommended_countermeasures: [
            {
              rank: 1,
              measure: 'Implement connection pooling',
              priority: 'HIGH',
              estimated_effort_days: 3,
            },
          ],
        },
        presented_to_manager: true,
        manager_notification_sent_at: '2026-01-20T10:31:00Z',
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-3231
  test('should execute agent with complete audit trail for all actions from start to completion', async () => {
    const mockRecordAudit = jest.fn((record: AuditLogRecord) => {
      auditLog.push(record);
    });

    const aggregationStartDate = '2026-01-20';
    const aggregationEndDate = '2026-01-24';
    const targetTeamIds = ['team-001'];
    const requestedByUserId = 'manager-001';

    const agentInput = {
      aggregationPeriodStart: new Date('2026-01-20T00:00:00Z'),
      aggregationPeriodEnd: new Date('2026-01-24T23:59:59Z'),
      targetTeamIds: targetTeamIds,
      managerUserId: requestedByUserId,
    };

    // Execute agent
    const result = await runTx9Imp1Agent(agentInput, mockAiClient, {
      recordAudit: mockRecordAudit,
      notificationAdapter: mockNotificationAdapter,
      textAnalysisAdapter: mockTextAnalysisAdapter,
    });

    // Verify audit log has records
    expect(auditLog.length).toBeGreaterThanOrEqual(9);
    expect(auditLog.length).toBeLessThanOrEqual(12);

    // Extract events by type
    const agentStartEvents = auditLog.filter(
      (log) => log.event_type === 'AGENT_START'
    );
    const agentCompleteEvents = auditLog.filter(
      (log) => log.event_type === 'AGENT_COMPLETE'
    );
    const action01Events = auditLog.filter(
      (log) => log.action_name === 'ACTION_01'
    );
    const action02Events = auditLog.filter(
      (log) => log.action_name === 'ACTION_02'
    );
    const action03Events = auditLog.filter(
      (log) => log.action_name === 'ACTION_03'
    );
    const action04Events = auditLog.filter(
      (log) => log.action_name === 'ACTION_04'
    );
    const action05Events = auditLog.filter(
      (log) => log.action_name === 'ACTION_05'
    );
    const action06Events = auditLog.filter(
      (log) => log.action_name === 'ACTION_06'
    );
    const action07Events = auditLog.filter(
      (log) => log.action_name === 'ACTION_07'
    );

    // Verify agent start event
    expect(agentStartEvents.length).toBe(1);
    const agentStart = agentStartEvents[0];
    expect(agentStart.agent_id).toBe('tx-9-imp-1');
    expect(agentStart.operation_user_id).toBe(requestedByUserId);
    expect(agentStart.source_system).toBe('tx-9-imp-1');
    expect(agentStart.timestamp).toBeDefined();

    // Verify action 01 event
    expect(action01Events.length).toBe(1);
    const action01 = action01Events[0];
    expect(action01.action_name).toBe('ACTION_01');
    expect(action01.status).toBe('SUCCESS');
    expect(action01.input_params).toEqual({
      period_start: aggregationStartDate,
      period_end: aggregationEndDate,
      team_ids: targetTeamIds,
    });

    // Verify action 02 event (unsubmitted member detection and notifications)
    expect(action02Events.length).toBe(1);
    const action02 = action02Events[0];
    expect(action02.action_name).toBe('ACTION_02');
    expect(action02.status).toBe('SUCCESS');
    expect(action02.notification_sent_count).toBeLessThanOrEqual(10);
    expect(action02.all_delivery_status).toBeDefined();
    expect(typeof action02.all_delivery_status).toBe('object');

    // Verify action 03 event (productivity metrics quantification)
    expect(action03Events.length).toBe(1);
    const action03 = action03Events[0];
    expect(action03.action_name).toBe('ACTION_03');
    expect(action03.status).toBe('SUCCESS');
    expect(action03.calculated_metrics).toBeDefined();
    expect(action03.calculated_metrics?.issue_count).toBe(12);
    expect(action03.calculated_metrics?.average_resolution_days).toBe(2.5);
    expect(action03.calculated_metrics?.completion_rate).toBe(85);

    // Verify action 04 event (issue classification by severity)
    expect(action04Events.length).toBe(1);
    const action04 = action04Events[0];
    expect(action04.action_name).toBe('ACTION_04');
    expect(action04.status).toBe('SUCCESS');
    expect(action04.severity_classification_results).toBeDefined();
    expect(Array.isArray(action04.severity_classification_results)).toBe(true);

    // Verify action 05 event (recurrence pattern detection)
    expect(action05Events.length).toBe(1);
    const action05 = action05Events[0];
    expect(action05.action_name).toBe('ACTION_05');
    expect(action05.status).toBe('SUCCESS');
    expect(action05.detected_recurrence_patterns).toBeDefined();
    expect(Array.isArray(action05.detected_recurrence_patterns)).toBe(true);

    // Verify action 06 event (countermeasure proposal)
    expect(action06Events.length).toBe(1);
    const action06 = action06Events[0];
    expect(action06.action_name).toBe('ACTION_06');
    expect(action06.status).toBe('SUCCESS');
    expect(action06.proposed_measures).toBeDefined();

    // Verify action 07 event (report generation and manager presentation)
    expect(action07Events.length).toBe(1);
    const action07 = action07Events[0];
    expect(action07.action_name).toBe('ACTION_07');
    expect(action07.status).toBe('SUCCESS');
    expect(action07.report_generated).toBe(true);
    expect(action07.presented_to_manager).toBe(true);

    // Verify agent complete event
    expect(agentCompleteEvents.length).toBe(1);
    const agentComplete = agentCompleteEvents[0];
    expect(agentComplete.agent_id).toBe('tx-9-imp-1');
    expect(agentComplete.event_type).toBe('AGENT_COMPLETE');
    expect(agentComplete.final_status).toBe('SUCCESS');
    expect(agentComplete.summary_metrics).toBeDefined();

    // Verify all records have required fields
    auditLog.forEach((record) => {
      expect(record.audit_id).toBeDefined();
      expect(record.timestamp).toBeDefined();
      expect(record.operation_user_id).toBeDefined();
      expect(record.source_system).toBe('tx-9-imp-1');
    });

    // Verify chronological order: start -> actions -> complete
    const eventTimestamps = auditLog.map((log) => new Date(log.timestamp).getTime());
    for (let i = 1; i < eventTimestamps.length; i++) {
      expect(eventTimestamps[i]).toBeGreaterThanOrEqual(eventTimestamps[i - 1]);
    }

    // Verify start is first, complete is last
    expect(auditLog[0].event_type).toBe('AGENT_START');
    expect(auditLog[auditLog.length - 1].event_type).toBe('AGENT_COMPLETE');

    // Verify result structure
    expect(result).toBeDefined();
    expect(result.analysisReportId).toBeDefined();
    expect(result.productivityMetrics).toBeDefined();
    expect(result.prioritizedIssues).toBeDefined();
    expect(result.reportDeliveryStatus).toBe('delivered');
  });
});