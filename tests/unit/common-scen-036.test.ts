import { listAvailableTeams } from "../../src/logic/team-member-selection";

describe("Team Member Selection - List Available Teams", () => {
  // SCEN-036
  test("should throw error when no available teams exist for user", () => {
    const input = {
      userId: "user-no-permission",
      includeInactive: false,
    };

    expect(() => listAvailableTeams(input)).toThrow(/選択可能なチームが見つかりません/);
  });
});