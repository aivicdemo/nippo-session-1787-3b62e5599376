import { runTx8Imp1Agent } from "../../src/agents/tx-8-imp-1/orchestrator";

describe("ボトルネック変化パターン可視化レポート生成機能", () => {
  test("SCEN-1996: 課題キーワードが空文字列のとき、レポート生成がエラーになる", () => {
    const fakeAiClient: jest.Mocked<any> = {
      analyzeRecurringPatterns: jest.fn(),
      generateVisualizationGraphs: jest.fn(),
      classifyTimeSeriesPattern: jest.fn(),
      calculatePriorityScore: jest.fn(),
    };

    const input = {
      analysisStartDate: "2024-01-01T00:00:00Z",
      analysisEndDate: "2024-01-31T23:59:59Z",
      teamIds: ["team-001"],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: "manager-001",
      issueKeyword: "",
    };

    expect(() => runTx8Imp1Agent(input, fakeAiClient)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining("課題キーワードが空文字列です"),
        code: "INVALID_KEYWORD_EMPTY",
        statusCode: 400,
      })
    );

    expect(fakeAiClient.analyzeRecurringPatterns).not.toHaveBeenCalled();
    expect(fakeAiClient.generateVisualizationGraphs).not.toHaveBeenCalled();
    expect(fakeAiClient.classifyTimeSeriesPattern).not.toHaveBeenCalled();
    expect(fakeAiClient.calculatePriorityScore).not.toHaveBeenCalled();
  });
});