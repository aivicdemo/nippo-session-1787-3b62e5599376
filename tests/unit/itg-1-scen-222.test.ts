import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssuesFromReports, type ExtractAndRankIssuesInput, type RankedIssueList, type Report } from '../../src/logic/issue-extraction-and-ranking';

describe('Issue Extraction and Ranking', () => {
  // SCEN-222: [edge] 複数の日報から課題キーワードを自動抽出し、発生頻度と影響度に基づいて優先度スコアを計算して、優先度別に順序付けされた課題一覧を生成する。 - 最小発生回数の閾値が0以下のときという明示された境界条件で最小発生回数は1以上である必要があります。1に設定します
  test('should clamp minimumConfidenceThreshold to 1 when input is 0 or negative', () => {
    const now = new Date('2024-01-15T10:00:00Z');
    const thirtyDaysAgo = new Date('2023-12-16T10:00:00Z');

    const reports: Report[] = [
      {
        reportId: 'report-001',
        reportDate: now,
        issueText: 'バグが発生しており対応が必要です',
        teamId: 'team-001'
      },
      {
        reportId: 'report-002',
        reportDate: now,
        issueText: 'バグの修正と遅延対応に追われています',
        teamId: 'team-002'
      },
      {
        reportId: 'report-003',
        reportDate: now,
        issueText: 'リソース不足により遅延が発生しました',
        teamId: 'team-001'
      }
    ];

    const input: ExtractAndRankIssuesInput = {
      reports: reports,
      analysisStartDate: thirtyDaysAgo,
      analysisEndDate: now,
      minimumConfidenceThreshold: 0
    };

    const result: RankedIssueList = extractAndRankIssuesFromReports(input);

    expect(result).toBeDefined();
    expect(result.issues).toBeInstanceOf(Array);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.totalIssueCount).toBeGreaterThan(0);
    expect(result.analysisTimestamp).toBeInstanceOf(Date);

    // すべての課題の信頼度スコアが1以上であることを確認
    for (const issue of result.issues) {
      expect(issue.confidenceScore).toBeGreaterThanOrEqual(1);
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
      expect(['高', '中', '低']).toContain(issue.priorityRank);
    }

    // totalIssueCountはフィルタリング後の件数を反映
    expect(result.totalIssueCount).toBe(result.issues.length);
    expect(result.lowConfidenceIssueCount).toBeGreaterThanOrEqual(0);
  });
});