import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Error Handling', () => {
  test('SCEN-747: should return error when team member ID is null', async () => {
    // Arrange
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        confidence: 0,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportText = '昨日は機能Aの実装を行いました。本日は機能Bのテストを予定。課題として、データベース接続エラーが頻発しています';
    const teamMemberId = null;
    const startDate = new Date('2024-01-15T00:00:00Z');
    const endDate = new Date('2024-01-21T23:59:59Z');
    const requestUserId = 'user-001';

    // Act
    const result = await extractAndRankIssueKeywords(
      {
        teamId: 'team-001',
        startDate,
        endDate,
        minFrequencyThreshold: 1,
        requestUserId,
      },
      mockTextAnalysisAdapter
    );

    // Assert
    expect(result).toEqual({
      code: 'INVALID_MEMBER_ID',
      message: 'Team member ID is required',
      statusCode: 400,
    });
    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});