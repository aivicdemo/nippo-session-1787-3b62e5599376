import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import { type ConfirmationEmailInput, type ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

describe('generateAndSendConfirmationEmail - highlight rule color condition validation', () => {
  // SCEN-456: [error] ハイライト表示ルール色分け条件が空のとき処理を中止しエラーを返す
  test('should throw error and log HighlightRuleValidator when color_condition is empty', async () => {
    const mockDate = new Date('2024-01-15T09:00:00Z');
    
    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime: mockDate,
      aggregatedReports: [
        {
          reportId: 'report-001',
          reporterUserId: 'user-001',
          reporterName: 'Engineer A',
          yesterdayAccomplishment: 'Completed API integration',
          todayPlan: 'Start testing module',
          challenges: 'Database connection timeout',
          submissionDateTime: new Date('2024-01-15T08:30:00Z'),
        },
      ],
      managerUserId: 'manager-001',
      teamId: 'team-001',
      analysisDate: new Date('2024-01-15T00:00:00Z'),
    };

    const dashboardSettings = {
      highlightRuleConfig: {
        color_condition: null,
      },
    };

    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

    try {
      await generateAndSendConfirmationEmail(input, dashboardSettings);
      fail('Expected function to throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/色分け条件/);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/HighlightRuleValidator.*color_condition.*empty.*null/)
      );
    } finally {
      mockConsoleError.mockRestore();
    }
  });
});