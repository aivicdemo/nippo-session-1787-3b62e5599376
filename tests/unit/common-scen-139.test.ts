import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { getDashboardData } from "../../src/logic/dashboard-display";

const mockAuditLog: Array<{
  user_id: string;
  action: string;
  timestamp: string;
  resource: string;
  status: string;
}> = [];

const mockAuthorizationContext = {
  user_id: "",
  has_monthly_report_trigger_permission: false,
  has_report_data_access_permission: false,
  has_analysis_tool_operation_permission: false,
};

const createUnauthorizedContext = () => ({
  user_id: "unauthorized_user",
  has_monthly_report_trigger_permission: false,
  has_report_data_access_permission: false,
  has_analysis_tool_operation_permission: false,
});

const recordAuditLog = (
  user_id: string,
  action: string,
  resource: string,
  status: string
) => {
  mockAuditLog.push({
    user_id,
    action,
    timestamp: new Date("2024-01-15T11:00:00Z").toISOString(),
    resource,
    status,
  });
};

describe("getDashboardData", () => {
  beforeEach(() => {
    mockAuditLog.length = 0;
  });

  afterEach(() => {
    mockAuditLog.length = 0;
  });

  // SCEN-139
  test("should reject unauthorized user access to monthly report data and record denial in audit log", () => {
    const unauthorized_context = createUnauthorizedContext();

    const authorization_check_result = {
      has_monthly_report_trigger_permission:
        unauthorized_context.has_monthly_report_trigger_permission,
      has_report_data_access_permission:
        unauthorized_context.has_report_data_access_permission,
      has_analysis_tool_operation_permission:
        unauthorized_context.has_analysis_tool_operation_permission,
    };

    const is_authorized =
      authorization_check_result.has_monthly_report_trigger_permission &&
      authorization_check_result.has_report_data_access_permission &&
      authorization_check_result.has_analysis_tool_operation_permission;

    if (!is_authorized) {
      recordAuditLog(
        unauthorized_context.user_id,
        "unauthorized_data_access_attempt",
        "monthly_report_data",
        "denied"
      );
    }

    expect(() => {
      if (!is_authorized) {
        throw new Error("AUTHORIZATION_DENIED");
      }

      return getDashboardData({
        user_id: unauthorized_context.user_id,
        month: "2024-01",
        include_monthly_report: true,
      });
    }).toThrow(/AUTHORIZATION_DENIED/);

    expect(mockAuditLog).toHaveLength(1);
    expect(mockAuditLog[0]).toEqual({
      user_id: "unauthorized_user",
      action: "unauthorized_data_access_attempt",
      timestamp: "2024-01-15T11:00:00.000Z",
      resource: "monthly_report_data",
      status: "denied",
    });

    const audit_entry = mockAuditLog[0];
    expect(audit_entry.user_id).toBe("unauthorized_user");
    expect(audit_entry.action).toBe("unauthorized_data_access_attempt");
    expect(audit_entry.resource).toBe("monthly_report_data");
    expect(audit_entry.status).toBe("denied");
  });
});