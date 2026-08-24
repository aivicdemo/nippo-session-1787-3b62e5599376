import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  // SCEN-1147
  test('should throw validation error when issue keyword contains only special characters', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(() => {
        throw new Error('課題キーワードには1文字以上の英数字または日本語を含める必要があります');
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const mockReportData = [
      {
        reportId: 'report-001',
        teamId: 'team-001',
        reportingDate: '2024-01-02',
        challenges: '!@#$%^&*()',
      },
    ];

    expect(() => {
      extractAndRankIssueKeywords(
        input,
        mockReportData,
        mockTextAnalysisServiceAdapter
      );
    }).toThrow(/課題キーワードには1文字以上の英数字または日本語を含める必要があります/);
  });
});