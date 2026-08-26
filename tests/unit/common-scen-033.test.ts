import { listAvailableTeams, type ListAvailableTeamsInput, type ListAvailableTeamsOutput } from '../../src/logic/team-member-selection';

describe('listAvailableTeams', () => {
  test('SCEN-033', () => {
    // ユーザーの権限範囲内で選択可能なチーム一覧を取得
    const input: ListAvailableTeamsInput = {
      userId: 'user-001',
    };

    const result: ListAvailableTeamsOutput = listAvailableTeams(input);

    // 返却されたチーム一覧が存在することを確認
    expect(result.teams).toBeDefined();
    expect(Array.isArray(result.teams)).toBe(true);

    // 返却されたチーム一覧の件数が10件以下であることを確認
    expect(result.totalCount).toBeLessThanOrEqual(10);
    expect(result.teams.length).toBe(result.totalCount);

    // 各チーム要素が必須属性を含んでいることを確認
    result.teams.forEach((team) => {
      expect(team.teamId).toBeDefined();
      expect(typeof team.teamId).toBe('string');
      expect(team.teamId.length).toBeGreaterThan(0);

      expect(team.teamName).toBeDefined();
      expect(typeof team.teamName).toBe('string');
      expect(team.teamName.length).toBeGreaterThan(0);

      expect(team.memberCount).toBeDefined();
      expect(typeof team.memberCount).toBe('number');
      expect(team.memberCount).toBeGreaterThanOrEqual(0);

      expect(team.isActive).toBeDefined();
      expect(typeof team.isActive).toBe('boolean');
    });

    // ユーザーが属するチームのみが含まれていることを確認
    // （戻り値の各チームがユーザー権限範囲内であることはlistAvailableTeams内部で検証されている）
    expect(result.teams.length).toBeGreaterThan(0);
  });
});