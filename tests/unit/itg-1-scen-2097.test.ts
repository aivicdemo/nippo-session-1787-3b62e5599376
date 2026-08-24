import { describe, test, expect, beforeEach } from '@jest/globals';
import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';
import type {
  DataAccessEvaluationInput,
  DataAccessPermissionResult,
} from '../../src/logic/auth-authorization';

describe('evaluateDataAccessPermission: Role-based authorization for issue edit', () => {
  test('SCEN-2097: Manager with exact edit permission on own team issue allows edit operation', () => {
    // Arrange: Setup input parameters for a development manager attempting to edit an issue
    // from their own team. Manager has exactly the edit permission (not inherited from higher roles).
    const evaluationInput: DataAccessEvaluationInput = {
      userId: 'mgr-001',
      userRole: 'manager',
      userTeamId: 'team-dev-001',
      targetDataType: 'issue',
      targetTeamId: 'team-dev-001',
      requestedOperation: 'edit',
    };

    // Act: Call the permission evaluation function with manager context
    const result: DataAccessPermissionResult =
      evaluateDataAccessPermission(evaluationInput);

    // Assert: Verify that permission is granted for edit operation on own team data
    expect(result.isPermitted).toBe(true);

    // Assert: Verify that 'edit' operation is included in permitted operations
    expect(result.permittedOperations).toContain('edit');

    // Assert: Verify that data scope is limited to own team
    expect(result.dataScope).toBe('own_team');

    // Assert: Verify that decryption key is provided when permission is granted
    expect(result.decryptionKey).not.toBeNull();
    expect(typeof result.decryptionKey).toBe('string');
    expect(result.decryptionKey!.length).toBeGreaterThan(0);

    // Assert: Verify that other operations are also available to manager role
    expect(result.permittedOperations).toContain('view');
  });
});