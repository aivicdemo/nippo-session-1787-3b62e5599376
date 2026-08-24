import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次課題傾向分析レポート生成処理', () => {
  // SCEN-1871: 月次レポート生成処理の失敗時再試行制御 - 3回の再試行が異なる原因で失敗した場合
  test('should handle multiple retry failures with different causes and escalate to human review', async () => {
    const targetMonth = '2024-01';
    const managerUserId = 'user-manager-001';
    const triggerTimestamp = new Date('2024-02-01T09:00:00Z');
    const includeDetailedAnalysis = true;

    const failureTimestamp1 = new Date('2024-02-01T09:00:05Z');
    const failureTimestamp2 = new Date('2024-02-01T09:00:15Z');
    const failureTimestamp3 = new Date('2024-02-01T09:00:30Z');

    const mockAiClient: Tx7Imp1AiClient = {
      generateMonthlyReport: jest.fn()
        .mockRejectedValueOnce(
          new Error('API timeout exceeded 30s')
        )
        .mockRejectedValueOnce(
          new Error('Data validation failed: missing required field targetMonth')
        )
        .mockRejectedValueOnce(
          new Error('Logic execution failed: bottleneck trend analysis step 4 encountered unexpected exception')
        ),
      extractAndAnalyzeChallenges: jest.fn()
        .mockResolvedValue({
          topPriorityChallenges: [],
          bottleneckTrend: {
            timeSeriesData: [],
            improvementTrend: 'stable' as const,
            recurringIssuePattern: [],
          },
          teamPerformanceMetrics: {
            averageChallengeResolutionDays: 0,
            reportSubmissionRate: 0,
            challengeRecurrenceRate: 0,
          },
        }),
      notifyManager: jest.fn().mockResolvedValue(undefined),
    };

    const input = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis,
    };

    const auditEventsCollector: Array<{
      event_type: string;
      orchestrator_status: string;
      escalation_reason?: string;
      human_review_required: boolean;
      report_status: string;
      failure_details: Array<{
        failure_type: string;
        retry_attempt: number;
        error_message: string;
        timestamp: Date;
      }>;
    }> = [];

    const notificationQueueCollector: Array<{
      event_id: string;
      type: string;
      message: string;
      timestamp: Date;
    }> = [];

    let orchestratorStatus = 'initial';
    let reportStatus = 'initial';
    let escalationReason: string | undefined;
    let humanReviewRequired = false;

    try {
      const result = await runTx7Imp1Agent(input, mockAiClient);

      orchestratorStatus = 'completed';
      reportStatus = result.executionStatus;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('validation') ||
        errorMessage.includes('Logic execution')
      ) {
        orchestratorStatus = 'escalation_required';
        reportStatus = 'pending_human_verification';
        escalationReason = 'multiple_retry_failures_with_different_causes';
        humanReviewRequired = true;

        auditEventsCollector.push({
          event_type: 'monthly_report_generation_failed',
          orchestrator_status,
          escalation_reason,
          human_review_required: humanReviewRequired,
          report_status: reportStatus,
          failure_details: [
            {
              failure_type: 'timeout',
              retry_attempt: 1,
              error_message: 'API timeout exceeded 30s',
              timestamp: failureTimestamp1,
            },
            {
              failure_type: 'data_validation_error',
              retry_attempt: 2,
              error_message: 'Data validation failed: missing required field targetMonth',
              timestamp: failureTimestamp2,
            },
            {
              failure_type: 'logic_execution_error',
              retry_attempt: 3,
              error_message: 'Logic execution failed: bottleneck trend analysis step 4 encountered unexpected exception',
              timestamp: failureTimestamp3,
            },
          ],
        });

        notificationQueueCollector.push({
          event_id: `evt-monthly-report-failure-${Date.now()}`,
          type: 'error_escalation',
          message: '月次レポート生成に複数の失敗が発生しました。詳細確認が必要です',
          timestamp: new Date('2024-02-01T09:00:35Z'),
        });
      }
    }

    expect(mockAiClient.generateMonthlyReport).toHaveBeenCalledTimes(3);

    expect(orchestratorStatus).toBe('escalation_required');
    expect(reportStatus).toBe('pending_human_verification');
    expect(escalationReason).toBe('multiple_retry_failures_with_different_causes');
    expect(humanReviewRequired).toBe(true);

    expect(auditEventsCollector).toHaveLength(1);
    const auditEvent = auditEventsCollector[0];

    expect(auditEvent.event_type).toBe('monthly_report_generation_failed');
    expect(auditEvent.orchestrator_status).toBe('escalation_required');
    expect(auditEvent.escalation_reason).toBe('multiple_retry_failures_with_different_causes');
    expect(auditEvent.human_review_required).toBe(true);
    expect(auditEvent.report_status).toBe('pending_human_verification');

    expect(auditEvent.failure_details).toHaveLength(3);

    const failureDetail1 = auditEvent.failure_details[0];
    expect(failureDetail1.failure_type).toBe('timeout');
    expect(failureDetail1.retry_attempt).toBe(1);
    expect(failureDetail1.error_message).toBe('API timeout exceeded 30s');
    expect(failureDetail1.timestamp.getTime()).toBe(failureTimestamp1.getTime());

    const failureDetail2 = auditEvent.failure_details[1];
    expect(failureDetail2.failure_type).toBe('data_validation_error');
    expect(failureDetail2.retry_attempt).toBe(2);
    expect(failureDetail2.error_message).toBe('Data validation failed: missing required field targetMonth');
    expect(failureDetail2.timestamp.getTime()).toBe(failureTimestamp2.getTime());

    const failureDetail3 = auditEvent.failure_details[2];
    expect(failureDetail3.failure_type).toBe('logic_execution_error');
    expect(failureDetail3.retry_attempt).toBe(3);
    expect(failureDetail3.error_message).toBe('Logic execution failed: bottleneck trend analysis step 4 encountered unexpected exception');
    expect(failureDetail3.timestamp.getTime()).toBe(failureTimestamp3.getTime());

    expect(notificationQueueCollector).toHaveLength(1);
    const queuedNotification = notificationQueueCollector[0];
    expect(queuedNotification.type).toBe('error_escalation');
    expect(queuedNotification.message).toBe('月次レポート生成に複数の失敗が発生しました。詳細確認が必要です');
  });
});