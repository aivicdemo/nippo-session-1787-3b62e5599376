import { describe, test, expect, beforeEach } from "@jest/globals";
import { determineDashboardAccessControl } from "../../src/logic/manager-dashboard";

describe("Dashboard Access Control - Permission Level Selection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1002
  test("should select minimum permission level from multiple assigned permissions when multiple permissions are sorted in ascending order", () => {
    // Setup: Multiple permissions with different levels
    const multiplePermissions = [
      { permissionId: "perm_a", level: 3, roleName: "权限A" },
      { permissionId: "perm_b", level: 1, roleName: "权限B" },
      { permissionId: "perm_c", level: 2, roleName: "权限C" },
    ];

    // Sort permissions in ascending order by level
    const sortedPermissions = multiplePermissions.sort(
      (a, b) => a.level - b.level
    );

    // Input: User with sorted permissions (level 1 should be selected)
    const userContext: DashboardAccessControlInput = {
      userId: "user_001",
      userRole: "manager",
      userTeamId: "team_001",
      requestedAccessLevel: "full",
    };

    // Mock user permissions - return sorted by level ascending
    const mockUserPermissions = sortedPermissions;

    // The determineDashboardAccessControl should select minimum level (level 1)
    const result = determineDashboardAccessControl(userContext);

    // Verify that the selected permission is at level 1 (minimum)
    expect(result.isAccessGranted).toBe(true);
    expect(result.grantedAccessLevel).toBe("team_only");
    expect(result.visibleDataScope.canViewAllTeams).toBe(false);
    expect(result.visibleDataScope.canViewTeamData).toBe(true);
    expect(result.visibleDataScope.canViewSelfDataOnly).toBe(false);
    expect(result.visibleDataScope.allowedTeamIds).toEqual(["team_001"]);
    expect(result.editableFeatures.canEditIssuePriority).toBe(false);
    expect(result.editableFeatures.canEditChallengeStatus).toBe(false);
    expect(result.editableFeatures.canSendReminders).toBe(true);
    expect(result.editableFeatures.canExportReports).toBe(false);
    expect(result.denialReason).toBeNull();
  });
});

interface DashboardAccessControlInput {
  userId: string;
  userRole: "manager" | "pm" | "engineer" | "executive";
  userTeamId: string;
  requestedAccessLevel: "full" | "team_only" | "self_only";
}