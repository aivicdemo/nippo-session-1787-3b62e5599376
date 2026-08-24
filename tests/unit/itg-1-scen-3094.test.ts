import { type Tx1Imp1AiClient } from "../../src/agents/tx-1-imp-1/orchestrator";
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput, ReportAggregationSummary, UnsubmittedMember, PrioritizedIssue } from '../../src/agents/tx-1-imp-1/types';

// Mock audit log repository
interface AuditLogRecord {
  eventType: 'STARTED' | 'ACTION_EXECUTED' | 'HANDOVER' | 'COMPLETED' | 'FAILED';
  actionName: string;
  executionId: string;
  agentId: string;
  timestamp: string;
  statusCode?: number;
  notificationCount?: number;
  extractedCount?: number;
  prioritizedCount?: number;
  documentId?: string;
  finalStatus?: string;
  totalActionsExecuted?: number;
  recipientId?: string;
  errorMessage?: string;
}

let auditLogStore: AuditLogRecord[] = [];

const createMockAuditLogger = () => ({
  log: (record: AuditLogRecord) => {
    auditLogStore.push(record);
  },
  getAll: () => auditLogStore,
  clear: () => {
    auditLogStore = [];
  },
});

const createMockAiClient = (): Tx1Imp1AiClient => ({
  action01_getDailyReports: async () => ({
    reports: [
      {
        userId: 'user-001',
        content: 'Fixed login bug and deployed to staging',
        submittedAt: new Date('2026-08-20T08:30:00Z'),
        issues: ['ログイン認証', 'デプロイ手順'],
      },
      {
        userId: 'user-002',
        content: 'Integrated payment API and completed unit tests',
        submittedAt: new Date('2026-08-20T08:45:00Z'),
        issues: ['API統合', '単体テスト'],
      },
      {
        userId: 'user-003',
        content: 'Code review and documentation update',
        submittedAt: new Date('2026-08-20T08:50:00Z'),
        issues: ['コードレビュー品質'],
      },
    ],
    unsubmittedUserIds: ['user-004', 'user-005', 'user-006'],
  }),
  action02_sendNotifications: async () => ({
    sentCount: 3,
    failedCount: 0,
    recipients: ['user-004', 'user-005', 'user-006'],
  }),
  action03_extractKeywords: async () => ({
    keywords: [
      { keyword: 'ログイン認証', frequency: 2, impactScore: 85 },
      { keyword: 'デプロイ手順', frequency: 1, impactScore: 70 },
      { keyword: 'API統合', frequency: 1, impactScore: 75 },
      { keyword: '単体テスト', frequency: 1, impactScore: 60 },
      { keyword: 'コードレビュー品質', frequency: 1, impactScore: 55 },
      { keyword: 'パフォーマンス最適化', frequency: 2, impactScore: 65 },
      { keyword: 'セキュリティ脆弱性', frequency: 1, impactScore: 95 },
      { keyword: 'ドキュメント不足', frequency: 3, impactScore: 50 },
      { keyword: 'リリース延期', frequency: 1, impactScore: 80 },
      { keyword: 'チーム連携', frequency: 2, impactScore: 45 },
      { keyword: 'ビルド失敗', frequency: 1, impactScore: 75 },
      { keyword: 'ユーザーレポート', frequency: 1, impactScore: 70 },
    ],
  }),
  action04_classifySeverity: async () => ({
    classifiedIssues: [
      { keyword: 'セキュリティ脆弱性', severity: 'HIGH', frequency: 1 },
      { keyword: 'ログイン認証', severity: 'HIGH', frequency: 2 },
      { keyword: 'ドキュメント不足', severity: 'MEDIUM', frequency: 3 },
      { keyword: 'API統合', severity: 'MEDIUM', frequency: 1 },
      { keyword: 'デプロイ手順', severity: 'MEDIUM', frequency: 1 },
    ],
  }),
  action05_assignPriorities: async () => ({
    prioritizedIssues: [
      {
        keyword: 'セキュリティ脆弱性',
        priorityScore: 95,
        rank: 1,
        recommendation: '緊急対応が必要',
      },
      {
        keyword: 'ログイン認証',
        priorityScore: 85,
        rank: 2,
        recommendation: '次スプリント優先',
      },
      {
        keyword: 'ドキュメント不足',
        priorityScore: 75,
        rank: 3,
        recommendation: '並行対応可能',
      },
      {
        keyword: 'API統合',
        priorityScore: 70,
        rank: 4,
        recommendation: 'バックログ計画',
      },
      {
        keyword: 'デプロイ手順',
        priorityScore: 68,
        rank: 5,
        recommendation: 'チーム共有',
      },
      {
        keyword: 'パフォーマンス最適化',
        priorityScore: 65,
        rank: 6,
        recommendation: '継続監視',
      },
      {
        keyword: '単体テスト',
        priorityScore: 60,
        rank: 7,
        recommendation: '標準化推進',
      },
      {
        keyword: 'コードレビュー品質',
        priorityScore: 55,
        rank: 8,
        recommendation: 'プロセス改善',
      },
      {
        keyword: 'チーム連携',
        priorityScore: 50,
        rank: 9,
        recommendation: 'コミュニケーション強化',
      },
      {
        keyword: 'ビルド失敗',
        priorityScore: 48,
        rank: 10,
        recommendation: 'CI/CD改善',
      },
      {
        keyword: 'ユーザーレポート',
        priorityScore: 45,
        rank: 11,
        recommendation: 'フィードバック収集',
      },
      {
        keyword: 'リリース延期',
        priorityScore: 42,
        rank: 12,
        recommendation: 'スケジュール再検討',
      },
    ],
  }),
  action06_generateMorningBriefing: async () => ({
    documentId: 'doc-2026-08-20-001',
    documentUrl: 'https://mail.example.com/briefing/doc-2026-08-20-001',
    generatedAt: new Date('2026-08-20T09:15:00Z'),
  }),
});

