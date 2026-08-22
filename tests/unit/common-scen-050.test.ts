import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-050: escalation when encrypted or special format report received', async () => {
    const mockMailSystem = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'msg-001' }),
      getLogs: jest.fn().mockReturnValue([]),
    };

    const mockAiClient = {
      executeAction01: jest
        .fn()
        .mockResolvedValue({
          status: 'SUCCESS',
          unsubmittedMembers: [],
          encryptedReportsDetected: [
            {
              senderId: 'user-encrypted-001',
              receivedAt: '2024-01-15T09:30:00Z',
              format: 'AES-256',
            },
          ],
          specialFormatReportsDetected: [
            {
              senderId: 'user-special-001',
              receivedAt: '2024-01-15T09:32:00Z',
              format: 'JSON-LD',
            },
          ],
        }),
      executeAction02: jest.fn().mockResolvedValue({
        status: 'ERROR',
        reason: 'UNDECODABLE_FORMAT',
        details: 'Encryption detected or unsupported format',
      }),
      executeAction03: jest.fn(),
      executeAction04: jest.fn(),
      executeAction05: jest.fn(),
      executeAction06: jest.fn(),
    };

    const result = await sendUnsubmittedReminder(
      {
        teamId: 'team-001',
        scheduledTime: '2024-01-15T09:00:00Z',
        mailSystem: mockMailSystem,
      },
      mockAiClient
    );

    expect(result.escalated).toBe(true);
    expect(result.escalationReason).toBe('ENCRYPTED_OR_SPECIAL_FORMAT');
    expect(result.sideEffectsApplied).toBe(false);
    expect(result.requiresHumanReview).toBe(true);

    expect(mockAiClient.executeAction01).toHaveBeenCalledWith({
      teamId: 'team-001',
      scheduledTime: '2024-01-15T09:00:00Z',
    });

    expect(mockAiClient.executeAction02).toHaveBeenCalled();

    expect(mockAiClient.executeAction03).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction04).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction05).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction06).not.toHaveBeenCalled();

    const escalationMailCalls = mockMailSystem.sendMail.mock.calls.filter(
      (call) =>
        call[0] && call[0].subject && call[0].subject.includes('エスカレーション')
    );
    expect(escalationMailCalls.length).toBeGreaterThan(0);

    const escalationMail = escalationMailCalls[0][0];
    expect(escalationMail.to).toContain('director@company.com');
    expect(escalationMail.body).toContain('user-encrypted-001');
    expect(escalationMail.body).toContain('2024-01-15T09:30:00Z');
    expect(escalationMail.body).toContain('ENCRYPTED_OR_SPECIAL_FORMAT');
    expect(escalationMail.body).toContain('AES-256');
    expect(escalationMail.body).not.toContain('payload');

    const confirmationMailCalls = mockMailSystem.sendMail.mock.calls.filter(
      (call) =>
        call[0] && call[0].subject && call[0].subject.includes('確認メール')
    );
    expect(confirmationMailCalls.length).toBe(0);
  });
});