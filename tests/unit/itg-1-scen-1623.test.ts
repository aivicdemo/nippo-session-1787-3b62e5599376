import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('weekly-issue-analysis: extractWeeklyReportData', () => {
  test('SCEN-1623: returns error when report text is null and skips null records', async () => {
    // Arrange: Prepare test report records with one having null report text
    const validReportId1 = 'report-001';
    const validReportId2 = 'report-002';
    const nullReportId = 'report-null';
    const validReportId3 = 'report-003';

    const testReports = [
      {
        reportId: validReportId1,
        reportDate: new Date('2024-01-08'),
        reportText: 'Completed API integration. Encountered database connection timeout issue.',
        submittedByUserId: 'user-001',
      },
      {
        reportId: nullReportId,
        reportDate: new Date('2024-01-09'),
        reportText: null,
        submittedByUserId: 'user-002',
      },
      {
        reportId: validReportId2,
        reportDate: new Date('2024-01-10'),
        reportText: 'Refactored authentication module. Database performance degraded under load.',
        submittedByUserId: 'user-003',
      },
      {
        reportId: validReportId3,
        reportDate: new Date('2024-01-11'),
        reportText: 'Fixed memory leak in cache layer. Network latency issues persisting.',
        submittedByUserId: 'user-004',
      },
    ];

    // Create stub for TextAnalysisServiceAdapter with call tracking
    const extractedKeywordsCalls: Array<{ reportId: string; reportText: string }> = [];
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((reportText: string, reportId: string) => {
        extractedKeywordsCalls.push({ reportId, reportText });
        // Return mock extracted keywords
        if (reportText.includes('timeout')) {
          return {
            keywords: [
              { keyword: 'database connection timeout', frequency: 1 },
            ],
            confidenceScore: 85,
          };
        } else if (reportText.includes('performance')) {
          return {
            keywords: [
              { keyword: 'database performance degradation', frequency: 1 },
            ],
            confidenceScore: 82,
          };
        } else if (reportText.includes('leak')) {
          return {
            keywords: [{ keyword: 'memory leak', frequency: 1 }],
            confidenceScore: 88,
          };
        }
        return { keywords: [], confidenceScore: 0 };
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        return {
          impactScore: 75,
          severity: 'medium',
        };
      }),
    };

    // Act: Execute weekly report data extraction
    const result = await extractWeeklyReportData(
      {
        weekStartDate: new Date('2024-01-08'),
        weekEndDate: new Date('2024-01-14'),
        teamIds: undefined,
        requestedByUserId: 'manager-001',
      },
      mockTextAnalysisAdapter,
      testReports
    );

    // Assert: Verify error response structure
    expect(result.error).toBe(true);
    expect(result.errorCode).toBe('INVALID_REPORT_TEXT');
    expect(result.errorMessage).toContain(
      'null または空の日報テキストが検出されました'
    );
    expect(result.skippedRecords).toBeDefined();
    expect(result.skippedRecords.count).toBe(1);
    expect(result.skippedRecords.ids).toContain(nullReportId);

    // Assert: Verify extractKeywords was not called for null record
    const callReportIds = extractedKeywordsCalls.map((call) => call.reportId);
    expect(callReportIds).not.toContain(nullReportId);

    // Assert: Verify extractKeywords was called for valid records only
    expect(callReportIds).toContain(validReportId1);
    expect(callReportIds).toContain(validReportId2);
    expect(callReportIds).toContain(validReportId3);
    expect(callReportIds).toHaveLength(3);

    // Assert: Verify valid records are included in processing results
    expect(result.processedReports).toBeDefined();
    expect(result.processedReports.length).toBe(3);

    const processedIds = result.processedReports.map((r) => r.reportId);
    expect(processedIds).toContain(validReportId1);
    expect(processedIds).toContain(validReportId2);
    expect(processedIds).toContain(validReportId3);
    expect(processedIds).not.toContain(nullReportId);

    // Assert: Verify TextAnalysisServiceAdapter was called with correct text for valid records
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);
  });
});