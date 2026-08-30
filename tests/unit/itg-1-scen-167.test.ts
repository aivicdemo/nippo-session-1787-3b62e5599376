import { updateIssueDataWithAnalysisResult } from '../../src/logic/issue-data-persistence';
import type {
  UpdateIssueAnalysisInput,
  UpdateIssueAnalysisResult,
  AnalysisResultData,
  ExecutionPlanData,
} from '../../src/logic/issue-data-persistence';

describe('Issue Data Persistence', () => {
  // SCEN-167
  test('should successfully update issue data with analysis result and record audit log', async () => {
    const updateInput: UpdateIssueAnalysisInput = {
      issueId: 'ISSUE-001',
      priorityScore: 75,
      impactLevel: '高',
      analysisResult: {
        rootCause: 'ビルドシステムの設定不正',
        proposedCountermeasure: 'ビルドスクリプトの再検証と修正',
        estimatedResolutionDays: 2,
      },
      executionPlan: {
        assignedUserId: 'USER-456',
        dueDate: '2026-08-22T09:00:00Z',
        actionDescription: 'ビルドスクリプトを修正し、CI/CDパイプラインを再実行する',
      },
      updatedByUserId: 'USER-123',
    };

    const result: UpdateIssueAnalysisResult = await updateIssueDataWithAnalysisResult(updateInput);

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.auditLogId).toBe('AUDIT-LOG-001');
    expect(result.isEncrypted).toBe(true);
    expect(typeof result.updateTimestamp).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.updateTimestamp)).toBe(true);
  });
});