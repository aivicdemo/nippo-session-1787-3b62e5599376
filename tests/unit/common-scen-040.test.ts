import { listTeamMembers } from "../../src/logic/team-member-selection";

describe("team-member-selection", () => {
  // SCEN-040
  test("should throw error when teamId is empty string", () => {
    const input = {
      teamId: "",
    };

    expect(() => listTeamMembers(input)).toThrow(/チームID/);
  });
});