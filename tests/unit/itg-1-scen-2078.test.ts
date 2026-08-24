import { describe, test, expect } from "@jest/globals";
import { evaluateDataAccessPermission } from "../../src/logic/auth-authorization";
import type { DataAccessEvaluationInput, DataAccessPermissionResult } from "../../src/logic/auth-authorization";

describe("ロールベース権限判定機能", () => {
  // SCEN-2078
  test("同じ入力で権限判定を2回実行しても同じ結果が返される", () => {
    const evaluationInput: DataAccessEvaluationInput = {
      userId: "user-001",
      userRole: "engineer",
      userTeamId: "team-dev-01",
      targetDataType: "report",
      targetTeamId: "team-dev-01",
      requestedOperation: "view",
    };

    const result1: DataAccessPermissionResult = evaluateDataAccessPermission(evaluationInput);
    const result2: DataAccessPermissionResult = evaluateDataAccessPermission(evaluationInput);

    expect(result1.isPermitted).toBe(result2.isPermitted);
    expect(result1.permittedOperations).toEqual(result2.permittedOperations);
    expect(result1.dataScope).toBe(result2.dataScope);
    expect(result1.decryptionKey).toBe(result2.decryptionKey);

    expect(result1).not.toBe(result2);
  });
});