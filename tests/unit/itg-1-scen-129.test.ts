import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';

describe('朝会報告管理システム - アクセス制御', () => {
  test('SCEN-129: ユーザーコンテキストから抽出された役割が無効または未定義の場合、InvalidRoleError例外をスロー', () => {
    const userId = 'user-001';
    const resourceType = 'report' as const;
    const operation = 'view' as const;
    const targetTeamId = null;
    const confidentialityLevel = 'internal' as const;

    expect(() => {
      judgeAccessPermission({
        userId,
        resourceType,
        operation,
        targetTeamId,
        confidentialityLevel,
      });
    }).toThrow(/ユーザーの役割が無効です。システム管理者に連絡してください。/);
  });
});