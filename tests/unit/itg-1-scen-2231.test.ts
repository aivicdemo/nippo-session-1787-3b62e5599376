import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  let mockTextAnalysisAdapter: any;

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (reportText: string) => {
        // Both memberA, memberB, memberC reports contain the same keyword "DBコネクション接続エラー"
        // The mock returns identical extraction results for all three members
        return {
          keywords: [
            {
              keywordId: 'kw-001',
              keyword: 'DBコネクション接続エラー',
              frequency: 1,
              confidence: 0.95,
            },
          ],
          extractedAt: new Date('2024-01-15T09:00:00Z'),
        };
      }),
      assessImpactScore: jest.fn(async () => ({
        impactScore: 75,
      })),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2231: [normal] 課題の重複検出と正規化 - 複数メンバーから同一課題の重複報告がある場合、正規化リストには重複検出元の全メンバー情報が保持される
  test('should detect and normalize duplicate issue keywords from multiple members and preserve all member information', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-pm-001';

    // Three members submit reports with the same issue keyword
    const memberReportDataA = {
      memberId: 'member-a',
      memberName: 'Alice',
      department: 'Development',
      reportText: 'DBコネクション接続エラーが発生してDBアクセスが失敗する問題が発生した',
      reportedAt: new Date('2024-01-15T08:30:00Z'),
    };

    const memberReportDataB = {
      memberId: 'member-b',
      memberName: 'Bob',
      department: 'Development',
      reportText: 'DBコネクション接続エラーにより朝の自動バッチ処理が停止した',
      reportedAt: new Date('2024-01-15T08:45:00Z'),
    };

    const memberReportDataC = {
      memberId: 'member-c',
      memberName: 'Charlie',
      department: 'QA',
      reportText: 'テスト環境でDBコネクション接続エラーが繰り返し発生している',
      reportedAt: new Date('2024-01-15T09:00:00Z'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
      reportedIssues: [memberReportDataA, memberReportDataB, memberReportDataC],
    };

    // Call the function under test with mocked text analysis adapter
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
    );

    // Verify that the mock adapter was called three times (once per member)
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);

    // Verify result structure
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.totalKeywordCount).toBe(1);
    expect(result.extractedAt).toEqual(new Date('2024-01-15T09:00:00Z'));
    expect(result.analysisperiodDays).toBe(7);

    // Verify the normalized keyword entry
    expect(result.keywords.length).toBe(1);
    const normalizedKeyword = result.keywords[0];

    // The keyword should be normalized to a single entry
    expect(normalizedKeyword.keyword).toBe('DBコネクション接続エラー');
    expect(normalizedKeyword.rank).toBe(1);

    // Verify that frequency reflects all three reports of the same issue
    expect(normalizedKeyword.frequency).toBe(3);

    // Verify that detected members information is fully preserved
    expect(normalizedKeyword.detectedMembers).toBeDefined();
    expect(Array.isArray(normalizedKeyword.detectedMembers)).toBe(true);
    expect(normalizedKeyword.detectedMembers.length).toBe(3);

    // Verify all three members are present with their complete information
    const memberIds = normalizedKeyword.detectedMembers.map((m: any) => m.memberId);
    const memberNames = normalizedKeyword.detectedMembers.map((m: any) => m.memberName);
    const departments = normalizedKeyword.detectedMembers.map((m: any) => m.department);
    const reportedAts = normalizedKeyword.detectedMembers.map((m: any) => m.reportedAt);

    expect(memberIds).toContain('member-a');
    expect(memberIds).toContain('member-b');
    expect(memberIds).toContain('member-c');

    expect(memberNames).toContain('Alice');
    expect(memberNames).toContain('Bob');
    expect(memberNames).toContain('Charlie');

    expect(departments).toContain('Development');
    expect(departments).toContain('Development');
    expect(departments).toContain('QA');

    expect(reportedAts).toContain(new Date('2024-01-15T08:30:00Z'));
    expect(reportedAts).toContain(new Date('2024-01-15T08:45:00Z'));
    expect(reportedAts).toContain(new Date('2024-01-15T09:00:00Z'));

    // Verify individual member entries
    const memberAEntry = normalizedKeyword.detectedMembers.find(
      (m: any) => m.memberId === 'member-a',
    );
    expect(memberAEntry).toBeDefined();
    expect(memberAEntry.memberName).toBe('Alice');
    expect(memberAEntry.department).toBe('Development');
    expect(memberAEntry.reportedAt).toEqual(new Date('2024-01-15T08:30:00Z'));

    const memberBEntry = normalizedKeyword.detectedMembers.find(
      (m: any) => m.memberId === 'member-b',
    );
    expect(memberBEntry).toBeDefined();
    expect(memberBEntry.memberName).toBe('Bob');
    expect(memberBEntry.department).toBe('Development');
    expect(memberBEntry.reportedAt).toEqual(new Date('2024-01-15T08:45:00Z'));

    const memberCEntry = normalizedKeyword.detectedMembers.find(
      (m: any) => m.memberId === 'member-c',
    );
    expect(memberCEntry).toBeDefined();
    expect(memberCEntry.memberName).toBe('Charlie');
    expect(memberCEntry.department).toBe('QA');
    expect(memberCEntry.reportedAt).toEqual(new Date('2024-01-15T09:00:00Z'));
  });
});