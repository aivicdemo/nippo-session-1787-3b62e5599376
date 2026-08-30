import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import { type Report, type RankedIssueList } from '../../src/logic/issue-extraction-and-ranking';

describe('Issue Extraction and Ranking - Edge Case: Unregistered Keywords Exclusion', () => {
  // SCEN-208
  test('should exclude keywords not in the dictionary and count only registered keywords', () => {
    const issueKeywordDictionary = ['バグ', '遅延', 'リソース不足'];
    
    const reports: Report[] = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-10'),
        issueText: 'バグが多発している',
        teamId: 'team-001'
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-11'),
        issueText: 'リソース不足と遅延が同時発生',
        teamId: 'team-001'
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2024-01-12'),
        issueText: 'システム連携の問題',
        teamId: 'team-001'
      },
      {
        reportId: 'report-004',
        reportDate: new Date('2024-01-13'),
        issueText: 'バグが再度検出された',
        teamId: 'team-002'
      },
      {
        reportId: 'report-005',
        reportDate: new Date('2024-01-14'),
        issueText: '遅延が続いている',
        teamId: 'team-002'
      },
      {
        reportId: 'report-006',
        reportDate: new Date('2024-01-15'),
        issueText: 'リソース不足による遅延',
        teamId: 'team-003'
      },
      {
        reportId: 'report-007',
        reportDate: new Date('2024-01-16'),
        issueText: 'バグ対応でリソース不足',
        teamId: 'team-003'
      },
      {
        reportId: 'report-008',
        reportDate: new Date('2024-01-17'),
        issueText: 'サーバー障害と遅延の問題',
        teamId: 'team-004'
      },
      {
        reportId: 'report-009',
        reportDate: new Date('2024-01-18'),
        issueText: 'バグと遅延が並行して発生',
        teamId: 'team-005'
      },
      {
        reportId: 'report-010',
        reportDate: new Date('2024-01-19'),
        issueText: 'ネットワーク接続エラー',
        teamId: 'team-006'
      }
    ];

    const analysisStartDate = new Date('2023-12-20');
    const analysisEndDate = new Date('2024-01-19');

    const result: RankedIssueList = extractAndRankIssuesFromReports({
      reports,
      analysisStartDate,
      analysisEndDate,
      issueKeywordDictionary,
      minimumConfidenceThreshold: 50
    });

    const extractedKeywords = result.issues.map((issue) => issue.keyword);
    
    expect(extractedKeywords).toContain('バグ');
    expect(extractedKeywords).toContain('遅延');
    expect(extractedKeywords).toContain('リソース不足');
    
    expect(extractedKeywords).not.toContain('システム連携');
    expect(extractedKeywords).not.toContain('問題');
    expect(extractedKeywords).not.toContain('サーバー障害');
    expect(extractedKeywords).not.toContain('ネットワーク接続エラー');

    const registeredKeywordCount = result.issues.filter((issue) =>
      issueKeywordDictionary.includes(issue.keyword)
    ).length;
    
    expect(result.totalIssueCount).toBe(registeredKeywordCount);
    
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.length).toBeLessThanOrEqual(3);
  });
});