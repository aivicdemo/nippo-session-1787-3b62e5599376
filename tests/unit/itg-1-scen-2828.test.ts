import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('submission-status-tracking', () => {
  // SCEN-2828
  test('should return error when unsubmitted members list contains duplicate member IDs', async () => {
    const team_id = 'team_test_001';
    const report_date = '2024-01-15';
    const executor_user_id = 'user_manager_001';
    
    const morning_meeting_start_time = '09:00';
    
    const duplicate_member_id = 'member_001';
    
    const unsubmitted_members_list = [
      {
        userId: duplicate_member_id,
        userName: 'John Doe',
        email: 'john@example.com',
        remainingMinutes: 30,
      },
      {
        userId: duplicate_member_id,
        userName: 'John Doe',
        email: 'john@example.com',
        remainingMinutes: 30,
      },
      {
        userId: 'member_002',
        userName: 'Jane Smith',
        email: 'jane@example.com',
        remainingMinutes: 45,
      },
    ];
    
    const input = {
      teamId: team_id,
      reportDate: report_date,
      morningMeetingStartTime: morning_meeting_start_time,
      executorUserId: executor_user_id,
      unsubmittedMembers: unsubmitted_members_list,
    };
    
    const result = await detectAndNotifyUnsubmittedMembers(input);
    
    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('DuplicateMemberInSubmissionListError');
    expect(result.error?.message).toMatch(/提出状況リストに重複するメンバーが含まれています/);
    expect(result.error?.message).toMatch(/member_001/);
    expect(result.error?.message).toMatch(/複数回検出されました/);
    expect(result.unsubmittedMembers).toBeUndefined();
    expect(result.notificationsSent).toBeUndefined();
    expect(result.notificationFailures).toBeUndefined();
  });
});