import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type {
  WeeklyAnalysisReportInput,
  ExtractedIssueData,
} from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1582
  test('should throw error when occurrence frequency is negative', () => {
    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2026-08-18',
      aggregationEndDate: '2026-08-24',
      extractedIssues: [
        {
          issueKeyword: 'ログイン機能バグ',
          occurrenceCount: -5,
          impactScore: 75,
        } as ExtractedIssueData,
      ],
      teamId: 'team-001',
    };

    expect(() => generateWeeklyAnalysisReport(input)).toThrow(
      /発生頻度は0以上の整数である必要があります/
    );
  });
});