import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';
import type { Tx11Imp1AiClient } from '../../src/agents/tx-11-imp-1/types';

describe('notification-delivery', () => {
  // SCEN-201
  test('should display reference information for past similar issues when member accesses report creation screen', async () => {
    const mockAiClient: Tx11Imp1AiClient = {
      buildAction07Prompt: jest.fn().mockReturnValue({
        prompt: 'Search past issues for member A in department engineering',
        version: '1.0.0',
      }),
      callAction07: jest
        .fn()
        .mockResolvedValue([
          {
            date: '2024-01-15T09:00:00Z',
            memberId: 'MEMBER_A',
            memberName: 'Member A',
            department: 'engineering',
            issue: 'Process delay due to unclear requirements',
            resolution: 'Held requirements confirmation workshop',
            estimatedDays: 3,
          },
          {
            date: '2024-01-08T10:30:00Z',
            memberId: 'MEMBER_A',
            memberName: 'Member A',
            department: 'engineering',
            issue: 'Requirements ambiguity blocking task progression',
            resolution: 'Clarified requirements with stakeholders',
            estimatedDays: 2,
          },
          {
            date: '2023-12-28T14:15:00Z',
            memberId: 'MEMBER_A',
            memberName: 'Member A',
            department: 'engineering',
            issue: 'Specification mismatch discovered during implementation',
            resolution: 'Rework specifications and re-confirmed with team',
            estimatedDays: 4,
          },
        ]),
    };

    const contextData = {
      memberId: 'MEMBER_A',
      memberName: 'Member A',
      department: 'engineering',
      reportDate: '2024-01-22',
      hasSubmitted: false,
      isCreatingReport: true,
      focusedField: 'issues',
    };

    const result = await sendUnsubmittedReminder(mockAiClient, contextData);

    expect(mockAiClient.buildAction07Prompt).toHaveBeenCalled();

    const promptCall = (mockAiClient.buildAction07Prompt as jest.Mock).mock
      .calls[0];
    expect(promptCall).toBeDefined();

    expect(mockAiClient.callAction07).toHaveBeenCalled();

    expect(result).toBeDefined();
    expect(result.displayedReferences).toEqual([
      {
        date: '2024-01-15T09:00:00Z',
        memberId: 'MEMBER_A',
        memberName: 'Member A',
        department: 'engineering',
        issue: 'Process delay due to unclear requirements',
        resolution: 'Held requirements confirmation workshop',
        estimatedDays: 3,
      },
      {
        date: '2024-01-08T10:30:00Z',
        memberId: 'MEMBER_A',
        memberName: 'Member A',
        department: 'engineering',
        issue: 'Requirements ambiguity blocking task progression',
        resolution: 'Clarified requirements with stakeholders',
        estimatedDays: 2,
      },
      {
        date: '2023-12-28T14:15:00Z',
        memberId: 'MEMBER_A',
        memberName: 'Member A',
        department: 'engineering',
        issue: 'Specification mismatch discovered during implementation',
        resolution: 'Rework specifications and re-confirmed with team',
        estimatedDays: 4,
      },
    ]);

    expect(result.displayPosition).toBe('below_input_field');
    expect(result.maxItems).toBe(3);
    expect(result.filteredByMember).toBe(true);
    expect(result.filteredByDepartment).toBe(true);

    const memberBContextData = {
      memberId: 'MEMBER_B',
      memberName: 'Member B',
      department: 'qa',
      reportDate: '2024-01-22',
      hasSubmitted: false,
      isCreatingReport: true,
      focusedField: 'issues',
    };

    const memberBMockAiClient: Tx11Imp1AiClient = {
      buildAction07Prompt: jest.fn().mockReturnValue({
        prompt: 'Search past issues for member B in department qa',
        version: '1.0.0',
      }),
      callAction07: jest.fn().mockResolvedValue([
        {
          date: '2024-01-18T11:00:00Z',
          memberId: 'MEMBER_B',
          memberName: 'Member B',
          department: 'qa',
          issue: 'Test coverage gap in regression suite',
          resolution: 'Expanded test cases and automated validation',
          estimatedDays: 2,
        },
      ]),
    };

    const memberBResult = await sendUnsubmittedReminder(
      memberBMockAiClient,
      memberBContextData
    );

    expect(memberBResult.displayedReferences).toHaveLength(1);
    expect(memberBResult.displayedReferences[0].memberId).toBe('MEMBER_B');
    expect(memberBResult.displayedReferences[0].department).toBe('qa');
    expect(memberBResult.displayedReferences[0].issue).toBe(
      'Test coverage gap in regression suite'
    );
  });
});