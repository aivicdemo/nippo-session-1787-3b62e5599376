import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能 - 複数チーム所属時の課題表示', () => {
  // SCEN-2101
  test('PMが複数チームに所属する場合、所属する全チームの課題データが表示される', () => {
    // Arrange
    const input = {
      userId: 'PM001',
      userRole: 'manager' as const,
      userTeamId: 'TeamA',
      targetDataType: 'issue' as const,
      targetTeamId: 'TeamA',
      requestedOperation: 'view' as const,
    };

    // Act
    const result = evaluateDataAccessPermission(input);

    // Assert
    expect(result.isPermitted).toBe(true);
    expect(result.permittedOperations).toContain('view');
    expect(result.dataScope).toBe('own_team');
    expect(result.decryptionKey).not.toBeNull();
  });
});