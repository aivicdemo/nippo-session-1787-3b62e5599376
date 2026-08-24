import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('issue extraction and ranking - report date validation', () => {
  test('SCEN-2247: should reject reports with mismatched dates', async () => {
    const reportA = {
      teamId: 'team-001',
      reportingDate: '2026-08-19',
      content: 'database connection timeout issue',
      occurrenceCount: 3,
      impactScore: 75,
    };

    const reportB = {
      teamId: 'team-001',
      reportingDate: '2026-08-20',
      content: 'memory leak in service',
      occurrenceCount: 2,
      impactScore: 60,
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2026-08-19T00:00:00Z'),
      endDate: new Date('2026-08-20T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
      reports: [reportA, reportB],
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter)
    ).rejects.toThrow(/REPORT_DATE_MISMATCH|複数の異なる日付の日報は混在して処理できません/);
  });
});