import { filterDisplayContentByRole, type FilteredDisplayContent } from "../../src/logic/access-control-and-permissions";

describe("filterDisplayContentByRole", () => {
  test("SCEN-131: エンジニアロールのダッシュボード表示時に、許可された項目のみをフィルタリングして返す", () => {
    const userContext = {
      userId: "eng001",
      role: "engineer" as const,
      teamId: "team-A",
      permissionLevel: 0,
    };

    const contentType = "dashboard" as const;
    const targetTeamId = "team-A";
    const dataSet = {
      reportCount: 5,
      budgetAmount: 100000,
      teamMembersDetails: ["member1", "member2"],
      issueKeywords: ["keyword1"],
      performanceScore: 85,
      internalNotes: "confidential",
    };

    const result = filterDisplayContentByRole(
      userContext,
      contentType,
      targetTeamId,
      dataSet
    );

    const expectedResult: FilteredDisplayContent = {
      visibleFields: ["reportCount", "issueKeywords"],
      filteredData: {
        reportCount: 5,
        issueKeywords: ["keyword1"],
      },
      accessLevel: "read_only",
      hiddenFieldsCount: 4,
    };

    expect(result.visibleFields).toEqual(expectedResult.visibleFields);
    expect(result.filteredData).toEqual(expectedResult.filteredData);
    expect(result.accessLevel).toBe(expectedResult.accessLevel);
    expect(result.hiddenFieldsCount).toBe(expectedResult.hiddenFieldsCount);
  });
});