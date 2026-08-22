import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-181: sendUnsubmittedReminder processes initial submission data collection and quality assessment", async () => {
    const submission_timestamp_1 = new Date("2024-01-15T08:00:00Z");
    const submission_timestamp_2 = new Date("2024-01-15T08:15:00Z");
    const submission_timestamp_3 = new Date("2024-01-15T08:30:00Z");
    const submission_timestamp_4 = new Date("2024-01-15T08:45:00Z");
    const submission_timestamp_5 = new Date("2024-01-15T09:00:00Z");
    const submission_timestamp_6 = new Date("2024-01-15T09:15:00Z");
    const submission_timestamp_7 = new Date("2024-01-15T09:30:00Z");
    const submission_timestamp_8 = new Date("2024-01-15T09:45:00Z");

    const initial_report_dataset = [
      {
        engineer_id: "E001",
        submission_status: "submitted",
        submission_datetime: submission_timestamp_1,
        yesterday_work: "Completed API integration for dashboard",
        today_plan: "Start unit test implementation",
        current_issues: "Database connection timeout during load test",
      },
      {
        engineer_id: "E002",
        submission_status: "submitted",
        submission_datetime: submission_timestamp_2,
        yesterday_work: "Fixed UI bugs in report page",
        today_plan: "Implement responsive design",
        current_issues: "CSS styling conflict with third-party library",
      },
      {
        engineer_id: "E003",
        submission_status: "submitted",
        submission_datetime: submission_timestamp_3,
        yesterday_work: "Code review for feature branch",
        today_plan: "Deploy to staging environment",
        current_issues: "Deployment pipeline intermittent failure",
      },
      {
        engineer_id: "E004",
        submission_status: "submitted",
        submission_datetime: submission_timestamp_4,
        yesterday_work: "Infrastructure setup completed",
        today_plan: "Configure monitoring and alerting",
        current_issues: "Missing documentation for deployment process",
      },
      {
        engineer_id: "E005",
        submission_status: "submitted",
        submission_datetime: submission_timestamp_5,
        yesterday_work: "Documentation update and review",
        today_plan: "Prepare training materials",
        current_issues: "Team members unfamiliar with new workflow",
      },
      {
        engineer_id: "E006",
        submission_status: "submitted",
        submission_datetime: submission_timestamp_6,
        yesterday_work: "Performance optimization in search module",
        today_plan: "Conduct load testing",
        current_issues: "Memory leak detected in background service",
      },
      {
        engineer_id: "E007",
        submission_status: "submitted",
        submission_datetime: submission_timestamp_7,
        yesterday_work: "Security audit of authentication module",
        today_plan: "Implement security patch",
        current_issues: "SQL injection vulnerability in legacy code",
      },
      {
        engineer_id: "E008",
        submission_status: "submitted",
        submission_datetime: submission_timestamp_8,
        yesterday_work: "Completed data migration from old system",
        today_plan: "Verify data integrity",
        current_issues: "Data inconsistency in user records",
      },
      {
        engineer_id: "E009",
        submission_status: "not_submitted",
        submission_datetime: null,
        yesterday_work: null,
        today_plan: null,
        current_issues: null,
      },
      {
        engineer_id: "E010",
        submission_status: "not_submitted",
        submission_datetime: null,
        yesterday_work: null,
        today_plan: null,
        current_issues: null,
      },
    ];

    const mock_ai_client = {
      analyzeInitialReportData: async (
        reports: typeof initial_report_dataset
      ) => {
        const submitted_reports = reports.filter(
          (r) => r.submission_status === "submitted"
        );
        const unsubmitted_count = reports.filter(
          (r) => r.submission_status === "not_submitted"
        ).length;

        const quality_assessments = submitted_reports.map((report) => {
          const completeness_score = 100;
          const business_relevance_score = 85;
          const specificity_score =
            report.current_issues && report.current_issues.length > 50
              ? 90
              : 75;
          const overall_quality_score = Math.round(
            (completeness_score + business_relevance_score + specificity_score) /
              3
          );

          return {
            engineer_id: report.engineer_id,
            completeness: completeness_score,
            business_relevance: business_relevance_score,
            specificity: specificity_score,
            overall_quality: overall_quality_score,
            quality_tier:
              overall_quality_score >= 80
                ? "high"
                : overall_quality_score >= 70
                  ? "medium"
                  : "low",
          };
        });

        const high_quality_count = quality_assessments.filter(
          (q) => q.overall_quality >= 80
        ).length;
        const medium_quality_count = quality_assessments.filter(
          (q) =>
            q.overall_quality >= 70 && q.overall_quality < 80
        ).length;

        return {
          total_engineers: reports.length,
          submitted_count: submitted_reports.length,
          unsubmitted_count: unsubmitted_count,
          submission_rate: parseFloat(
            ((submitted_reports.length / reports.length) * 100).toFixed(1)
          ),
          quality_assessments: quality_assessments,
          quality_distribution: {
            high_quality: high_quality_count,
            medium_quality: medium_quality_count,
            low_quality:
              submitted_reports.length -
              high_quality_count -
              medium_quality_count,
          },
          analysis_timestamp: new Date("2024-01-15T10:00:00Z"),
          analysis_completed: true,
          audit_log_entry: {
            action: "action_04_analysis",
            timestamp: new Date("2024-01-15T10:00:00Z"),
            target_record_count: 10,
            submitted_record_count: 8,
            status: "completed",
          },
        };
      },
    };

    const result = await sendUnsubmittedReminder(
      initial_report_dataset,
      mock_ai_client
    );

    expect(result).toBeDefined();
    expect(result.total_engineers).toBe(10);
    expect(result.submitted_count).toBe(8);
    expect(result.unsubmitted_count).toBe(2);
    expect(result.submission_rate).toBe(80.0);

    expect(result.quality_assessments).toHaveLength(8);
    result.quality_assessments.forEach((assessment) => {
      expect(assessment.completeness).toBe(100);
      expect(assessment.business_relevance).toBe(85);
      expect(assessment.specificity).toBeGreaterThanOrEqual(75);
      expect(assessment.overall_quality).toBeGreaterThanOrEqual(80);
      expect(["high", "medium", "low"]).toContain(assessment.quality_tier);
    });

    expect(result.quality_distribution.high_quality).toBe(8);
    expect(result.quality_distribution.medium_quality).toBe(0);
    expect(result.quality_distribution.low_quality).toBe(0);

    expect(result.analysis_completed).toBe(true);
    expect(result.audit_log_entry).toBeDefined();
    expect(result.audit_log_entry.action).toBe("action_04_analysis");
    expect(result.audit_log_entry.timestamp).toEqual(
      new Date("2024-01-15T10:00:00Z")
    );
    expect(result.audit_log_entry.target_record_count).toBe(10);
    expect(result.audit_log_entry.submitted_record_count).toBe(8);
    expect(result.audit_log_entry.status).toBe("completed");
  });
});