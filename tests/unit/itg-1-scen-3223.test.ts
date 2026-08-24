import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import { type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('tx-9-imp-1: 日報集約から分析報告までの自動実行エージェント', () => {
  // SCEN-3223
  test('データ品質が低い場合に副作用確定前に人へ引き継ぐ', async () => {
    // テスト用の不完全な日報データセットを準備
    const incompleteReportData = [
      {
        reportId: 'report_001',
        memberId: 'member_001',
        reportDate: '2024-01-10',
        yesterdayContent: 'Completed task A',
        todayPlan: 'Plan task B',
        issueContent: 'Issue with task A',
      },
      {
        reportId: 'report_002',
        memberId: 'member_002',
        reportDate: '2024-01-10',
        yesterdayContent: '',
        todayPlan: '',
        issueContent: '',
      },
      {
        reportId: 'report_003',
        memberId: 'member_003',
        reportDate: '2024-01-10',
        yesterdayContent: 'Task C completed',
        todayPlan: 'Task D scheduled',
        issueContent: 'Issue resolved',
        issueSeverity: 'invalid_format',
      },
    ];

    const unreportedMemberIds = ['member_004', 'member_005'];

    const mockAuditLog: Array<{
      timestamp: string;
      eventType: string;
      escalationReason?: string;
      targetRole?: string;
      status?: string;
      skippedActions?: number[];
    }> = [];

    const mockTx9AiClient: Tx9Imp1AiClient = {
      aggregateReportData: jest.fn(async () => {
        return {
          aggregatedReports: incompleteReportData,
          unreportedMembers: unreportedMemberIds,
        };
      }),
      validateDataQuality: jest.fn(async () => {
        return {
          isQualityAcceptable: false,
          unreportedMemberCount: unreportedMemberIds.length,
          blankFieldCount: 3,
          invalidMetricCount: 1,
          details: {
            unreportedMembers: unreportedMemberIds,
            blankFields: ['report_002.yesterdayContent', 'report_002.todayPlan', 'report_002.issueContent'],
            invalidMetrics: ['report_003.issueSeverity'],
          },
        };
      }),
      extractIssuesAndClassify: jest.fn(async () => {
        throw new Error('Should not be called');
      }),
      calculateProductivityMetrics: jest.fn(async () => {
        throw new Error('Should not be called');
      }),
      prioritizeIssues: jest.fn(async () => {
        throw new Error('Should not be called');
      }),
      proposeCountermeasures: jest.fn(async () => {
        throw new Error('Should not be called');
      }),
      generateAnalysisReport: jest.fn(async () => {
        throw new Error('Should not be called');
      }),
      createEscalationNotification: jest.fn(async (escalationData) => {
        const notification = {
          notificationId: `notif_${Date.now()}`,
          recipientRole: 'department_manager',
          escalationReason: 'DATA_QUALITY_LOW',
          dataQualityIssues: {
            unreportedMembers: escalationData.unreportedMemberCount,
            blankFields: escalationData.blankFieldCount,
            invalidMetrics: escalationData.invalidMetricCount,
            memberDetails: escalationData.details.unreportedMembers,
          },
          affectedActions: [2, 3, 4, 5, 6, 7],
          createdAt: new Date('2024-01-15T09:00:00Z').toISOString(),
        };
        return notification;
      }),
      recordAuditEvent: jest.fn(async (eventData) => {
        mockAuditLog.push({
          timestamp: new Date('2024-01-15T09:00:00Z').toISOString(),
          eventType: eventData.eventType,
          escalationReason: eventData.escalationReason,
          targetRole: eventData.targetRole,
          status: eventData.status,
          skippedActions: eventData.skippedActions,
        });
        return { auditId: `audit_${mockAuditLog.length}` };
      }),
    };

    const aggregationStartDate = '2024-01-01';
    const aggregationEndDate = '2024-01-31';
    const targetTeamIds: string[] = [];
    const requestedByUserId = 'manager_001';

    const input = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      requestedByUserId,
    };

    const result = await runTx9Imp1Agent(input, mockTx9AiClient);

    // (4) 関数が制御状態オブジェクトを返す
    expect(result.status).toBe('ESCALATED');
    expect(result.escalationReason).toBe('DATA_QUALITY_LOW');
    expect(result.affectedActions).toEqual([2, 3, 4, 5, 6, 7]);
    expect(result.humanReviewRequired).toBe(true);
    expect(result.details).toEqual({
      unreportedMembers: 2,
      blankFields: 3,
      invalidMetrics: 1,
    });

    // (1) オーケストレーション状態が「ESCALATED_AWAITING_HUMAN_REVIEW」に遷移
    expect(result.orchestrationStatus).toBe('ESCALATED_AWAITING_HUMAN_REVIEW');

    // (1) 部長への引き継ぎ通知が生成される
    expect(mockTx9AiClient.createEscalationNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        unreportedMemberCount: 2,
        blankFieldCount: 3,
        invalidMetricCount: 1,
      })
    );

    const createdNotification = await mockTx9AiClient.createEscalationNotification({
      unreportedMemberCount: 2,
      blankFieldCount: 3,
      invalidMetricCount: 1,
      details: {
        unreportedMembers: unreportedMemberIds,
        blankFields: ['report_002.yesterdayContent', 'report_002.todayPlan', 'report_002.issueContent'],
        invalidMetrics: ['report_003.issueSeverity'],
      },
    });

    expect(createdNotification.recipientRole).toBe('department_manager');
    expect(createdNotification.escalationReason).toBe('DATA_QUALITY_LOW');
    expect(createdNotification.dataQualityIssues.unreportedMembers).toBe(2);
    expect(createdNotification.dataQualityIssues.blankFields).toBe(3);
    expect(createdNotification.dataQualityIssues.invalidMetrics).toBe(1);
    expect(createdNotification.dataQualityIssues.memberDetails).toEqual(unreportedMemberIds);

    // (2) Action 2～7は実行されず、副作用は確定していない
    expect(mockTx9AiClient.extractIssuesAndClassify).not.toHaveBeenCalled();
    expect(mockTx9AiClient.calculateProductivityMetrics).not.toHaveBeenCalled();
    expect(mockTx9AiClient.prioritizeIssues).not.toHaveBeenCalled();
    expect(mockTx9AiClient.proposeCountermeasures).not.toHaveBeenCalled();
    expect(mockTx9AiClient.generateAnalysisReport).not.toHaveBeenCalled();

    // (3) 監査ログに「ESCALATION_TRIGGERED」イベントが記録される
    expect(mockTx9AiClient.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'ESCALATION_TRIGGERED',
        escalationReason: 'DATA_QUALITY_LOW',
        targetRole: 'department_manager',
        status: 'AWAITING_HUMAN_REVIEW',
        skippedActions: [2, 3, 4, 5, 6, 7],
      })
    );

    // 監査ログの検証
    expect(mockAuditLog).toHaveLength(1);
    const auditEvent = mockAuditLog[0];
    expect(auditEvent.eventType).toBe('ESCALATION_TRIGGERED');
    expect(auditEvent.escalationReason).toBe('DATA_QUALITY_LOW');
    expect(auditEvent.targetRole).toBe('department_manager');
    expect(auditEvent.status).toBe('AWAITING_HUMAN_REVIEW');
    expect(auditEvent.skippedActions).toEqual([2, 3, 4, 5, 6, 7]);
  });
});