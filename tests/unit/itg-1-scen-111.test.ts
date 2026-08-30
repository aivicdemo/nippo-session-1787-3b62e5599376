import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { searchAndRetrieveReports } from '../../src/logic/report-search-and-retrieval';
import type {
  SearchAndRetrieveInput,
  SearchAndRetrieveOutput,
  RankedIssue,
  DeduplicationSummary,
} from '../../src/logic/report-search-and-retrieval';

describe('searchAndRetrieveReports', () => {
  let mockJudgeAccessPermission: jest.Mock;
  let mockRetrieveReportsByDateRange: jest.Mock;
  let mockDeduplicateAndMergeIssues: jest.Mock;
  let mockRankIssuesByFrequency: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJudgeAccessPermission = jest.fn().mockReturnValue(true);

    const rawReportData = [
      {
        reportId: 'report-001',
        reportDate: '2026-08-05',
        submitterName: 'Engineer-A',
        teamName: 'team-A',
        issueContent: 'バグが発生しました',
        extractedKeywords: ['バグ'],
      },
      {
        reportId: 'report-002',
        reportDate: '2026-08-10',
        submitterName: 'Engineer-B',
        teamName: 'team-A',
        issueContent: 'バグと遅延が同時に起きた',
        extractedKeywords: ['バグ', '遅延'],
      },
      {
        reportId: 'report-003',
        reportDate: '2026-08-12',
        submitterName: 'Engineer-C',
        teamName: 'team-A',
        issueContent: '遅延が発生しています',
        extractedKeywords: ['遅延'],
      },
    ];
    mockRetrieveReportsByDateRange = jest.fn().mockReturnValue(rawReportData);

    const deduplicationSummaryResult: DeduplicationSummary = {
      totalInputIssues: 4,
      mergedCount: 1,
      uniqueIssuesCount: 3,
      duplicateGroupsCount: 1,
    };

    mockDeduplicateAndMergeIssues = jest.fn().mockReturnValue({
      mergedIssues: [
        {
          parentIssueId: 'issue-bug-001',
          content: 'バグ',
          mergedIssueIds: [],
          frequency: 2,
          mergedFlag: false,
        },
        {
          parentIssueId: 'issue-delay-001',
          content: '遅延',
          mergedIssueIds: [],
          frequency: 1,
          mergedFlag: false,
        },
        {
          parentIssueId: 'issue-other-001',
          content: 'その他',
          mergedIssueIds: [],
          frequency: 1,
          mergedFlag: false,
        },
      ],
      deduplicationSummary: deduplicationSummaryResult,
      normalizedIssueList: [
        {
          issueId: 'issue-bug-001',
          normalizedContent: 'バグ',
          sourceReportIds: ['report-001', 'report-002'],
          frequency: 2,
        },
        {
          issueId: 'issue-delay-001',
          normalizedContent: '遅延',
          sourceReportIds: ['report-002', 'report-003'],
          frequency: 2,
        },
        {
          issueId: 'issue-other-001',
          normalizedContent: 'その他',
          sourceReportIds: ['report-001'],
          frequency: 1,
        },
        {
          issueId: 'issue-other-002',
          normalizedContent: '別の課題',
          sourceReportIds: ['report-003'],
          frequency: 1,
        },
      ],
    });

    const rankedIssuesResult: RankedIssue[] = [
      {
        issueId: 'issue-bug-001',
        content: 'バグ',
        frequency: 2,
        rank: 1,
        affectedMemberCount: 2,
      },
      {
        issueId: 'issue-delay-001',
        content: '遅延',
        frequency: 2,
        rank: 2,
        affectedMemberCount: 2,
      },
      {
        issueId: 'issue-other-001',
        content: 'その他',
        frequency: 1,
        rank: 3,
        affectedMemberCount: 1,
      },
      {
        issueId: 'issue-other-002',
        content: '別の課題',
        frequency: 1,
        rank: 4,
        affectedMemberCount: 1,
      },
    ];
    mockRankIssuesByFrequency = jest.fn().mockReturnValue(rankedIssuesResult);
  });

  // SCEN-111: 指定された日付範囲とキーワード条件で日報を検索・抽出し、発生頻度順にランク付けして表示用に整形する
  test('should search and retrieve reports with keyword filtering and rank issues by frequency', async () => {
    const input: SearchAndRetrieveInput = {
      dateRange: {
        startDate: '2026-08-01',
        endDate: '2026-08-15',
      },
      keywords: ['バグ', '遅延'],
      teamIds: ['team-A'],
      reporterIds: undefined,
    };

    const userId = 'user-001';

    const result: SearchAndRetrieveOutput = await searchAndRetrieveReports(
      input,
      userId,
      mockJudgeAccessPermission,
      mockRetrieveReportsByDateRange,
      mockDeduplicateAndMergeIssues,
      mockRankIssuesByFrequency
    );

    expect(mockJudgeAccessPermission).toHaveBeenCalledWith(userId);
    expect(mockJudgeAccessPermission).toHaveBeenCalledTimes(1);

    expect(mockRetrieveReportsByDateRange).toHaveBeenCalledWith(
      new Date('2026-08-01'),
      new Date('2026-08-15'),
      ['team-A']
    );
    expect(mockRetrieveReportsByDateRange).toHaveBeenCalledTimes(1);

    expect(mockDeduplicateAndMergeIssues).toHaveBeenCalled();
    expect(mockDeduplicateAndMergeIssues).toHaveBeenCalledTimes(1);

    expect(mockRankIssuesByFrequency).toHaveBeenCalled();
    expect(mockRankIssuesByFrequency).toHaveBeenCalledTimes(1);

    expect(result.issues).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.issues.length).toBe(4);

    expect(result.issues[0].content).toBe('バグ');
    expect(result.issues[0].frequency).toBe(2);
    expect(result.issues[0].rank).toBe(1);

    expect(result.issues[1].content).toBe('遅延');
    expect(result.issues[1].frequency).toBe(2);
    expect(result.issues[1].rank).toBe(2);

    expect(result.issues[2].content).toBe('その他');
    expect(result.issues[2].frequency).toBe(1);
    expect(result.issues[2].rank).toBe(3);

    expect(result.issues[3].content).toBe('別の課題');
    expect(result.issues[3].frequency).toBe(1);
    expect(result.issues[3].rank).toBe(4);

    expect(result.totalCount).toBe(4);

    expect(result.searchExecutedAt).toBeInstanceOf(Date);

    expect(result.deduplicationSummary).toBeDefined();
    expect(result.deduplicationSummary.totalInputIssues).toBe(4);
    expect(result.deduplicationSummary.mergedCount).toBe(1);
    expect(result.deduplicationSummary.uniqueIssuesCount).toBe(3);
    expect(result.deduplicationSummary.duplicateGroupsCount).toBe(1);
  });
});