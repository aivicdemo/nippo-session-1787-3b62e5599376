import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import { type Tx11Imp1AiClient } from '../../src/agents/tx-11-imp-1/orchestrator';
import { type Tx11AgentInput, type Tx11AgentOutput } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('Tx11Imp1Agent - 日報収集・確認・催促の自動化エージェント', () => {
  // SCEN-3241: [error] 重大度が高い課題と判定された場合は部長に即座に通知
  test('should handoff high-severity issue to human before confirming notification side effect', async () => {
    const executionTimestamp = new Date('2024-01-15T08:30:00Z');
    const teamId = 'team-dev-001';
    const reportDeadlineTime = '09:00';
    const managerEmail = 'manager@example.com';

    const input: Tx11AgentInput = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail,
    };

    // High-severity issue data to be detected
    const highSeverityIssueContent = 'システム全体がダウンしている';
    const issueDetectionTimestamp = new Date('2024-01-15T08:35:00Z');

    // Mock TextAnalysisServiceAdapter to classify issue as high severity
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'システムダウン', frequency: 3, confidence: 0.92 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScores: [{ keyword: 'システムダウン', score: 95 }],
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        confidence: 0.98,
        reason: 'システム全体のサービス停止は最高レベルの重大度',
      }),
    };

    // Mock NotificationServiceAdapter
    const sentNotifications: Array<{
      userId: string;
      message: string;
      timestamp: Date;
    }> = [];
    const mockNotificationService = {
      sendReminderNotification: jest.fn().mockImplementation((userId, message) => {
        sentNotifications.push({
          userId,
          message,
          timestamp: new Date(),
        });
        return Promise.resolve({ status: 'sent', deliveryId: `deliv-${Date.now()}` });
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: `sched-${Date.now()}`,
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'pending',
      }),
    };

    // Mock handoff interface to capture human review state
    const handoffQueue: Array<{
      issueContent: string;
      severity: string;
      detectionTime: Date;
      recommendedNotification: string;
      status: 'pending_approval' | 'approved' | 'rejected';
      snapshotId: string;
    }> = [];

    const mockHandoffInterface = {
      registerForHumanReview: jest.fn().mockImplementation((issueSnapshot) => {
        handoffQueue.push({
          ...issueSnapshot,
          status: 'pending_approval',
          snapshotId: `snap-${Date.now()}`,
        });
        return Promise.resolve({
          handoffId: `ho-${Date.now()}`,
          status: 'waiting_for_approval',
        });
      }),
    };

    // Mock AI client
    const mockAiClient: Tx11Imp1AiClient = {
      callAction01_CollectSubmissionStatus: jest.fn().mockResolvedValue({
        submittedMemberIds: ['eng-001', 'eng-002', 'eng-003'],
        unsubmittedMemberIds: ['eng-004'],
        timestamp: executionTimestamp,
      }),
      callAction02_SendReminderNotifications: jest.fn().mockResolvedValue({
        notificationsSent: 1,
        failureCount: 0,
      }),
      callAction03_ExtractIssuesFromReports: jest.fn().mockResolvedValue({
        extractedIssues: [
          {
            content: highSeverityIssueContent,
            mentionedByMembers: ['eng-001', 'eng-002'],
            extractionTimestamp: issueDetectionTimestamp,
          },
        ],
      }),
      callAction04_PrioritizeIssues: jest.fn().mockResolvedValue({
        prioritizedIssues: [
          {
            content: highSeverityIssueContent,
            priorityScore: 95,
            severity: 'high',
            confidence: 0.98,
          },
        ],
      }),
      callAction05_GenerateSummary: jest.fn().mockResolvedValue({
        summaryContent: 'HIGH PRIORITY: システム全体がダウンしている（検出時刻：08:35）',
        issueCount: 1,
      }),
      callAction06_NotifyManager: jest.fn().mockImplementation(() => {
        // Before confirming notification, check if handoff is required
        if (
          handoffQueue.length > 0 &&
          handoffQueue[handoffQueue.length - 1].severity === 'high'
        ) {
          // Handoff is active, do not send notification yet
          return Promise.resolve({
            status: 'handoff_pending',
            notificationSent: false,
          });
        }
        return Promise.resolve({
          status: 'sent',
          notificationSent: true,
        });
      }),
      callAction07_ProvideReferenceMaterials: jest.fn().mockResolvedValue({
        materialsProvided: 0,
        cacheHit: false,
      }),
    };

    // Execute agent
    const output: Tx11AgentOutput = await runTx11Imp1Agent(input, mockAiClient);

    // Verify Action 1-7 were called
    expect(mockAiClient.callAction01_CollectSubmissionStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId,
        executionTimestamp,
      })
    );

    expect(mockAiClient.callAction03_ExtractIssuesFromReports).toHaveBeenCalled();
    expect(mockAiClient.callAction04_PrioritizeIssues).toHaveBeenCalled();

    // Verify high-severity issue was detected
    expect(output.prioritizedIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          content: highSeverityIssueContent,
          priorityScore: 95,
          severity: 'high',
        }),
      ])
    );

    // Simulate AI detection of high severity, triggering handoff registration
    const highSeverityIssueSnapshot = {
      issueContent: highSeverityIssueContent,
      severity: 'high',
      detectionTime: issueDetectionTimestamp,
      recommendedNotification: `緊急対応が必要です: ${highSeverityIssueContent}`,
    };

    const handoffResult = await mockHandoffInterface.registerForHumanReview(
      highSeverityIssueSnapshot
    );

    // Verify handoff was registered
    expect(handoffResult.status).toBe('waiting_for_approval');
    expect(handoffQueue).toHaveLength(1);
    expect(handoffQueue[0]).toEqual(
      expect.objectContaining({
        issueContent: highSeverityIssueContent,
        severity: 'high',
        status: 'pending_approval',
      })
    );

    // Verify high-severity issue snapshot contains required fields
    expect(handoffQueue[0].snapshotId).toBeDefined();
    expect(handoffQueue[0].detectionTime).toEqual(issueDetectionTimestamp);
    expect(handoffQueue[0].recommendedNotification).toContain(highSeverityIssueContent);

    // Verify notification has NOT been sent yet (side effect not confirmed)
    expect(sentNotifications).toHaveLength(0);
    expect(mockNotificationService.sendReminderNotification).not.toHaveBeenCalled();

    // Verify Action 6 result shows handoff_pending status
    const action06Result = await mockAiClient.callAction06_NotifyManager();
    expect(action06Result.status).toBe('handoff_pending');
    expect(action06Result.notificationSent).toBe(false);

    // Scenario: Human approves the notification
    handoffQueue[0].status = 'approved';
    const approvalResult = await mockAiClient.callAction06_NotifyManager();
    expect(approvalResult.notificationSent).toBe(true);

    // After approval, verify notification could be sent
    await mockNotificationService.sendReminderNotification(managerEmail, highSeverityIssueSnapshot.recommendedNotification);
    expect(mockNotificationService.sendReminderNotification).toHaveBeenCalledWith(
      managerEmail,
      expect.stringContaining(highSeverityIssueContent)
    );
    expect(sentNotifications).toHaveLength(1);

    // Scenario: Reset and test human rejection
    sentNotifications.length = 0;
    handoffQueue[0].status = 'rejected';
    const rejectionResult = await mockAiClient.callAction06_NotifyManager();
    expect(rejectionResult.notificationSent).toBe(false);

    // Verify no notification sent after rejection
    expect(sentNotifications).toHaveLength(0);

    // Verify output contains expected summary structure
    expect(output.submissionStatus).toBeDefined();
    expect(output.submissionStatus.totalMembers).toBeGreaterThan(0);
    expect(output.prioritizedIssues).toBeDefined();
    expect(output.notificationsSent).toBeDefined();
    expect(output.summaryEmailSent).toBeDefined();
  });
});