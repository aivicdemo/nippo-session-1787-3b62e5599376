import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10AgentInput, DeploymentParticipant } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('TX10 導入計画・研修実施・フィードバック対応の自動化・統合', () => {
  // SCEN-191: べき等性確保 - 同一要求IDでの再実行時に重複書き込みが発生しない
  test('should ensure idempotent execution with same request ID and parameters - no duplicate records created on retry', async () => {
    // ===== Setup: fake dependencies and state tracking =====
    const dbState = {
      deploymentSchedules: [] as Array<{ requestId: string; createdAt: Date; deploymentInitiationTimestamp: Date; preparationDaysRequired: number; reportingDeadlineTime: string }>,
      managerGuides: [] as Array<{ requestId: string; createdAt: Date; guideContent: string }>,
      trainingMaterials: [] as Array<{ requestId: string; createdAt: Date; materialContent: string }>,
      feedbackPlans: [] as Array<{ requestId: string; createdAt: Date; feedbackContent: string }>,
      memberDeliveryLogs: [] as Array<{ requestId: string; memberId: string; createdAt: Date; notificationType: string }>,
      auditLogs: [] as Array<{ requestId: string; actionIndex: number; executedAt: Date; status: string }>,
    };

    const mailSendLog: Array<{ recipient: string; subject: string; body: string; sentAt: Date }> = [];

    const fakeAiClient = {
      async generateDeploymentSchedule(input: Tx10AgentInput): Promise<{ deploymentInitiationTimestamp: Date; preparationDaysRequired: number; reportingDeadlineTime: string }> {
        return {
          deploymentInitiationTimestamp: new Date('2024-02-01T09:00:00Z'),
          preparationDaysRequired: 5,
          reportingDeadlineTime: '09:00',
        };
      },
      async generateManagerGuide(): Promise<string> {
        return 'Manager Guide: 朝会報告システムの運用方法と優先度判定ルール';
      },
      async generateTrainingMaterials(): Promise<string> {
        return 'Training Material: エンジニア向け基礎研修資料';
      },
      async analyzeInitialReports(): Promise<{ submissionRate: number; dataQualityScore: number; formatUniformityScore: number; feedbackItems: Array<{ memberId: string; feedback: string }> }> {
        return {
          submissionRate: 85,
          dataQualityScore: 75,
          formatUniformityScore: 80,
          feedbackItems: [
            { memberId: 'emp-001', feedback: '課題の優先度分類が不明確' },
            { memberId: 'emp-002', feedback: '形式の統一が必要' },
          ],
        };
      },
      async createFeedbackPlan(analysisResult: any): Promise<string> {
        return 'Feedback Plan: 各メンバーへの改善提案と再研修スケジュール';
      },
      async approveOnboarding(): Promise<{ approved: boolean; deploymentStartDate: Date }> {
        return {
          approved: true,
          deploymentStartDate: new Date('2024-02-06T09:00:00Z'),
        };
      },
    };

    const fakeDbClient = {
      async insertDeploymentSchedule(requestId: string, data: any): Promise<void> {
        const existing = dbState.deploymentSchedules.find(r => r.requestId === requestId);
        if (existing) return; // idempotent: skip duplicate insert
        dbState.deploymentSchedules.push({
          requestId,
          createdAt: new Date('2024-02-01T10:00:00Z'),
          deploymentInitiationTimestamp: data.deploymentInitiationTimestamp,
          preparationDaysRequired: data.preparationDaysRequired,
          reportingDeadlineTime: data.reportingDeadlineTime,
        });
        dbState.auditLogs.push({
          requestId,
          actionIndex: 1,
          executedAt: new Date('2024-02-01T10:00:00Z'),
          status: 'completed',
        });
      },
      async insertManagerGuide(requestId: string, content: string): Promise<void> {
        const existing = dbState.managerGuides.find(r => r.requestId === requestId);
        if (existing) return;
        dbState.managerGuides.push({
          requestId,
          createdAt: new Date('2024-02-01T10:05:00Z'),
          guideContent: content,
        });
        dbState.auditLogs.push({
          requestId,
          actionIndex: 2,
          executedAt: new Date('2024-02-01T10:05:00Z'),
          status: 'completed',
        });
      },
      async insertTrainingMaterial(requestId: string, content: string): Promise<void> {
        const existing = dbState.trainingMaterials.find(r => r.requestId === requestId);
        if (existing) return;
        dbState.trainingMaterials.push({
          requestId,
          createdAt: new Date('2024-02-01T10:10:00Z'),
          materialContent: content,
        });
        dbState.auditLogs.push({
          requestId,
          actionIndex: 3,
          executedAt: new Date('2024-02-01T10:10:00Z'),
          status: 'completed',
        });
      },
      async insertFeedbackPlan(requestId: string, content: string): Promise<void> {
        const existing = dbState.feedbackPlans.find(r => r.requestId === requestId);
        if (existing) return;
        dbState.feedbackPlans.push({
          requestId,
          createdAt: new Date('2024-02-01T10:15:00Z'),
          feedbackContent: content,
        });
        dbState.auditLogs.push({
          requestId,
          actionIndex: 5,
          executedAt: new Date('2024-02-01T10:15:00Z'),
          status: 'completed',
        });
      },
      async insertMemberDeliveryLog(requestId: string, memberId: string, notificationType: string): Promise<void> {
        const existing = dbState.memberDeliveryLogs.find(
          r => r.requestId === requestId && r.memberId === memberId
        );
        if (existing) return;
        dbState.memberDeliveryLogs.push({
          requestId,
          memberId,
          createdAt: new Date('2024-02-01T10:20:00Z'),
          notificationType,
        });
      },
      async insertAuditLog(requestId: string, actionIndex: number, status: string): Promise<void> {
        const existing = dbState.auditLogs.find(
          r => r.requestId === requestId && r.actionIndex === actionIndex
        );
        if (existing) return;
        dbState.auditLogs.push({
          requestId,
          actionIndex,
          executedAt: new Date('2024-02-01T10:30:00Z'),
          status,
        });
      },
      async queryDeploymentSchedulesByRequestId(requestId: string): Promise<any[]> {
        return dbState.deploymentSchedules.filter(r => r.requestId === requestId);
      },
      async queryManagerGuidesByRequestId(requestId: string): Promise<any[]> {
        return dbState.managerGuides.filter(r => r.requestId === requestId);
      },
      async queryTrainingMaterialsByRequestId(requestId: string): Promise<any[]> {
        return dbState.trainingMaterials.filter(r => r.requestId === requestId);
      },
      async queryFeedbackPlansByRequestId(requestId: string): Promise<any[]> {
        return dbState.feedbackPlans.filter(r => r.requestId === requestId);
      },
      async queryMemberDeliveryLogsByRequestId(requestId: string): Promise<any[]> {
        return dbState.memberDeliveryLogs.filter(r => r.requestId === requestId);
      },
      async queryAuditLogsByRequestId(requestId: string): Promise<any[]> {
        return dbState.auditLogs.filter(r => r.requestId === requestId);
      },
      async queryAllAuditLogs(): Promise<any[]> {
        return dbState.auditLogs;
      },
    };

    const fakeMailClient = {
      async sendEmail(recipient: string, subject: string, body: string): Promise<void> {
        mailSendLog.push({
          recipient,
          subject,
          body,
          sentAt: new Date('2024-02-01T10:25:00Z'),
        });
      },
    };

    // ===== First execution with request ID: req-001 =====
    const participantList: DeploymentParticipant[] = [
      { userId: 'emp-001', role: 'Engineer', email: 'emp001@example.com' },
      { userId: 'emp-002', role: 'Engineer', email: 'emp002@example.com' },
      { userId: 'emp-003', role: 'Engineer', email: 'emp003@example.com' },
      { userId: 'emp-004', role: 'Engineer', email: 'emp004@example.com' },
      { userId: 'emp-005', role: 'Engineer', email: 'emp005@example.com' },
      { userId: 'emp-006', role: 'Engineer', email: 'emp006@example.com' },
      { userId: 'emp-007', role: 'Engineer', email: 'emp007@example.com' },
      { userId: 'emp-008', role: 'Engineer', email: 'emp008@example.com' },
      { userId: 'emp-009', role: 'Engineer', email: 'emp009@example.com' },
      { userId: 'emp-010', role: 'Engineer', email: 'emp010@example.com' },
    ];

    const firstInput: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2024-02-01T09:00:00Z'),
      participantList,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    const firstResult = await runTx10Imp1Agent(
      { requestId: 'req-001', input: firstInput },
      fakeAiClient as any,
      fakeDbClient as any,
      fakeMailClient as any
    );

    // ===== Verify first execution output =====
    expect(firstResult.deploymentSchedule).toBeDefined();
    expect(firstResult.deploymentSchedule.deploymentInitiationTimestamp).toEqual(new Date('2024-02-01T09:00:00Z'));
    expect(firstResult.deploymentSchedule.preparationDaysRequired).toBe(5);
    expect(firstResult.deploymentSchedule.reportingDeadlineTime).toBe('09:00');
    expect(firstResult.trainingMaterials).toBeDefined();
    expect(firstResult.trainingMaterials.length).toBeGreaterThan(0);
    expect(firstResult.initialReportAnalysis).toBeDefined();
    expect(firstResult.initialReportAnalysis.submissionRate).toBe(85);
    expect(firstResult.initialReportAnalysis.dataQualityScore).toBe(75);
    expect(firstResult.initialReportAnalysis.formatUniformityScore).toBe(80);
    expect(firstResult.onboardingApprovalStatus).toBeDefined();
    expect(firstResult.onboardingApprovalStatus.approved).toBe(true);

    // ===== Capture initial database state snapshot =====
    const initialScheduleCount = dbState.deploymentSchedules.length;
    const initialGuideCount = dbState.managerGuides.length;
    const initialMaterialCount = dbState.trainingMaterials.length;
    const initialFeedbackCount = dbState.feedbackPlans.length;
    const initialMemberLogCount = dbState.memberDeliveryLogs.length;
    const initialAuditLogCount = dbState.auditLogs.length;
    const initialMailSendCount = mailSendLog.length;

    // Expected initial state:
    expect(initialScheduleCount).toBe(1);
    expect(initialGuideCount).toBe(1);
    expect(initialMaterialCount).toBe(1);
    expect(initialFeedbackCount).toBe(1);
    expect(initialMemberLogCount).toBe(10); // one for each participant
    expect(initialAuditLogCount).toBeGreaterThan(0);
    expect(initialMailSendCount).toBeGreaterThan(0);

    // ===== Capture timestamps of first execution =====
    const firstScheduleRecord = dbState.deploymentSchedules[0];
    const firstGuideRecord = dbState.managerGuides[0];
    const firstMaterialRecord = dbState.trainingMaterials[0];
    const firstFeedbackRecord = dbState.feedbackPlans[0];

    const firstScheduleTimestamp = firstScheduleRecord.createdAt;
    const firstGuideTimestamp = firstGuideRecord.createdAt;
    const firstMaterialTimestamp = firstMaterialRecord.createdAt;
    const firstFeedbackTimestamp = firstFeedbackRecord.createdAt;

    // ===== Second execution with same request ID and parameters (retry) =====
    const secondResult = await runTx10Imp1Agent(
      { requestId: 'req-001', input: firstInput },
      fakeAiClient as any,
      fakeDbClient as any,
      fakeMailClient as any
    );

    // ===== Verify second execution result =====
    expect(secondResult).toBeDefined();
    expect(secondResult.deploymentSchedule).toBeDefined();

    // ===== Verify database state remains unchanged (idempotent) =====
    expect(dbState.deploymentSchedules.length).toBe(initialScheduleCount);
    expect(dbState.managerGuides.length).toBe(initialGuideCount);
    expect(dbState.trainingMaterials.length).toBe(initialMaterialCount);
    expect(dbState.feedbackPlans.length).toBe(initialFeedbackCount);
    expect(dbState.memberDeliveryLogs.length).toBe(initialMemberLogCount);
    expect(dbState.auditLogs.length).toBe(initialAuditLogCount);

    // ===== Verify no duplicate records by request ID =====
    const schedulesByReqId = dbState.deploymentSchedules.filter(r => r.requestId === 'req-001');
    expect(schedulesByReqId).toHaveLength(1);

    const guidesByReqId = dbState.managerGuides.filter(r => r.requestId === 'req-001');
    expect(guidesByReqId).toHaveLength(1);

    const materialsByReqId = dbState.trainingMaterials.filter(r => r.requestId === 'req-001');
    expect(materialsByReqId).toHaveLength(1);

    const feedbacksByReqId = dbState.feedbackPlans.filter(r => r.requestId === 'req-001');
    expect(feedbacksByReqId).toHaveLength(1);

    // ===== Verify unique constraint on (requestId, memberId) for delivery logs =====
    const memberLogsByReqId = dbState.memberDeliveryLogs.filter(r => r.requestId === 'req-001');
    expect(memberLogsByReqId).toHaveLength(10);
    const memberIdCounts = new Map<string, number>();
    memberLogsByReqId.forEach(log => {
      const key = `${log.requestId}:${log.memberId}`;
      memberIdCounts.set(key, (memberIdCounts.get(key) || 0) + 1);
    });
    memberIdCounts.forEach(count => {
      expect(count).toBe(1); // no duplicates
    });

    // ===== Verify audit logs are not duplicated =====
    const auditLogsByReqId = dbState.auditLogs.filter(r => r.requestId === 'req-001');
    const auditActionCounts = new Map<number, number>();
    auditLogsByReqId.forEach(log => {
      auditActionCounts.set(log.actionIndex, (auditActionCounts.get(log.actionIndex) || 0) + 1);
    });
    auditActionCounts.forEach(count => {
      expect(count).toBeLessThanOrEqual(1); // each action logged at most once per request
    });

    // ===== Verify timestamps remain unchanged =====
    expect(dbState.deploymentSchedules[0].createdAt).toEqual(firstScheduleTimestamp);
    expect(dbState.managerGuides[0].createdAt).toEqual(firstGuideTimestamp);
    expect(dbState.trainingMaterials[0].createdAt).toEqual(firstMaterialTimestamp);
    expect(dbState.feedbackPlans[0].createdAt).toEqual(firstFeedbackTimestamp);

    // ===== Verify email sends are not duplicated =====
    const initialMailCount = initialMailSendCount;
    const finalMailCount = mailSendLog.length;
    expect(finalMailCount).toBe(initialMailCount); // no additional mails sent on retry

    // ===== Verify manager and member notifications match initial count =====
    const managerEmailsFirstRun = mailSendLog.slice(0, initialMailSendCount).filter(
      m => m.subject.includes('ガイド') || m.subject.includes('Guide')
    );
    const managerEmailsTotal = mailSendLog.filter(
      m => m.subject.includes('ガイド') || m.subject.includes('Guide')
    );
    expect(managerEmailsTotal.length).toBe(managerEmailsFirstRun.length);

    // ===== Verify request ID is idempotency key =====
    expect(schedulesByReqId[0].requestId).toBe('req-001');
    expect(guidesByReqId[0].requestId).toBe('req-001');
    expect(materialsByReqId[0].requestId).toBe('req-001');
    expect(feedbacksByReqId[0].requestId).toBe('req-001');
  });
});