import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type {
  Tx1Imp1AgentInput,
  Tx1Imp1AgentOutput,
  Tx1Imp1AiClient,
} from '../../src/agents/tx-1-imp-1/orchestrator';

describe('tx-1-imp-1: 日報集約から課題優先順位付けと未提出通知までの自律実行エージェント', () => {
  let mockAiClient: jest.Mocked<Tx1Imp1AiClient>;
  let mockEscalationQueue: Array<{
    taskId: string;
    escalationType: string;
    escalationData: unknown;
    detectedAt: Date;
  }>;
  let mockAuditLog: Array<{
    timestamp: Date;
    eventType: string;
    description: string;
  }>;
  let mockDashboardNotifications: Array<{
    userId: string;
    message: string;
    notifiedAt: Date;
  }>;

  beforeEach(() => {
    mockEscalationQueue = [];
    mockAuditLog = [];
    mockDashboardNotifications = [];

    mockAiClient = {
      action01_aggregateReports: jest.fn(),
      action02_notifyUnsubmitted: jest.fn(),
      action03_extractIssues: jest.fn(),
      action04_rankPriority: jest.fn(),
      action05_generateMaterial: jest.fn(),
      action06_notifyCompletion: jest.fn(),
      escalateToHumanReview: jest.fn(),
      recordAuditLog: jest.fn(),
      recordDashboardNotification: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-3088
  test('優先度判定ルールに該当しない新規課題タイプ検出時に副作用確定前に人へ引き継ぎ', async () => {
    const executionTimestamp = new Date('2024-09-18T08:30:00Z');
    const reportDeadlineTime = new Date('2024-09-18T09:00:00Z');
    const morningMeetingStartTime = new Date('2024-09-18T09:30:00Z');
    const aggregationCompletedAt = new Date('2024-09-18T08:31:00Z');

    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      targetTeamIds: ['team-001', 'team-002'],
      managerUserId: 'manager-001',
    };

    const submittedReports = [
      {
        reportId: 'report-001',
        userId: 'user-001',
        submittedAt: new Date('2024-09-18T08:20:00Z'),
        issueContent: 'AI倫理に関する懸念：データプライバシー侵害リスク',
      },
      {
        reportId: 'report-002',
        userId: 'user-002',
        submittedAt: new Date('2024-09-18T08:25:00Z'),
        issueContent: '通常のバグ修正が必要',
      },
    ];

    const unsubmittedMembers = [
      { userId: 'user-003', userName: 'Engineer C', teamId: 'team-001' },
    ];

    const aggregationSummary = {
      totalTeamMembers: 3,
      submittedCount: 2,
      unsubmittedMembers,
      aggregationCompletedAt,
    };

    const extractedIssues = [
      {
        issueId: 'issue-001',
        keyword: 'データプライバシー',
        category: 'AI倫理',
        frequency: 1,
        affectedCount: 1,
      },
      {
        issueId: 'issue-002',
        keyword: 'バグ',
        category: '品質',
        frequency: 1,
        affectedCount: 1,
      },
    ];

    mockAiClient.action01_aggregateReports.mockResolvedValue({
      success: true,
      data: { aggregationSummary, submittedReports },
    });

    mockAiClient.action02_notifyUnsubmitted.mockResolvedValue({
      success: true,
      notificationsSent: 1,
    });

    mockAiClient.action03_extractIssues.mockResolvedValue({
      success: true,
      data: { extractedIssues },
    });

    mockAiClient.action04_rankPriority.mockResolvedValue({
      success: true,
      data: {
        prioritizedIssues: [
          {
            issueId: 'issue-002',
            keyword: 'バグ',
            category: '品質',
            priorityScore: 75,
            priorityRank: '高',
          },
        ],
        unrecognizedIssueTypes: [
          {
            issueId: 'issue-001',
            keyword: 'データプライバシー',
            category: 'AI倫理',
            reason: 'RULE_MISMATCH_DETECTED',
            confidence: 0.95,
          },
        ],
      },
    });

    mockAiClient.escalateToHumanReview.mockImplementation(
      async (escalationData) => {
        mockEscalationQueue.push({
          taskId: `escalation-${Date.now()}`,
          escalationType: escalationData.escalationType,
          escalationData,
          detectedAt: new Date('2024-09-18T08:32:00Z'),
        });
        return { escalationId: `escalation-${Date.now()}` };
      }
    );

    mockAiClient.recordAuditLog.mockImplementation(async (logEntry) => {
      mockAuditLog.push({
        timestamp: new Date('2024-09-18T08:32:00Z'),
        eventType: logEntry.eventType,
        description: logEntry.description,
      });
    });

    mockAiClient.recordDashboardNotification.mockImplementation(
      async (notification) => {
        mockDashboardNotifications.push({
          userId: notification.userId,
          message: notification.message,
          notifiedAt: new Date('2024-09-18T08:32:00Z'),
        });
      }
    );

    mockAiClient.action05_generateMaterial.mockRejectedValue(
      new Error('ESCALATION_IN_PROGRESS')
    );

    mockAiClient.action06_notifyCompletion.mockResolvedValue({
      success: false,
      reason: 'ESCALATION_PREVENTS_COMPLETION',
    });

    let executionStatus: string = 'unknown';
    let thrownError: Error | null = null;

    try {
      const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);
      executionStatus = result.executionStatus;
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    expect(mockAiClient.action01_aggregateReports).toHaveBeenCalledWith(
      expect.objectContaining({
        targetTeamIds: ['team-001', 'team-002'],
      })
    );

    expect(mockAiClient.action02_notifyUnsubmitted).toHaveBeenCalled();

    expect(mockAiClient.action03_extractIssues).toHaveBeenCalled();

    expect(mockAiClient.action04_rankPriority).toHaveBeenCalled();

    expect(mockAiClient.escalateToHumanReview).toHaveBeenCalledWith(
      expect.objectContaining({
        escalationType: 'RULE_MISMATCH_DETECTED',
        unrecognizedIssueType: expect.objectContaining({
          category: 'AI倫理',
        }),
      })
    );

    expect(mockEscalationQueue.length).toBeGreaterThanOrEqual(1);
    const escalation = mockEscalationQueue[0];
    expect(escalation.escalationType).toBe('RULE_MISMATCH_DETECTED');
    expect(escalation.escalationData).toMatchObject(
      expect.objectContaining({
        unrecognizedIssueType: expect.objectContaining({
          keyword: 'データプライバシー',
        }),
      })
    );

    expect(mockAiClient.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'ESCALATION_TRIGGERED',
        description: expect.stringMatching(/RULE_MISMATCH_DETECTED/),
      })
    );

    expect(mockAuditLog.length).toBeGreaterThanOrEqual(1);
    expect(mockAuditLog[0].eventType).toBe('ESCALATION_TRIGGERED');
    expect(mockAuditLog[0].description).toMatch(/escalated_to_human_review/);

    expect(mockAiClient.recordDashboardNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'manager-001',
        message: expect.stringMatching(/判定ルール外の新規課題タイプ/),
      })
    );

    expect(mockDashboardNotifications.length).toBeGreaterThanOrEqual(1);
    expect(mockDashboardNotifications[0].userId).toBe('manager-001');
    expect(mockDashboardNotifications[0].message).toMatch(/判定ルール外/);

    expect(mockAiClient.action05_generateMaterial).not.toHaveBeenCalled();

    expect(mockAiClient.action06_notifyCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        status: expect.stringMatching(/escalation|suspended/i),
      })
    );

    expect(executionStatus).toBe('partial_failure');
  });
});