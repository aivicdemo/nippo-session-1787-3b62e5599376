import { filterDisplayContentByRole } from '../../src/logic/access-control-and-permissions';

describe('filterDisplayContentByRole', () => {
  // SCEN-133: [error] ユーザーの役割に応じて、ダッシュボード・レポート・日報データの表示対象項目を制限し、閲覧可能なデータセットを返す - ユーザーの役割が要求されたデータへのアクセス権を持たない場合のときこのデータへのアクセス権がありません。となる
  test('should throw DataAccessViolationError when engineer tries to access data from different team', () => {
    const userContext = {
      userId: 'user-001',
      role: 'engineer' as const,
      teamId: 'team-A',
      permissionLevel: 2,
    };

    const contentType = 'dashboard' as const;
    const targetTeamId = 'team-B';
    const dataSet = {
      report_id: '001',
      summary: 'text',
      budget: 50000,
      revenue: 100000,
    };

    expect(() =>
      filterDisplayContentByRole(
        userContext,
        contentType,
        targetTeamId,
        dataSet
      )
    ).toThrow(/このデータへのアクセス権がありません/);
  });
});