describe('Tx1Imp1Agent Audit Logging', () => {
  const auditLogger = createMockAuditLogger();
  const aiClient = createMockAiClient();
  const AGENT_ID = 'tx-1-imp-1';
  const MANAGER_ID = 'manager-001';

  beforeEach(() => {
    auditLogger.clear();
  });

  afterEach(() => {
    auditLogger.clear();
  });

  // SCEN-3094
  test('should record all audit events in correct sequence with shared executionId during complete agent execution', async () => {
    const executionTimestamp = new Date('2026-08-20T09:00:00Z');
    const reportDeadlineTime = new Date('2026-08-20T09:00:00Z');
    const morningMeetingStartTime = new Date('2026-08-20T09:30:00Z');

    const agentInput: Tx1Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      targetTeamIds: ['team-001'],
      managerUserId: MANAGER_ID,
    };

    // Mock global state for audit logging
    (global as any).__auditLogger = auditLogger;
    (global as any).__agentId = AGENT_ID;

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(agentInput, aiClient);

    const auditRecords = auditLogger.getAll();

    // Verify minimum 9 audit events recorded
    expect(auditRecords.length).toBeGreaterThanOrEqual(9);

    // Extract executionId from first record
    const firstRecord = auditRecords[0];
    expect(firstRecord).toBeDefined();
    expect(firstRecord.eventType).toBe('STARTED');
    expect(firstRecord.actionName).toBe('GET_DAILY_REPORTS');
    expect(firstRecord.agentId).toBe(AGENT_ID);
    expect(firstRecord.timestamp).toBeDefined();

    const executionId = firstRecord.executionId;

    // Verify STARTED event
    expect(auditRecords[0]).toEqual(
      expect.objectContaining({
        eventType: 'STARTED',
        actionName: 'GET_DAILY_REPORTS',
        executionId,
        agentId: AGENT_ID,
        statusCode: 200,
      })
    );
    expect(auditRecords[0].timestamp).toBeDefined();

    // Verify ACTION_EXECUTED events for each action
    const actionSequence = [
      'GET_DAILY_REPORTS',
      'SEND_NOTIFICATIONS',
      'EXTRACT_KEYWORDS',
      'CLASSIFY_SEVERITY',
      'ASSIGN_PRIORITIES',
      'GENERATE_MORNING_BRIEFING',
    ];

    let actionExecutedIndex = 1;

    // ACTION_EXECUTED: GET_DAILY_REPORTS
    expect(auditRecords[actionExecutedIndex]).toEqual(
      expect.objectContaining({
        eventType: 'ACTION_EXECUTED',
        actionName: 'GET_DAILY_REPORTS',
        executionId,
        agentId: AGENT_ID,
        statusCode: 200,
      })
    );
    actionExecutedIndex += 1;

    // ACTION_EXECUTED: SEND_NOTIFICATIONS
    expect(auditRecords[actionExecutedIndex]).toEqual(
      expect.objectContaining({
        eventType: 'ACTION_EXECUTED',
        actionName: 'SEND_NOTIFICATIONS',
        executionId,
        agentId: AGENT_ID,
        statusCode: 200,
        notificationCount: 3,
      })
    );
    actionExecutedIndex += 1;

    // ACTION_EXECUTED: EXTRACT_KEYWORDS
    expect(auditRecords[actionExecutedIndex]).toEqual(
      expect.objectContaining({
        eventType: 'ACTION_EXECUTED',
        actionName: 'EXTRACT_KEYWORDS',
        executionId,
        agentId: AGENT_ID,
        statusCode: 200,
        extractedCount: 12,
      })
    );
    actionExecutedIndex += 1;

    // ACTION_EXECUTED: CLASSIFY_SEVERITY
    expect(auditRecords[actionExecutedIndex]).toEqual(
      expect.objectContaining({
        eventType: 'ACTION_EXECUTED',
        actionName: 'CLASSIFY_SEVERITY',
        executionId,
        agentId: AGENT_ID,
        statusCode: 200,
      })
    );
    actionExecutedIndex += 1;

    // ACTION_EXECUTED: ASSIGN_PRIORITIES
    expect(auditRecords[actionExecutedIndex]).toEqual(
      expect.objectContaining({
        eventType: 'ACTION_EXECUTED',
        actionName: 'ASSIGN_PRIORITIES',
        executionId,
        agentId: AGENT_ID,
        statusCode: 200,
        prioritizedCount: 12,
      })
    );
    actionExecutedIndex += 1;

    // ACTION_EXECUTED: GENERATE_MORNING_BRIEFING
    expect(auditRecords[actionExecutedIndex]).toEqual(
      expect.objectContaining({
        eventType: 'ACTION_EXECUTED',
        actionName: 'GENERATE_MORNING_BRIEFING',
        executionId,
        agentId: AGENT_ID,
        statusCode: 200,
        documentId: 'doc-2026-08-20-001',
      })
    );
    actionExecutedIndex += 1;

    // ACTION_EXECUTED: NOTIFY_MANAGER (before HANDOVER)
    expect(auditRecords[actionExecutedIndex]).toEqual(
      expect.objectContaining({
        eventType: 'ACTION_EXECUTED',
        actionName: 'NOTIFY_MANAGER',
        executionId,
        agentId: AGENT_ID,
        statusCode: 200,
        recipientId: MANAGER_ID,
        documentId: 'doc-2026-08-20-001',
      })
    );
    actionExecutedIndex += 1;

    // Verify HANDOVER event
    expect(auditRecords[actionExecutedIndex]).toEqual(
      expect.objectContaining({
        eventType: 'HANDOVER',
        actionName: 'NOTIFY_MANAGER',
        executionId,
        agentId: AGENT_ID,
        recipientId: MANAGER_ID,
        documentId: 'doc-2026-08-20-001',
      })
    );
    actionExecutedIndex += 1;

    // Verify COMPLETED event
    expect(auditRecords[actionExecutedIndex]).toEqual(
      expect.objectContaining({
        eventType: 'COMPLETED',
        executionId,
        agentId: AGENT_ID,
        finalStatus: 'SUCCESS',
        totalActionsExecuted: 7,
      })
    );

    // Verify all records share same executionId
    auditRecords.forEach((record) => {
      expect(record.executionId).toBe(executionId);
      expect(record.agentId).toBe(AGENT_ID);
    });

    // Verify timestamps are in ISO8601 format and monotonically increasing
    let previousTimestamp = new Date('1970-01-01T00:00:00Z').getTime();
    auditRecords.forEach((record) => {
      expect(record.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      );
      const currentTimestamp = new Date(record.timestamp).getTime();
      expect(currentTimestamp).toBeGreaterThanOrEqual(previousTimestamp);
      previousTimestamp = currentTimestamp;
    });

    // Verify output structure
    expect(result.executionStatus).toBe('success');
    expect(result.reportAggregationSummary).toBeDefined();
    expect(result.reportAggregationSummary.totalTeamMembers).toBe(6);
    expect(result.reportAggregationSummary.submittedCount).toBe(3);
    expect(result.reportAggregationSummary.unsubmittedMembers).toHaveLength(3);
    expect(result.reportAggregationSummary.unsubmittedMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'user-004' }),
        expect.objectContaining({ userId: 'user-005' }),
        expect.objectContaining({ userId: 'user-006' }),
      ])
    );

    expect(result.prioritizedIssuesList).toHaveLength(12);
    expect(result.prioritizedIssuesList[0]).toEqual(
      expect.objectContaining({
        keyword: 'セキュリティ脆弱性',
        priorityScore: 95,
        rank: 1,
      })
    );
    expect(result.prioritizedIssuesList[1]).toEqual(
      expect.objectContaining({
        keyword: 'ログイン認証',
        priorityScore: 85,
        rank: 2,
      })
    );

    expect(result.morningMeetingMaterialUrl).toBe(
      'https://mail.example.com/briefing/doc-2026-08-20-001'
    );
    expect(result.unsubmittedMembersNotified).toBe(true);
    expect(result.executionTimestamp).toBeDefined();
  });
});