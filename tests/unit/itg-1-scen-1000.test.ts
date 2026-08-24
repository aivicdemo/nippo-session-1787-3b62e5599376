import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { determineDashboardAccessControl } from "../../src/logic/manager-dashboard";

describe("課題の優先度を色分けで表示するダッシュボード機能", () => {
  // SCEN-1000: [edge] 職務権限に基づくダッシュボード表示制御 - 権限が未定義またはnullの場合に参照のみビューが描画される
  test("権限がnullの場合、読み取り専用ビューのみが描画される", () => {
    const userContext = {
      userId: "user-001",
      userRole: null as any,
      teamId: "team-001",
    };

    const result = determineDashboardAccessControl({
      userId: userContext.userId,
      userRole: userContext.userRole,
      userTeamId: userContext.teamId,
      requestedAccessLevel: "self_only",
    });

    expect(result.isAccessGranted).toBe(true);
    expect(result.grantedAccessLevel).toBe("self_only");
    expect(result.visibleDataScope.canViewAllTeams).toBe(false);
    expect(result.visibleDataScope.canViewTeamData).toBe(false);
    expect(result.visibleDataScope.canViewSelfDataOnly).toBe(true);
    expect(result.visibleDataScope.allowedTeamIds).toEqual([userContext.teamId]);
    expect(result.editableFeatures.canEditIssuePriority).toBe(false);
    expect(result.editableFeatures.canEditChallengeStatus).toBe(false);
    expect(result.editableFeatures.canSendReminders).toBe(false);
    expect(result.editableFeatures.canExportReports).toBe(false);
    expect(result.denialReason).toBeNull();
  });
});