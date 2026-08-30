import { verifyAdoptionReadiness, type InitialReportData } from "../../src/logic/adoption-training-management";

describe("朝会報告管理システム", () => {
  // SCEN-603
  test("提出されたエンジニア人数が全体人数を超えるときはエラーをスローする", () => {
    const submissionDeadline = new Date("2025-01-15T09:00:00Z");
    
    const initialReportDataset: InitialReportData[] = [
      {
        reportId: "report_001",
        engineerId: "eng_001",
        submittedAt: new Date("2025-01-15T08:00:00Z"),
        reportContent: "Day 1 report content",
      },
      {
        reportId: "report_002",
        engineerId: "eng_002",
        submittedAt: new Date("2025-01-15T08:05:00Z"),
        reportContent: "Day 2 report content",
      },
      {
        reportId: "report_003",
        engineerId: "eng_003",
        submittedAt: new Date("2025-01-15T08:10:00Z"),
        reportContent: "Day 3 report content",
      },
      {
        reportId: "report_004",
        engineerId: "eng_004",
        submittedAt: new Date("2025-01-15T08:15:00Z"),
        reportContent: "Day 4 report content",
      },
      {
        reportId: "report_005",
        engineerId: "eng_005",
        submittedAt: new Date("2025-01-15T08:20:00Z"),
        reportContent: "Day 5 report content",
      },
      {
        reportId: "report_006",
        engineerId: "eng_006",
        submittedAt: new Date("2025-01-15T08:25:00Z"),
        reportContent: "Day 6 report content",
      },
      {
        reportId: "report_007",
        engineerId: "eng_007",
        submittedAt: new Date("2025-01-15T08:30:00Z"),
        reportContent: "Day 7 report content",
      },
      {
        reportId: "report_008",
        engineerId: "eng_008",
        submittedAt: new Date("2025-01-15T08:35:00Z"),
        reportContent: "Day 8 report content",
      },
      {
        reportId: "report_009",
        engineerId: "eng_009",
        submittedAt: new Date("2025-01-15T08:40:00Z"),
        reportContent: "Day 9 report content",
      },
      {
        reportId: "report_010",
        engineerId: "eng_010",
        submittedAt: new Date("2025-01-15T08:45:00Z"),
        reportContent: "Day 10 report content",
      },
      {
        reportId: "report_011",
        engineerId: "eng_011",
        submittedAt: new Date("2025-01-15T08:50:00Z"),
        reportContent: "Day 11 report content",
      },
      {
        reportId: "report_012",
        engineerId: "eng_012",
        submittedAt: new Date("2025-01-15T08:55:00Z"),
        reportContent: "Day 12 report content",
      },
      {
        reportId: "report_013",
        engineerId: "eng_013",
        submittedAt: new Date("2025-01-15T09:00:00Z"),
        reportContent: "Day 13 report content",
      },
      {
        reportId: "report_014",
        engineerId: "eng_014",
        submittedAt: new Date("2025-01-15T09:05:00Z"),
        reportContent: "Day 14 report content",
      },
      {
        reportId: "report_015",
        engineerId: "eng_015",
        submittedAt: new Date("2025-01-15T09:10:00Z"),
        reportContent: "Day 15 report content",
      },
    ];
    
    const totalEngineerCount = 10;
    
    expect(() =>
      verifyAdoptionReadiness({
        initialReportDataset,
        totalEngineerCount,
        submissionDeadline,
      })
    ).toThrow(/全体人数を超えています/);
  });
});