import { describe, test, expect } from '@jest/globals';
import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能', () => {
  test('SCEN-2095: 削除済み状態の課題に対して権限判定がエラーになる', () => {
    // Arrange: 削除済み状態の課題IDと一般ユーザー権限情報を準備
    const deletedIssueId = 'ISSUE-001';
    const generalUserId = 'USER-002';
    const generalUserRole = 'engineer';
    const targetTeamId = 'TEAM-001';

    const input = {
      userId: generalUserId,
      userRole: generalUserRole,
      userTeamId: targetTeamId,
      targetDataType: 'issue' as const,
      targetTeamId: targetTeamId,
      requestedOperation: 'view' as const,
      issueId: deletedIssueId,
      issueStatus: 'deleted',
    };

    // Act & Assert: 削除済み状態の課題に対する権限判定時にエラーが発生することを確認
    expect(() => evaluateDataAccessPermission(input)).toThrow(/削除済み/);
  });
});