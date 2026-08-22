import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  // SCEN-184: [error] 導入計画・研修実施・フィードバック対応の自動化・統合 AIエージェント - 「導入計画・研修実施・フィードバック対応の自動化・統合」が「導入スケジュール案が組織方針と矛盾する場合」の場合に副作用の確定前に人へ引き継ぐ
  test('should escalate to human review when generated schedule conflicts with organization policy', async () => {
    const departmentSize = 50;
    const currentSystemStatus = 'none';
    const plannedDeploymentQuarter = 'Q2';
    const organizationPolicy = 'System deployment only from next fiscal year onwards';
    
    const generatedSchedule = {
      deploymentStart: '2025-01-01',
      allTrainingComplete: '2024-12-31',
      conflictsWithPolicy: true,
      conflictReason: 'Generated schedule contains past dates and violates organization policy requiring deployment after next fiscal year',
    };

    const departmentInfo = {
      size: departmentSize,
      currentSystemStatus: currentSystemStatus,
      plannedDeploymentQuarter: plannedDeploymentQuarter,
      organizationPolicy: organizationPolicy,
    };

    const aiClientOutput = {
      action: 'action-01',
      status: 'completed',
      payload: {
        schedule: generatedSchedule,
        policyConflict: true,
        conflictDetails: {
          generatedStartDate: '2025-01-01',
          generatedCompletionDate: '2024-12-31',
          organizationRequirement: organizationPolicy,
          violationDescription: 'Schedule contains invalid past completion date and contradicts policy',
        },
      },
    };

    const result = await detectAndNotifyUnsubmitted(departmentInfo, aiClientOutput);

    expect(result.status).toBe('ERROR');
    expect(result.escalationTriggered).toBe(true);
    expect(result.escalationReason).toBe('導入スケジュール案が組織方針と矛盾');
    expect(result.affectedActions).toEqual(['action-01']);
    expect(result.sideEffectsApplied).toBe(false);
    expect(result.transactionState).toEqual({
      trainingMaterialGeneration: 'not_executed',
      memberNotification: 'not_executed',
      databasePersistence: 'not_executed',
      allSideEffectsPending: true,
    });
    expect(result.humanReviewTask).toBeDefined();
    expect(result.humanReviewTask.status).toBe('AWAITING_HUMAN_DECISION');
    expect(result.humanReviewTask.escalationReason).toBe('導入スケジュール案が組織方針と矛盾');
    expect(result.humanReviewTask.conflictingScheduleDetails).toBeDefined();
    expect(result.humanReviewTask.conflictingScheduleDetails.generatedStartDate).toBe('2025-01-01');
    expect(result.humanReviewTask.conflictingScheduleDetails.generatedCompletionDate).toBe('2024-12-31');
    expect(result.humanReviewTask.organizationPolicyReference).toBe(organizationPolicy);
    expect(result.humanReviewTask.awaitingHumanDecision).toBe(true);
  });
});