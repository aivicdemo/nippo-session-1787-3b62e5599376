import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type {
  WeeklyAnalysisReportInput,
  ExtractedIssueData,
} from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成 - 優先度スコア検証', () => {
  // SCEN-1577
  test('優先度スコアに必須フィールド（スコア値）が欠落しているときエラーになる', () => {
    const aggregationStartDate = '2024-01-08';
    const aggregationEndDate = '2024-01-14';
    const teamId = 'team-001';

    const extractedIssuesWithMissingScore: ExtractedIssueData[] = [
      {
        issueKeyword: '通信障害',
        occurrenceCount: 3,
        impactScore: 85,
        priorityScore: undefined as any,
        lastOccurredDate: '2024-01-14',
      },
      {
        issueKeyword: 'データベース遅延',
        occurrenceCount: 2,
        impactScore: 72,
        priorityScore: 78,
        lastOccurredDate: '2024-01-13',
      },
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate,
      aggregationEndDate,
      extractedIssues: extractedIssuesWithMissingScore,
      teamId,
    };

    expect(() => generateWeeklyAnalysisReport(input)).toThrow(
      /優先度スコア値|score フィールド|priorityScore/
    );
  });
});