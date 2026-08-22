import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-033: [error] 日報集約から課題優先順位付けと未提出通知までの自律実行 AIエージェント - システム連携エラーによる日報取得失敗時に副作用の確定前に人へ引き継ぐ
  test('should escalate to human and prevent side effects when daily report system API fails', async () => {
    const mockReportDate = new Date('2024-01-15T09:00:00Z');
    const mockDepartmentId = 'dept_001';
    const mockErrorMessage = 'Daily report system API connection timeout';
    const mockErrorCode = 'REPORT_API_TIMEOUT';

    const mockAiClient = {
      callAction01GetReportSubmissionStatus: jest.fn().mockRejectedValueOnce(
        new Error(`System integration error: ${mockErrorCode} - ${mockErrorMessage}`)
      ),
      callAction02DetectUnsubmittedMembers: jest.fn(),
      callAction03ExtractIssues: jest.fn(),
      callAction04AssignIssuePriority: jest.fn(),
      callAction05GenerateMorningMeetingMaterial: jest.fn(),
      callAction06SendCompletionNotification: jest.fn(),
    };

    const mockEscalationHandler = jest.fn().mockResolvedValueOnce({
      escalationId: 'esc_001',
      status: 'ESCALATED_TO_HUMAN',
      notificationSentAt: new Date('2024-01-15T09:01:00Z'),
      auditLogId: 'audit_001',
    });

    const mockTransactionState = {
      status: 'IN_PROGRESS',
      action_completed: 'ACTION_01_STARTED',
      side_effects_confirmed: false,
      unsubmitted_notifications_sent: false,
      meeting_material_generated: false,
      completion_notification_sent: false,
    };

    const result = await sendUnsubmittedReminder(
      mockReportDate,
      mockDepartmentId,
      mockAiClient,
      mockEscalationHandler,
      mockTransactionState
    );

    // Verify that Action 1 was attempted once
    expect(mockAiClient.callAction01GetReportSubmissionStatus).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction01GetReportSubmissionStatus).toHaveBeenCalledWith({
      departmentId: mockDepartmentId,
      reportDate: mockReportDate,
    });

    // Verify that subsequent actions (Action 2-6) were NOT called
    expect(mockAiClient.callAction02DetectUnsubmittedMembers).not.toHaveBeenCalled();
    expect(mockAiClient.callAction03ExtractIssues).not.toHaveBeenCalled();
    expect(mockAiClient.callAction04AssignIssuePriority).not.toHaveBeenCalled();
    expect(mockAiClient.callAction05GenerateMorningMeetingMaterial).not.toHaveBeenCalled();
    expect(mockAiClient.callAction06SendCompletionNotification).not.toHaveBeenCalled();

    // Verify escalation handler was called with correct error context
    expect(mockEscalationHandler).toHaveBeenCalledTimes(1);
    expect(mockEscalationHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        condition: 'SYSTEM_INTEGRATION_ERROR_ON_REPORT_RETRIEVAL',
        errorCode: mockErrorCode,
        errorMessage: mockErrorMessage,
        failedAction: 'ACTION_01',
        departmentId: mockDepartmentId,
        reportDate: mockReportDate,
        sideEffectsConfirmed: false,
        unsubmittedNotificationsSent: false,
        meetingMaterialGenerated: false,
        completionNotificationSent: false,
      })
    );

    // Verify transaction state reflects side effects NOT confirmed
    expect(result.transactionState).toEqual(
      expect.objectContaining({
        status: 'ESCALATED_TO_HUMAN',
        action_completed: 'ACTION_01_FAILED',
        side_effects_confirmed: false,
        unsubmitted_notifications_sent: false,
        meeting_material_generated: false,
        completion_notification_sent: false,
      })
    );

    // Verify orchestrator status is ESCALATED_TO_HUMAN
    expect(result.status).toBe('ESCALATED_TO_HUMAN');

    // Verify escalation notification details
    expect(result.escalation).toEqual(
      expect.objectContaining({
        escalationId: 'esc_001',
        status: 'ESCALATED_TO_HUMAN',
        notificationSentAt: new Date('2024-01-15T09:01:00Z'),
        auditLogId: 'audit_001',
      })
    );

    // Verify audit log entry contains required information
    expect(result.auditLog).toEqual(
      expect.objectContaining({
        timestamp: expect.any(Date),
        eventType: 'ESCALATION_TRIGGERED',
        errorCategory: 'SYSTEM_INTEGRATION_ERROR',
        errorCode: mockErrorCode,
        errorDetail: mockErrorMessage,
        failedActionStep: 'ACTION_01',
        departmentId: mockDepartmentId,
        reportDate: mockReportDate,
        sideEffectStatus: 'NOT_CONFIRMED',
        escalatedToHumanReviewAt: expect.any(Date),
      })
    );

    // Verify no side effects were applied
    expect(result.sideEffectsApplied).toEqual({
      unsubmittedNotificationsSent: false,
      meetingMaterialGenerated: false,
      completionNotificationSent: false,
    });
  });
});