import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { updateReport } from '../../src/logic/report-persistence';
import type { UpdateReportInput, UpdateReportOutput, ChangeHistoryEntry } from '../../src/logic/report-persistence';

describe('report-persistence', () => {
  test('SCEN-152: [normal] 既存の日報データを更新し、変更履歴と更新時刻を記録する', () => {
    const testReportId = 'report-001';
    const testUpdaterId = 'user-engineer-001';
    const yesterdayPerformanceOld = 'previous accomplishment';
    const todayPlanOld = 'previous plan';
    const issuesAndConcernsOld = 'previous issues';
    const priorityLevelOld = 'medium';

    const updateReportInput: UpdateReportInput = {
      reportId: testReportId,
      updaterId: testUpdaterId,
      yesterdayPerformance: '顧客A向けドキュメント作成完了',
      todayPlan: '顧客B向け説明会準備',
      issuesAndConcerns: '依存タスクの遅延リスク',
      priorityLevel: 'high',
      attachmentIds: null,
    };

    const mockJudgeAccessPermission = jest.fn(() => true);
    const mockValidateReportSubmission = jest.fn((input) => ({
      ...input,
      yesterdayPerformance: input.yesterdayPerformance?.trim(),
      todayPlan: input.todayPlan?.trim(),
      issuesAndConcerns: input.issuesAndConcerns?.trim(),
    }));
    const mockEncryptReportData = jest.fn((data) => ({
      encryptedContent: `encrypted_${data.reportId}`,
      encryptionMethod: 'AES-256-GCM',
      engineerId: data.reporterId,
      reportDate: data.reportDate,
      integrityHash: `hash_${data.reportId}`,
      accessLog: [],
    }));

    const beforeUpdateTime = new Date('2024-01-15T10:00:00Z');
    const afterUpdateTime = new Date('2024-01-15T10:05:00Z');

    const result: UpdateReportOutput = updateReport(updateReportInput);

    expect(result.reportId).toBe(testReportId);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdateTime.getTime());
    expect(result.updatedAt.getTime()).toBeLessThanOrEqual(afterUpdateTime.getTime());

    expect(result.changeHistory).toBeInstanceOf(Array);
    expect(result.changeHistory.length).toBe(4);

    const yesterdayPerformanceEntry = result.changeHistory.find(
      (entry: ChangeHistoryEntry) => entry.fieldName === 'yesterdayPerformance'
    );
    expect(yesterdayPerformanceEntry).toBeDefined();
    expect(yesterdayPerformanceEntry?.fieldName).toBe('yesterdayPerformance');
    expect(yesterdayPerformanceEntry?.newValue).toBe('顧客A向けドキュメント作成完了');
    expect(typeof yesterdayPerformanceEntry?.previousValue).toBe('string');
    expect(yesterdayPerformanceEntry?.changedAt).toBeInstanceOf(Date);

    const todayPlanEntry = result.changeHistory.find(
      (entry: ChangeHistoryEntry) => entry.fieldName === 'todayPlan'
    );
    expect(todayPlanEntry).toBeDefined();
    expect(todayPlanEntry?.fieldName).toBe('todayPlan');
    expect(todayPlanEntry?.newValue).toBe('顧客B向け説明会準備');
    expect(typeof todayPlanEntry?.previousValue).toBe('string');
    expect(todayPlanEntry?.changedAt).toBeInstanceOf(Date);

    const issuesAndConcernsEntry = result.changeHistory.find(
      (entry: ChangeHistoryEntry) => entry.fieldName === 'issuesAndConcerns'
    );
    expect(issuesAndConcernsEntry).toBeDefined();
    expect(issuesAndConcernsEntry?.fieldName).toBe('issuesAndConcerns');
    expect(issuesAndConcernsEntry?.newValue).toBe('依存タスクの遅延リスク');
    expect(typeof issuesAndConcernsEntry?.previousValue).toBe('string');
    expect(issuesAndConcernsEntry?.changedAt).toBeInstanceOf(Date);

    const priorityLevelEntry = result.changeHistory.find(
      (entry: ChangeHistoryEntry) => entry.fieldName === 'priorityLevel'
    );
    expect(priorityLevelEntry).toBeDefined();
    expect(priorityLevelEntry?.fieldName).toBe('priorityLevel');
    expect(priorityLevelEntry?.newValue).toBe('high');
    expect(typeof priorityLevelEntry?.previousValue).toBe('string');
    expect(priorityLevelEntry?.changedAt).toBeInstanceOf(Date);

    expect(['draft', 'submitted']).toContain(result.status);
  });
});