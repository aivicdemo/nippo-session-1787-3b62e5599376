import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import type { DashboardDataFreshnessInput, DashboardDataFreshnessOutput } from '../../src/logic/manager-dashboard';

describe('ダッシュボード表示データ更新機能', () => {
  // SCEN-1006
  test('新しい日報が送信されたとき、ダッシュボードの課題一覧データが最新の内容に更新される', async () => {
    const currentTimestamp = '2024-01-15T09:30:00Z';
    const maxStalenessSeconds = 300;
    const userId = 'user-manager-001';
    const teamId = 'team-dev-001';
    const reportDate = '2024-01-15';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース障害', frequency: 1 },
          { keyword: '納期遅延', frequency: 1 }
        ]
      }),
      assessImpactScore: jest.fn().mockImplementation((keyword: string) => {
        if (keyword === 'データベース障害') {
          return Promise.resolve({ impactScore: 80 });
        }
        if (keyword === '納期遅延') {
          return Promise.resolve({ impactScore: 60 });
        }
        return Promise.resolve({ impactScore: 0 });
      }),
      classifyIssueSeverity: jest.fn().mockImplementation((issueText: string) => {
        if (issueText.includes('データベース障害')) {
          return Promise.resolve({ severity: 'high' });
        }
        if (issueText.includes('納期遅延')) {
          return Promise.resolve({ severity: 'medium' });
        }
        return Promise.resolve({ severity: 'low' });
      })
    };

    const input: DashboardDataFreshnessInput = {
      userId: userId,
      teamId: teamId,
      reportDate: reportDate,
      maxStalenessSeconds: maxStalenessSeconds
    };

    const result = await ensureDashboardDataFreshness(input, mockTextAnalysisAdapter);

    expect(result).toBeDefined();
    expect(result.isDataFresh).toBe(true);
    expect(result.lastUpdateTimestamp).toBeDefined();
    expect(result.displayTimestamp).toBeDefined();
    expect(result.stalenessSeconds).toBeLessThanOrEqual(maxStalenessSeconds);

    const lastUpdateTime = new Date(result.lastUpdateTimestamp).getTime();
    const displayTime = new Date(result.displayTimestamp).getTime();
    const stalenessMs = displayTime - lastUpdateTime;
    
    expect(stalenessMs).toBeLessThanOrEqual(maxStalenessSeconds * 1000);
    expect(stalenessMs).toBeGreaterThanOrEqual(0);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});