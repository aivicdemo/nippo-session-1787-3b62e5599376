import { listAvailableTeams, type ListAvailableTeamsInput, type ListAvailableTeamsOutput } from "../../src/logic/team-member-selection";

describe("team-member-selection", () => {
  // SCEN-033
  test("should return user's available teams with correct structure and max 10 teams", () => {
    const input: ListAvailableTeamsInput = {
      userId: "user-001",
    };

    const result: ListAvailableTeamsOutput = listAvailableTeams(input);

    // Verify each team has required fields: teamId, teamName, memberCount
    result.teams.forEach((team) => {
      expect(team).toHaveProperty("teamId");
      expect(team).toHaveProperty("teamName");
      expect(team).toHaveProperty("memberCount");
      expect(typeof team.teamId).toBe("string");
      expect(typeof team.teamName).toBe("string");
      expect(typeof team.memberCount).toBe("number");
    });

    // Verify only teams user belongs to are included
    const expectedTeamIds = ["team-001", "team-002", "team-003"];
    const returnedTeamIds = result.teams.map((team) => team.teamId);
    expect(returnedTeamIds).toEqual(expectedTeamIds);

    // Verify total count does not exceed 10
    expect(result.totalCount).toBeLessThanOrEqual(10);
    expect(result.totalCount).toBe(result.teams.length);
    expect(result.totalCount).toBe(3);
  });
});