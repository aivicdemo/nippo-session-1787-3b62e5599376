import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能 - TextAnalysisServiceAdapter タイムアウト', () => {
  // SCEN-635
  test('TextAnalysisServiceAdapter の呼び出しがタイムアウト（30秒超過）したとき、例外を発生させる', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('TextAnalysisServiceAdapter call timeout: exceeded 30 seconds'));
          }, 31000);
        });
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害により業務が中断した',
      occurrenceFrequency: 2,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 1.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    await expect(
      calculateIssuePriorityScore(input, mockTextAnalysisAdapter)
    ).rejects.toThrow(/TextAnalysisServiceAdapter call timeout: exceeded 30 seconds/);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});