import { describe, test, expect } from "@jest/globals";
import { determineDashboardAccessControl } from "../../src/logic/manager-dashboard";
import type {
  DashboardAccessControlInput,
  DashboardAccessControlOutput,
} from "../../src/logic/manager-dashboard";

describe("課題の優先度を色分けで表示するダッシュボード機能", () => {
  // SCEN-994: 職務権限に基づくダッシュボード表示制御 - 部長権限未満のユーザーが全チーム進捗データへのアクセス権を持たない直下境界値
  test("should deny access to all team data for non-manager roles and allow for manager and above", () => {
    // 一般部員（権限レベル1）がfull_accessを要求
    const engineerInput: DashboardAccessControlInput = {
      userId: "user-001",
      userRole: "engineer",
      userTeamId: "team-alpha",
      requestedAccessLevel: "full",
    };

    const engineerOutput: DashboardAccessControlOutput =
      determineDashboardAccessControl(engineerInput);

    expect(engineerOutput.isAccessGranted).toBe(false);
    expect(engineerOutput.grantedAccessLevel).toBe("self_only");
    expect(engineerOutput.visibleDataScope.canViewAllTeams).toBe(false);
    expect(engineerOutput.visibleDataScope.canViewTeamData).toBe(false);
    expect(engineerOutput.visibleDataScope.canViewSelfDataOnly).toBe(true);
    expect(engineerOutput.visibleDataScope.allowedTeamIds).toEqual(["team-alpha"]);
    expect(engineerOutput.editableFeatures.canEditIssuePriority).toBe(false);
    expect(engineerOutput.editableFeatures.canEditChallengeStatus).toBe(false);
    expect(engineerOutput.editableFeatures.canSendReminders).toBe(false);
    expect(engineerOutput.editableFeatures.canExportReports).toBe(false);
    expect(engineerOutput.denialReason).toMatch(/権限|アクセス権/);

    // 課長（権限レベル3）がfull_accessを要求
    const supervisorInput: DashboardAccessControlInput = {
      userId: "user-002",
      userRole: "pm",
      userTeamId: "team-beta",
      requestedAccessLevel: "full",
    };

    const supervisorOutput: DashboardAccessControlOutput =
      determineDashboardAccessControl(supervisorInput);

    expect(supervisorOutput.isAccessGranted).toBe(true);
    expect(supervisorOutput.grantedAccessLevel).toBe("team_only");
    expect(supervisorOutput.visibleDataScope.canViewAllTeams).toBe(false);
    expect(supervisorOutput.visibleDataScope.canViewTeamData).toBe(true);
    expect(supervisorOutput.visibleDataScope.canViewSelfDataOnly).toBe(false);
    expect(supervisorOutput.visibleDataScope.allowedTeamIds).toContain("team-beta");
    expect(supervisorOutput.editableFeatures.canEditIssuePriority).toBe(true);
    expect(supervisorOutput.editableFeatures.canEditChallengeStatus).toBe(true);
    expect(supervisorOutput.editableFeatures.canSendReminders).toBe(true);
    expect(supervisorOutput.editableFeatures.canExportReports).toBe(false);
    expect(supervisorOutput.denialReason).toBeNull();

    // 部長（権限レベル4）がfull_accessを要求
    const managerInput: DashboardAccessControlInput = {
      userId: "user-003",
      userRole: "manager",
      userTeamId: "team-gamma",
      requestedAccessLevel: "full",
    };

    const managerOutput: DashboardAccessControlOutput =
      determineDashboardAccessControl(managerInput);

    expect(managerOutput.isAccessGranted).toBe(true);
    expect(managerOutput.grantedAccessLevel).toBe("full");
    expect(managerOutput.visibleDataScope.canViewAllTeams).toBe(true);
    expect(managerOutput.visibleDataScope.canViewTeamData).toBe(true);
    expect(managerOutput.visibleDataScope.canViewSelfDataOnly).toBe(false);
    expect(managerOutput.visibleDataScope.allowedTeamIds.length).toBeGreaterThan(0);
    expect(managerOutput.editableFeatures.canEditIssuePriority).toBe(true);
    expect(managerOutput.editableFeatures.canEditChallengeStatus).toBe(true);
    expect(managerOutput.editableFeatures.canSendReminders).toBe(true);
    expect(managerOutput.editableFeatures.canExportReports).toBe(true);
    expect(managerOutput.denialReason).toBeNull();

    // 経営層（権限レベル5）がfull_accessを要求
    const executiveInput: DashboardAccessControlInput = {
      userId: "user-004",
      userRole: "executive",
      userTeamId: "team-delta",
      requestedAccessLevel: "full",
    };

    const executiveOutput: DashboardAccessControlOutput =
      determineDashboardAccessControl(executiveInput);

    expect(executiveOutput.isAccessGranted).toBe(true);
    expect(executiveOutput.grantedAccessLevel).toBe("full");
    expect(executiveOutput.visibleDataScope.canViewAllTeams).toBe(true);
    expect(executiveOutput.visibleDataScope.canViewTeamData).toBe(true);
    expect(executiveOutput.visibleDataScope.canViewSelfDataOnly).toBe(false);
    expect(executiveOutput.editableFeatures.canEditIssuePriority).toBe(true);
    expect(executiveOutput.editableFeatures.canEditChallengeStatus).toBe(true);
    expect(executiveOutput.editableFeatures.canSendReminders).toBe(true);
    expect(executiveOutput.editableFeatures.canExportReports).toBe(true);
    expect(executiveOutput.denialReason).toBeNull();
  });
});