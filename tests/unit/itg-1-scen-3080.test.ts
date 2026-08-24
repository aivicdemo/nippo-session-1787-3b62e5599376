import { runTx1Imp1Agent, type Tx1Imp1AgentInput, type Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';
import { type Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('tx-1-imp-1: 日報集約から課題優先順位付けと未提出通知までの自律実行エージェント', () => {
  // SCEN-3080
  test('action-01実行時に日報システムから全員の提出状況を正確に取得する', async () => {
    const executionTimestamp = new Date('2025-01-15T00:00:00.000Z');
    const reportDeadlineTime = new Date('2025-01-15T09:00:00.000Z');
    const morningMeetingStartTime = new Date('2025-01-15T09:30:00.000Z');
    const targetTeamIds = ['team-001'];
    const managerUserId = 'manager-001';

    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      targetTeamIds,
      managerUserId,
    };

    const submittedUsers = [
      {
        userId: 'user-a',
        userName: 'ユーザーA',
        reportId: 'rep001',
        submittedAt: new Date('2025-01-15T08:30:00.000Z'),
      },
      {
        userId: 'user-b',
        userName: 'ユーザーB',
        reportId: 'rep002',
        submittedAt: new Date('2025-01-15T08:45:00.000Z'),
      },
      {
        userId: 'user-c',
        userName: 'ユーザーC',
        reportId: 'rep003',
        submittedAt: new Date('2025-01-15T08:50:00.000Z'),
      },
      {
        userId: 'user-d',
        userName: 'ユーザーD',
        reportId: 'rep004',
        submittedAt: new Date('2025-01-15T08:55:00.000Z'),
      },
    ];

    const unsubmittedUsers = [
      { userId: 'user-e', userName: 'ユーザーE' },
      { userId: 'user-f', userName: 'ユーザーF' },
      { userId: 'user-g', userName: 'ユーザーG' },
      { userId: 'user-h', userName: 'ユーザーH' },
      { userId: 'user-i', userName: 'ユーザーI' },
      { userId: 'user-j', userName: 'ユーザーJ' },
    ];

    let action01CallCount = 0;
    const auditLogs: string[] = [];

    const fakeAiClient: Tx1Imp1AiClient = {
      invokeAction01: async () => {
        action01CallCount += 1;
        auditLogs.push(
          'action-01: 日報取得成功',
          'action-01: 取得件数:4提出/6未提出',
          'action-01: 実行ユーザー:システムエージェント'
        );
        return {
          submittedCount: submittedUsers.length,
          unsubmittedCount: unsubmittedUsers.length,
          submittedUsers,
          unsubmittedUsers,
          fetchedAt: executionTimestamp,
        };
      },
      invokeAction02: async () => ({
        notificationsSent: true,
        notificationCount: unsubmittedUsers.length,
      }),
      invokeAction03: async () => ({
        extractedIssuesCount: 0,
        issues: [],
      }),
      invokeAction04: async () => ({
        prioritizedIssuesCount: 0,
        prioritizedIssues: [],
      }),
      invokeAction05: async () => ({
        materialGenerated: true,
        materialUrl: 'https://example.com/material',
      }),
      invokeAction06: async () => ({
        notificationSent: true,
        notificationTimestamp: executionTimestamp,
      }),
    };

    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, fakeAiClient);

    expect(output.executionStatus).toBe('success');
    expect(output.reportAggregationSummary.submittedCount).toBe(4);
    expect(output.reportAggregationSummary.totalTeamMembers).toBe(10);
    expect(output.reportAggregationSummary.unsubmittedMembers).toHaveLength(6);

    expect(output.reportAggregationSummary.unsubmittedMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'user-e', userName: 'ユーザーE' }),
        expect.objectContaining({ userId: 'user-f', userName: 'ユーザーF' }),
        expect.objectContaining({ userId: 'user-g', userName: 'ユーザーG' }),
        expect.objectContaining({ userId: 'user-h', userName: 'ユーザーH' }),
        expect.objectContaining({ userId: 'user-i', userName: 'ユーザーI' }),
        expect.objectContaining({ userId: 'user-j', userName: 'ユーザーJ' }),
      ])
    );

    const reportIds = output.reportAggregationSummary.submittedMembers?.map(
      (m) => m.reportId
    ) || [];
    expect(reportIds).toEqual(['rep001', 'rep002', 'rep003', 'rep004']);

    expect(output.reportAggregationSummary.aggregationCompletedAt).toBeDefined();

    expect(action01CallCount).toBe(1);

    expect(auditLogs).toContain('action-01: 日報取得成功');
    expect(auditLogs).toContain('action-01: 取得件数:4提出/6未提出');
    expect(auditLogs).toContain('action-01: 実行ユーザー:システムエージェント');

    expect(output.unsubmittedMembersNotified).toBe(true);
    expect(output.morningMeetingMaterialUrl).toBeDefined();
  });
});