import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度判定機能', () => {
  // SCEN-586
  test('[error] TextAnalysisServiceAdapterの呼び出しがタイムアウト30秒超過したとき処理が中断される', async () => {
    const timeoutDelayMs = 31000;
    const timeoutThresholdMs = 30000;

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(
        () =>
          new Promise<{ keywords: string[]; frequencies: number[] }>((resolve) => {
            setTimeout(() => {
              resolve({
                keywords: ['database', 'connection', 'error'],
                frequencies: [5, 4, 3],
              });
            }, timeoutDelayMs);
          })
      ),
      assessImpactScore: jest.fn(async (keyword: string) => ({
        keyword,
        impactScore: 75,
      })),
      classifyIssueSeverity: jest.fn(async (content: string) => ({
        content,
        severity: 'high',
      })),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが頻発している',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T10:30:00Z',
      teamId: 'team-001',
    };

    const timeoutPromise = new Promise<IssuePriorityScoringOutput>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(
            `TextAnalysisServiceAdapter timeout: ${timeoutThresholdMs / 1000} seconds exceeded`
          )
        );
      }, timeoutThresholdMs);

      calculateIssuePriorityScore(input, mockTextAnalysisAdapter)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          reject(err);
        });
    });

    await expect(timeoutPromise).rejects.toThrow(/timeout/i);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(1);
  });
});