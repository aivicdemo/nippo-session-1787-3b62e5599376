import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10AgentInput, Tx10AgentOutput, InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/types';

describe('tx-10-imp-1: 初回テスト運用判定機能 - 形式統一度が85%超で本格運用移行', () => {
  // SCEN-2617
  test('形式統一度が85%を超えるとき、本格運用への移行条件を満たす', async () => {
    const now = new Date('2024-01-15T08:30:00Z');
    const deploymentInitiationTimestamp = new Date('2024-01-08T09:00:00Z');

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true, deliveryStatus: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' }),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続エラー', frequency: 3, confidence: 0.95 },
          { keyword: 'ネットワークタイムアウト', frequency: 2, confidence: 0.88 },
          { keyword: 'ユーザー認証失敗', frequency: 1, confidence: 0.92 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
        severity: 'high',
        affectedTeams: 3,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        category: 'infrastructure',
      }),
    };

    const testParticipants = [
      { userId: 'eng-001', role: 'Engineer', email: 'eng001@company.com' },
      { userId: 'eng-002', role: 'Engineer', email: 'eng002@company.com' },
      { userId: 'eng-003', role: 'Engineer', email: 'eng003@company.com' },
      { userId: 'eng-004', role: 'Engineer', email: 'eng004@company.com' },
      { userId: 'eng-005', role: 'Engineer', email: 'eng005@company.com' },
      { userId: 'eng-006', role: 'Engineer', email: 'eng006@company.com' },
      { userId: 'eng-007', role: 'Engineer', email: 'eng007@company.com' },
      { userId: 'eng-008', role: 'Engineer', email: 'eng008@company.com' },
      { userId: 'eng-009', role: 'Engineer', email: 'eng009@company.com' },
      { userId: 'eng-010', role: 'Engineer', email: 'eng010@company.com' },
      { userId: 'mgr-001', role: 'Manager', email: 'mgr001@company.com' },
      { userId: 'pm-001', role: 'ProjectManager', email: 'pm001@company.com' },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList: testParticipants,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    const output = await runTx10Imp1Agent(input, mockTextAnalysisServiceAdapter);

    expect(output).toBeDefined();
    expect(output.onboardingApprovalStatus).toBeDefined();

    const analysisResult: InitialReportAnalysisResult = output.initialReportAnalysis;
    expect(analysisResult).toBeDefined();

    expect(analysisResult.submissionRate).toBeGreaterThanOrEqual(90);
    expect(analysisResult.dataQualityScore).toBeGreaterThanOrEqual(80);

    expect(analysisResult.formatUniformityScore).toBeGreaterThan(85);
    expect(analysisResult.formatUniformityScore).toBeLessThanOrEqual(100);

    expect(output.onboardingApprovalStatus.approved).toBe(true);
    expect(output.onboardingApprovalStatus.readyForProductionDeployment).toBe(true);

    expect(output.onboardingApprovalStatus.judgmentReasoning).toMatch(/形式統一度/);
    expect(output.onboardingApprovalStatus.judgmentReasoning).toMatch(/85/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalled();

    expect(output.deploymentSchedule).toBeDefined();
    expect(output.deploymentSchedule.productionStartDate).toBeDefined();

    const startDate = new Date(output.deploymentSchedule.productionStartDate);
    expect(startDate.getTime()).toBeGreaterThan(now.getTime());

    expect(output.trainingMaterials).toBeDefined();
    expect(output.trainingMaterials.length).toBeGreaterThan(0);

    const auditLog = output.onboardingApprovalStatus.auditLog || [];
    const formatUniformityEntry = auditLog.find(
      (log: { event: string }) => log.event.includes('形式統一度') || log.event.includes('運用判定')
    );
    expect(formatUniformityEntry).toBeDefined();
  });
});