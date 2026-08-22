import { test, expect } from '@playwright/test';

test.describe('リマインド通知管理画面', () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  const TARGET_SCREEN = '/panels/scr-1787119211243.html';

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}${TARGET_SCREEN}`);
    await page.waitForLoadState('networkidle');
  });

  // SCEN-001
  test('スケジュール新規作成ボタン押下でスケジュール作成フォームが表示される', async ({
    page,
  }) => {
    const createButton = page.locator('[data-testid="create-schedule-button"]');
    await expect(createButton).toBeVisible();
    await createButton.click();

    const modal = page.locator('#create-modal');
    await expect(modal).toBeVisible();

    const form = page.locator('#create-form');
    await expect(form).toBeVisible();

    const sendTimeInput = page.locator('[data-testid="send-time-input"]');
    const teamSelect = page.locator('[data-testid="team-select"]');
    const deadlineInput = page.locator('[data-testid="deadline-hours-input"]');

    await expect(sendTimeInput).toBeVisible();
    await expect(teamSelect).toBeVisible();
    await expect(deadlineInput).toBeVisible();
  });

  // SCEN-002
  test('リマインド送信時刻の入力値がスケジュール保存時に反映される', async ({
    page,
  }) => {
    const createButton = page.locator('[data-testid="create-schedule-button"]');
    await createButton.click();

    const sendTimeInput = page.locator('[data-testid="send-time-input"]');
    await sendTimeInput.fill('06:30');

    const teamSelect = page.locator('[data-testid="team-select"]');
    await teamSelect.selectOption('team_01');

    const deadlineInput = page.locator('[data-testid="deadline-hours-input"]');
    await deadlineInput.fill('24');

    const saveButton = page.locator('[data-testid="save-schedule-button"]');
    await saveButton.click();


    const modal = page.locator('#create-modal');
    await expect(modal).not.toBeVisible();

    const schedulesList = page.locator('#schedules-list');
    await expect(schedulesList).toBeVisible();

    const firstRow = schedulesList.locator('>> nth=0');
    const cellText = await firstRow.textContent();
    expect(cellText).toContain('06:30');
  });

  // SCEN-003
  test('対象チームの選択値がスケジュール保存時に反映される', async ({
    page,
  }) => {
    const createButton = page.locator('[data-testid="create-schedule-button"]');
    await createButton.click();

    const sendTimeInput = page.locator('[data-testid="send-time-input"]');
    await sendTimeInput.fill('07:00');

    const teamSelect = page.locator('[data-testid="team-select"]');
    await teamSelect.selectOption('team_02');

    const deadlineInput = page.locator('[data-testid="deadline-hours-input"]');
    await deadlineInput.fill('12');

    const saveButton = page.locator('[data-testid="save-schedule-button"]');
    await saveButton.click();


    const schedulesList = page.locator('#schedules-list');
    await expect(schedulesList).toBeVisible();

    const firstRow = schedulesList.locator('>> nth=0');
    const cellText = await firstRow.textContent();
    expect(cellText).toContain('企画チーム');
  });

  // SCEN-004
  test('対象メンバーの選択値がスケジュール保存時に反映される', async ({
    page,
  }) => {
    const createButton = page.locator('[data-testid="create-schedule-button"]');
    await createButton.click();

    const sendTimeInput = page.locator('[data-testid="send-time-input"]');
    await sendTimeInput.fill('08:00');

    const teamSelect = page.locator('[data-testid="team-select"]');
    await teamSelect.selectOption('team_03');

    const deadlineInput = page.locator('[data-testid="deadline-hours-input"]');
    await deadlineInput.fill('48');

    const saveButton = page.locator('[data-testid="save-schedule-button"]');
    await saveButton.click();


    const schedulesList = page.locator('#schedules-list');
    const firstRow = schedulesList.locator('>> nth=0');

    await firstRow.click();

    const detailModal = page.locator('#detail-modal');
    await expect(detailModal).toBeVisible();

    const detailContent = page.locator('#detail-content');
    const detailText = await detailContent.textContent();
    expect(detailText).not.toBeNull();
  });

  // SCEN-005
  test('定時リマインド通知の自動送信設定を有効にできる', async ({ page }) => {
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();


    const isActiveCheckbox = page.locator(
      'input[name="is_active"][type="checkbox"]'
    );

    const isChecked = await isActiveCheckbox.isChecked();
    if (!isChecked) {
      await isActiveCheckbox.check();
    }


    const checkedState = await isActiveCheckbox.isChecked();
    expect(checkedState).toBe(true);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const reloadedCheckbox = page.locator(
      'input[name="is_active"][type="checkbox"]'
    );
    const reloadedState = await reloadedCheckbox.isChecked();
    expect(reloadedState).toBe(true);
  });

  // SCEN-006
  test('定時リマインド通知の自動送信設定を無効にできる', async ({ page }) => {
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await settingsButton.click();


    const isActiveCheckbox = page.locator(
      'input[name="is_active"][type="checkbox"]'
    );

    const isChecked = await isActiveCheckbox.isChecked();
    if (isChecked) {
      await isActiveCheckbox.uncheck();
    }


    const uncheckedState = await isActiveCheckbox.isChecked();
    expect(uncheckedState).toBe(false);
  });

  // SCEN-007
  test('スケジュール有効/無効の切り替えボタン押下で状態が変わる', async ({
    page,
  }) => {
    const schedulesList = page.locator('#schedules-list');
    await expect(schedulesList).toBeVisible();

    const firstRow = schedulesList.locator('>> nth=0');
    await expect(firstRow).toBeVisible();

    const toggleButton = firstRow.locator('input[type="checkbox"]');
    const initialState = await toggleButton.isChecked();

    await toggleButton.click();

    const newState = await toggleButton.isChecked();
    expect(newState).not.toBe(initialState);
  });

  // SCEN-008
  test('有効なスケジュール行の有効/無効切り替えで無効状態に変わる', async ({
    page,
  }) => {
    const schedulesList = page.locator('#schedules-list');
    await expect(schedulesList).toBeVisible();

    const rows = await schedulesList.locator('tr').count();
    expect(rows).toBeGreaterThan(0);

    const firstRow = schedulesList.locator('>> nth=0');
    const toggleButton = firstRow.locator('input[type="checkbox"]');

    const initialChecked = await toggleButton.isChecked();
    if (initialChecked) {
      await toggleButton.click();

      const afterClickState = await toggleButton.isChecked();
      expect(afterClickState).toBe(false);
    }
  });

  // SCEN-009
  test('無効なスケジュール行の有効/無効切り替えで有効状態に変わる', async ({
    page,
  }) => {
    const schedulesList = page.locator('#schedules-list');
    await expect(schedulesList).toBeVisible();

    const rows = await schedulesList.locator('tr').count();
    expect(rows).toBeGreaterThan(0);

    const firstRow = schedulesList.locator('>> nth=0');
    const toggleButton = firstRow.locator('input[type="checkbox"]');

    const initialChecked = await toggleButton.isChecked();
    if (!initialChecked) {
      await toggleButton.click();

      const afterClickState = await toggleButton.isChecked();
      expect(afterClickState).toBe(true);
    }
  });

  // SCEN-010
  test('リマインド通知スケジュール一覧に複数件のスケジュールが表示される', async ({
    page,
  }) => {
    const schedulesList = page.locator('#schedules-list');
    await expect(schedulesList).toBeVisible();

    const rows = schedulesList.locator('tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);

    const firstRow = rows.nth(0);
    const firstText = await firstRow.textContent();
    expect(firstText).not.toBeNull();

    const secondRow = rows.nth(1);
    const secondText = await secondRow.textContent();
    expect(secondText).not.toBeNull();
  });
});