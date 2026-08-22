import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import type { Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

// Mock audit log sink
interface AuditLogEntry {
  event_type: string;
  agent_id: string;
  contract_id: string;
  timestamp: string;
  user_context: {
    user_id: string;
    role: string;
  };
  action?: string;
  count?: number;
  extracted_count?: number;
  category_count?: number;
  next_action?: string;
  score_distribution?: {
    high: number;
    medium: number;
    low: number;
  };
  report_id?: string;
  page_count?: number;
  generated_at?: string;
  delivered_to?: string[];
  delivery_timestamp?: string;
  total_duration_ms?: number;
  final_status?: string;
}

const mockAuditLogs: AuditLogEntry[] = [];

const mockAiClient: Tx6Imp1AiClient = {
  executeAction01CollectReports: jest.fn(async () => ({
    reports_collected: 12,
    reports_data: [
      {
        report_id: 'rpt001',
        member_id: 'mbr001',
        date: '2024-01-08',
        content: 'Fixed database issue, deployed to staging',
        issues: ['database_lag', 'query_timeout'],
      },
      {
        report_id: 'rpt002',
        member_id: 'mbr002',
        date: '2024-01-08',
        content: 'Completed API documentation, reviewed PR',
        issues: ['documentation_incomplete'],
      },
    ],
  })),
  executeAction02RemindMembers: jest.fn(async () => ({
    reminded_count: 3,
    reminder_recipients: ['mbr003', 'mbr004', 'mbr005'],
  })),
  executeAction03ExtractClassify: jest.fn(async () => ({
    extracted_issues: 8,
    category_distribution: {
      performance: 3,
      quality: 2,
      documentation: 2,
      other: 1,
    },
  })),
  executeAction04TrendAnalysis: jest.fn(async () => ({
    trend_detected: true,
    analysis_result: {
      recurrence_pattern: 'performance_issues_increasing',
      week_over_week_change: 15,
    },
  })),
  executeAction05PriorityScoringExecute: jest.fn(async () => ({
    high_priority: 3,
    medium_priority: 4,
    low_priority: 1,
  })),
  executeAction06ReportGeneration: jest.fn(async () => ({
    report_id: 'rpt_2024_w02_001',
    page_count: 12,
    generated_at: '2024-01-15T09:30:00Z',
  })),
  executeAction07ReportDistribution: jest.fn(async () => ({
    delivered_to: ['manager_001', 'stakeholder_001', 'stakeholder_002'],
    delivery_timestamp: '2024-01-15T09:31:00Z',
  })),
};

const mockAuditLogSink = {
  log: (entry: AuditLogEntry) => {
    mockAuditLogs.push(entry);
  },
};

describe('Tx6Imp1Agent - 日報収集から分析レポート生成までの自動実行 監査ログ検証', () => {
  beforeEach(() => {
    mockAuditLogs.length = 0;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // SCEN-122
  test('should record complete audit trail for report collection, analysis, and generation workflow with all required fields and chronological ordering', async () => {
    const agent_id = 'agent_tx6_20240115_001';
    const contract_id = 'tx_6_imp_1';
    const execution_timestamp = new Date('2024-01-15T09:00:00Z');
    const analysis_start_date = '2024-01-08';
    const analysis_end_date = '2024-01-14';
    const team_id = 'team_engineering_001';

    const input = {
      executionTimestamp: execution_timestamp,
      analysisStartDate: analysis_start_date,
      analysisEndDate: analysis_end_date,
      teamId: team_id,
    };

    // Inject mock audit sink into agent via global or dependency injection
    (global as any).__auditLogSink = mockAuditLogSink;
    (global as any).__agentId = agent_id;
    (global as any).__contractId = contract_id;

    // Execute the agent
    const result = await runTx6Imp1Agent(input, mockAiClient);

    // Verify output structure
    expect(result).toBeDefined();
    expect(result.reportId).toBe('rpt_2024_w02_001');
    expect(result.reportGeneratedAt).toEqual(new Date('2024-01-15T09:30:00Z'));
    expect(result.emailSentAt).toEqual(new Date('2024-01-15T09:31:00Z'));
    expect(result.extractedIssueCount).toBe(8);
    expect(result.topPriorityIssues).toBeDefined();
    expect(Array.isArray(result.topPriorityIssues)).toBe(true);

    // Verify total audit logs recorded
    expect(mockAuditLogs.length).toBeGreaterThanOrEqual(9);

    // Verify event sequence: AGENT_STARTED
    const agentStartedLog = mockAuditLogs.find(
      (log) => log.event_type === 'AGENT_STARTED'
    );
    expect(agentStartedLog).toBeDefined();
    expect(agentStartedLog!.agent_id).toBe(agent_id);
    expect(agentStartedLog!.contract_id).toBe(contract_id);
    expect(agentStartedLog!.user_context).toBeDefined();
    expect(agentStartedLog!.user_context.user_id).toBeDefined();
    expect(agentStartedLog!.user_context.role).toBeDefined();

    // Verify ISO8601 timestamp format for AGENT_STARTED
    const agentStartedTimestamp = new Date(agentStartedLog!.timestamp);
    expect(agentStartedTimestamp.getTime()).toBeGreaterThan(0);
    expect(agentStartedLog!.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // Verify Action 1: collect_reports started and completed
    const action1StartedLog = mockAuditLogs.find(
      (log) =>
        log.event_type === 'ACTION_STARTED' && log.action === 'collect_reports'
    );
    expect(action1StartedLog).toBeDefined();
    expect(action1StartedLog!.agent_id).toBe(agent_id);
    expect(action1StartedLog!.contract_id).toBe(contract_id);
    expect(action1StartedLog!.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(action1StartedLog!.user_context).toBeDefined();

    const action1CompletedLog = mockAuditLogs.find(
      (log) =>
        log.event_type === 'ACTION_COMPLETED' &&
        log.action === 'collect_reports'
    );
    expect(action1CompletedLog).toBeDefined();
    expect(action1CompletedLog!.count).toBe(12);
    expect(action1CompletedLog!.contract_id).toBe(contract_id);
    expect(action1CompletedLog!.user_context).toBeDefined();

    // Verify Action 2: remind_members completed
    const action2CompletedLog = mockAuditLogs.find(
      (log) =>
        log.event_type === 'ACTION_COMPLETED' &&
        log.action === 'remind_members'
    );
    expect(action2CompletedLog).toBeDefined();
    expect(action2CompletedLog!.count).toBe(3);
    expect(action2CompletedLog!.contract_id).toBe(contract_id);
    expect(action2CompletedLog!.user_context).toBeDefined();

    // Verify Action 3: extract_classify started and completed
    const action3StartedLog = mockAuditLogs.find(
      (log) =>
        log.event_type === 'ACTION_STARTED' &&
        log.action === 'extract_classify'
    );
    expect(action3StartedLog).toBeDefined();
    expect(action3StartedLog!.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    const action3CompletedLog = mockAuditLogs.find(
      (log) =>
        log.event_type === 'ACTION_COMPLETED' &&
        log.action === 'extract_classify'
    );
    expect(action3CompletedLog).toBeDefined();
    expect(action3CompletedLog!.extracted_count).toBe(8);
    expect(action3CompletedLog!.category_count).toBe(4);
    expect(action3CompletedLog!.contract_id).toBe(contract_id);

    // Verify Action 4: trend_analysis started, completed, and handed off to scoring
    const action4StartedLog = mockAuditLogs.find(
      (log) =>
        log.event_type === 'ACTION_STARTED' &&
        log.action === 'trend_analysis'
    );
    expect(action4StartedLog).toBeDefined();

    const action4CompletedLog = mockAuditLogs.find(
      (log) =>
        log.event_type === 'ACTION_COMPLETED' &&
        log.action === 'trend_analysis'
    );
    expect(action4CompletedLog).toBeDefined();

    const action4HandoffLog = mockAuditLogs.find(
      (log) =>
        log.event_type === 'ACTION_HANDOFF' &&
        log.action === 'trend_analysis'
    );
    expect(action4HandoffLog).toBeDefined();
    expect(action4HandoffLog!.next_action).toBe('priority_scoring');
    expect(action4HandoffLog!.contract_id).toBe(contract_id);
    expect(action4HandoffLog!.user_context).toBeDefined();

    // Verify Action 5: priority_scoring completed
    const action5CompletedLog = mockAuditLogs.find(
      (log) =>
        log.event_type === 'ACTION_COMPLETED' &&
        log.action === 'priority_scoring'
    );
    expect(action5CompletedLog).toBeDefined();
    expect(action5CompletedLog!.score_distribution).toBeDefined();
    expect(action5CompletedLog!.score_distribution!.high).toBe(3);
    expect(action5CompletedLog!.score_distribution!.medium).toBe(4);
    expect(action5CompletedLog!.score_distribution!.low).toBe(1);
    expect(action5CompletedLog!.contract_id).toBe(contract_id);

    // Verify Action 6: report_generation started and completed
    const action6StartedLog = mockAuditLogs.find(
      (log) =>
        log.event_type === 'ACTION_STARTED' &&
        log.action === 'report_generation'
    );
    expect(action6StartedLog).toBeDefined();

    const action6CompletedLog = mockAuditLogs.find(
      (log) =>
        log.event_type === 'ACTION_COMPLETED' &&
        log.action === 'report_generation'
    );
    expect(action6CompletedLog).toBeDefined();
    expect(action6CompletedLog!.report_id).toBe('rpt_2024_w02_001');
    expect(action6CompletedLog!.page_count).toBe(12);
    expect(action6CompletedLog!.generated_at).toBe('2024-01-15T09:30:00Z');
    expect(action6CompletedLog!.contract_id).toBe(contract_id);
    expect(action6CompletedLog!.user_context).toBeDefined();

    // Verify Action 7: report_distribution completed
    const action7CompletedLog = mockAuditLogs.find(
      (log) =>
        log.event_type === 'ACTION_COMPLETED' &&
        log.action === 'report_distribution'
    );
    expect(action7CompletedLog).toBeDefined();
    expect(action7CompletedLog!.delivered_to).toEqual([
      'manager_001',
      'stakeholder_001',
      'stakeholder_002',
    ]);
    expect(action7CompletedLog!.delivery_timestamp).toBe('2024-01-15T09:31:00Z');
    expect(action7CompletedLog!.contract_id).toBe(contract_id);
    expect(action7CompletedLog!.user_context).toBeDefined();

    // Verify AGENT_COMPLETED event
    const agentCompletedLog = mockAuditLogs.find(
      (log) => log.event_type === 'AGENT_COMPLETED'
    );
    expect(agentCompletedLog).toBeDefined();
    expect(agentCompletedLog!.agent_id).toBe(agent_id);
    expect(agentCompletedLog!.contract_id).toBe(contract_id);
    expect(agentCompletedLog!.final_status).toBe('success');
    expect(agentCompletedLog!.total_duration_ms).toBeGreaterThan(0);
    expect(agentCompletedLog!.user_context).toBeDefined();
    expect(agentCompletedLog!.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // Verify all audit logs have required fields
    mockAuditLogs.forEach((log) => {
      expect(log.event_type).toBeDefined();
      expect(log.agent_id).toBe(agent_id);
      expect(log.contract_id).toBe(contract_id);
      expect(log.timestamp).toBeDefined();
      expect(log.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
      );
      expect(log.user_context).toBeDefined();
      expect(log.user_context.user_id).toBeDefined();
      expect(log.user_context.role).toBeDefined();
    });

    // Verify chronological ordering by timestamp
    for (let i = 0; i < mockAuditLogs.length - 1; i++) {
      const currentTimestamp = new Date(mockAuditLogs[i].timestamp).getTime();
      const nextTimestamp = new Date(mockAuditLogs[i + 1].timestamp).getTime();
      expect(nextTimestamp).toBeGreaterThanOrEqual(currentTimestamp);
    }

    // Verify no duplicate entries
    const eventSignatures = mockAuditLogs.map(
      (log) => `${log.event_type}_${log.action || ''}_${log.timestamp}`
    );
    const uniqueSignatures = new Set(eventSignatures);
    expect(uniqueSignatures.size).toBe(eventSignatures.length);

    // Verify AGENT_STARTED comes before AGENT_COMPLETED
    const agentStartIndex = mockAuditLogs.findIndex(
      (log) => log.event_type === 'AGENT_STARTED'
    );
    const agentCompleteIndex = mockAuditLogs.findIndex(
      (log) => log.event_type === 'AGENT_COMPLETED'
    );
    expect(agentStartIndex).toBeLessThan(agentCompleteIndex);

    // Verify all action sequences are in correct order
    const action1StartIdx = mockAuditLogs.findIndex(
      (log) =>
        log.event_type === 'ACTION_STARTED' &&
        log.action === 'collect_reports'
    );
    const action2CompleteIdx = mockAuditLogs.findIndex(
      (log) =>
        log.event_type === 'ACTION_COMPLETED' &&
        log.action === 'remind_members'
    );
    const action3StartIdx = mockAuditLogs.findIndex(
      (log) =>
        log.event_type === 'ACTION_STARTED' &&
        log.action === 'extract_classify'
    );
    const action7CompleteIdx = mockAuditLogs.findIndex(
      (log) =>
        log.event_type === 'ACTION_COMPLETED' &&
        log.action === 'report_distribution'
    );

    expect(action1StartIdx).toBeLessThan(action2CompleteIdx);
    expect(action2CompleteIdx).toBeLessThan(action3StartIdx);
    expect(action3StartIdx).toBeLessThan(action7CompleteIdx);
  });
});