import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';
import { type AccessPermissionRequest, type AccessPermissionResult } from '../../src/logic/access-control-and-permissions';

describe('朝会報告管理システム - アクセス制御と権限管理', () => {
  test('SCEN-272: [edge] システム定義にない操作が要求されたときに不正な操作エラーを返す', () => {
    // Arrange
    const request: AccessPermissionRequest = {
      userId: 'user-001',
      resourceType: 'report',
      operation: 'approve' as any, // システム定義にない操作
      targetTeamId: null,
      confidentialityLevel: 'internal',
    };

    // Mock the logger to capture warn level outputs
    const warnLogs: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      warnLogs.push(args.join(' '));
    };

    try {
      // Act
      const result: AccessPermissionResult = judgeAccessPermission(request);

      // Assert
      expect(result.isPermitted).toBe(false);
      expect(result.userRole).toBe('engineer');
      expect(result.denialReason).toBe('不正な操作が要求されました。サポートにお問い合わせください');
      expect(result.applicableDataFilters).toBeNull();

      // Verify WARN level log output contains the expected message
      const warnMessageFound = warnLogs.some(
        (log) => log.includes('不正な操作が要求されました。サポートにお問い合わせください')
      );
      expect(warnMessageFound).toBe(true);
    } finally {
      // Restore console.warn
      console.warn = originalWarn;
    }
  });
});