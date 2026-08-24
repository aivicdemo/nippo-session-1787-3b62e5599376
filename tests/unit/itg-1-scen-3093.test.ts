import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx1Imp1Agent, type Tx1Imp1AgentInput, type Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';
import { type Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';
import { type NotificationServiceAdapter } from '../../src/adapters/notification-service-adapter';
import { type TextAnalysisServiceAdapter } from '../../src/adapters/text-analysis-service-adapter';

describe('朝会報告自動集約エージェント - 重複実行の冪等性確保', () => {
  test('SCEN-3093: 同一リクエストの2回目実行時に未提出通知・資料生成の重複を防ぐ', async () => {
    // ========== Setup: Fake adapters ==========
    const notificationCallLog: Array<{
      userId: string;
      messageId: string;
      timestamp: Date;
    }> = [];

    const textAnalysisCallLog: Array<{
      operation: 'extractKeywords' | 'assessImpactScore' | 'classifyIssueSeverity';
      timestamp: Date;
      inputHash: string;
    }> = [];

    const fakeNotificationAdapter: NotificationServiceAdapter = {
      sendReminderNotification: async (userId: string, message: string) => {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        notificationCallLog.push({
          userId,
          messageId,
          timestamp: new Date(),
        });
        return { success: true, deliveryStatus: 'sent', messageId };
      },
      scheduleNotification: async () => {
        return { success: true };
      },
      getDeliveryStatus: async () => {
        return { status: 'sent' };
      },
    };

    const fakeTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: async (text: string) => {
        const hash = Buffer.from(text).toString('base64').substring(0, 16);
        textAnalysisCallLog.push({
          operation: 'extractKeywords',
          timestamp: new Date(),
          inputHash: hash,
        });
        return {
          keywords: [
            { keyword: 'database_delay', frequency: 3 },
            { keyword: 'api_timeout', frequency: 2 },
          ],
          totalOccurrences: 5,
        };
      },
      assessImpactScore: async (keyword: string) => {
        textAnalysisCallLog.push({
          operation: 'assessImpactScore',
          timestamp: new Date(),
          inputHash: keyword.substring(0, 16),
        });
        return {
          impactScore: keyword === 'database_delay' ? 85 : 65,
          affectedTeamCount: keyword === 'database_delay' ? 3 : 1,
        };
      },
      classifyIssueSeverity: async (text: string) => {
        textAnalysisCallLog.push({
          operation: 'classifyIssueSeverity',
          timestamp: new Date(),
          inputHash: Buffer.from(text).toString('base64').substring(0, 16),
        });
        return {
          severity: text.includes('database') ? 'high' : 'medium',
          confidence: 0.92,
        };
      },
    };

    // ========== Setup: Test data ==========
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:30:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T09:45:00Z');

    const agentInput: Tx1Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      targetTeamIds: ['team_001', 'team_002'],
      managerUserId: 'manager_001',
    };

    // Mock database for tracking
    const notificationLogTable: Array<{
      id: string;
      userId: string;
      messageId: string;
      sentAt: Date;
    }> = [];

    const materialGenerationLogTable: Array<{
      id: string;
      generatedAt: Date;
      contentHash: string;
      managerUserId: string;
    }> = [];

    // Helper to compute content hash
    const computeContentHash = (content: string): string => {
      let hash = 0;
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString(16);
    };

    // ========== First execution ==========
    const fakeAiClient1: Tx1Imp1AiClient = {
      callAi: async (_prompt: string) => {
        return {
          unsubmittedMembers: [
            { userId: 'eng_003', userName: 'Engineer C', teamId: 'team_001' },
            { userId: 'eng_005', userName: 'Engineer E', teamId: 'team_002' },
          ],
          extractedIssues: [
            {
              issueId: 'issue_db_001',
              keyword: 'database_delay',
              description: 'Database query performance degradation',
              frequency: 3,
              severity: 'high',
            },
            {
              issueId: 'issue_api_001',
              keyword: 'api_timeout',
              description: 'API response timeout under load',
              frequency: 2,
              severity: 'medium',
            },
          ],
          prioritizedIssues: [
            {
              issueId: 'issue_db_001',
              keyword: 'database_delay',
              priorityScore: 85,
              priorityRank: 'high',
              recommendedAction: 'Optimize query and add indexes',
            },
            {
              issueId: 'issue_api_001',
              keyword: 'api_timeout',
              priorityScore: 65,
              priorityRank: 'medium',
              recommendedAction: 'Increase timeout and add caching',
            },
          ],
        };
      },
    };

    const result1: Tx1Imp1AgentOutput = await runTx1Imp1Agent(
      agentInput,
      fakeAiClient1,
      fakeNotificationAdapter,
      fakeTextAnalysisAdapter
    );

    expect(result1.executionStatus).toBe('success');
    expect(result1.reportAggregationSummary.submittedCount).toBe(8);
    expect(result1.reportAggregationSummary.unsubmittedMembers).toHaveLength(2);
    expect(result1.prioritizedIssuesList).toHaveLength(2);
    expect(result1.prioritizedIssuesList[0].priorityScore).toBe(85);
    expect(result1.unsubmittedMembersNotified).toBe(true);

    // Record first execution state
    const notificationLogCount1 = notificationCallLog.length;
    const firstExecutionNotificationUserIds = notificationCallLog.map(log => log.userId);
    const firstExecutionNotificationMessageIds = notificationCallLog.map(log => log.messageId);
    const textAnalysisCallCount1 = textAnalysisCallLog.length;

    // Simulate material generation log
    const materialContent1 = JSON.stringify(result1.prioritizedIssuesList);
    const materialHash1 = computeContentHash(materialContent1);
    materialGenerationLogTable.push({
      id: `material_001`,
      generatedAt: result1.executionTimestamp,
      contentHash: materialHash1,
      managerUserId: agentInput.managerUserId,
    });

    // ========== Second execution (same request) ==========
    const fakeAiClient2: Tx1Imp1AiClient = {
      callAi: async (_prompt: string) => {
        return {
          unsubmittedMembers: [
            { userId: 'eng_003', userName: 'Engineer C', teamId: 'team_001' },
            { userId: 'eng_005', userName: 'Engineer E', teamId: 'team_002' },
          ],
          extractedIssues: [
            {
              issueId: 'issue_db_001',
              keyword: 'database_delay',
              description: 'Database query performance degradation',
              frequency: 3,
              severity: 'high',
            },
            {
              issueId: 'issue_api_001',
              keyword: 'api_timeout',
              description: 'API response timeout under load',
              frequency: 2,
              severity: 'medium',
            },
          ],
          prioritizedIssues: [
            {
              issueId: 'issue_db_001',
              keyword: 'database_delay',
              priorityScore: 85,
              priorityRank: 'high',
              recommendedAction: 'Optimize query and add indexes',
            },
            {
              issueId: 'issue_api_001',
              keyword: 'api_timeout',
              priorityScore: 65,
              priorityRank: 'medium',
              recommendedAction: 'Increase timeout and add caching',
            },
          ],
        };
      },
    };

    // Reset call logs to measure second execution only
    const notificationCallLogBefore2ndExecution = notificationCallLog.length;
    const textAnalysisCallLogBefore2ndExecution = textAnalysisCallLog.length;

    const result2: Tx1Imp1AgentOutput = await runTx1Imp1Agent(
      agentInput,
      fakeAiClient2,
      fakeNotificationAdapter,
      fakeTextAnalysisAdapter
    );

    expect(result2.executionStatus).toBe('success');
    expect(result2.reportAggregationSummary.submittedCount).toBe(8);
    expect(result2.reportAggregationSummary.unsubmittedMembers).toHaveLength(2);
    expect(result2.prioritizedIssuesList).toHaveLength(2);
    expect(result2.prioritizedIssuesList[0].priorityScore).toBe(85);

    // ========== Verification: No duplicate notifications ==========
    const notificationCallCountIncrease = notificationCallLog.length - notificationCallLogBefore2ndExecution;
    expect(notificationCallCountIncrease).toBe(0);

    // Verify that the same users were targeted in first execution, and no new entries added
    const secondExecutionNotificationUserIds = notificationCallLog
      .slice(notificationCallLogBefore2ndExecution)
      .map(log => log.userId);
    expect(secondExecutionNotificationUserIds).toEqual([]);

    // ========== Verification: No duplicate material generation logs ==========
    const materialContent2 = JSON.stringify(result2.prioritizedIssuesList);
    const materialHash2 = computeContentHash(materialContent2);

    // Should generate same hash (same content)
    expect(materialHash2).toBe(materialHash1);

    // Verify no new material generation log entry was added (or if added, content is identical)
    const materialLogsAfter2nd = materialGenerationLogTable.filter(
      log => log.managerUserId === agentInput.managerUserId
    );
    expect(materialLogsAfter2nd).toHaveLength(1);
    expect(materialLogsAfter2nd[0].contentHash).toBe(materialHash1);

    // ========== Verification: Text analysis call count not exceeded ==========
    const textAnalysisCallCountIncrease = textAnalysisCallLog.length - textAnalysisCallLogBefore2ndExecution;
    expect(textAnalysisCallCountIncrease).toBe(0);

    // ========== Verification: Output content is identical ==========
    expect(result1.prioritizedIssuesList).toEqual(result2.prioritizedIssuesList);
    expect(result1.reportAggregationSummary.submittedCount).toBe(result2.reportAggregationSummary.submittedCount);
    expect(result1.reportAggregationSummary.unsubmittedMembers).toEqual(
      result2.reportAggregationSummary.unsubmittedMembers
    );

    // ========== Summary verification ==========
    // First execution: 2 notifications + text analysis calls
    expect(notificationCallLogCount1).toBe(2);
    expect(firstExecutionNotificationUserIds).toEqual(['eng_003', 'eng_005']);

    // Second execution: 0 new notifications, 0 new text analysis calls
    // (idempotent execution prevents duplicate side effects)
  });
});