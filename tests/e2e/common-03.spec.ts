import { test, expect } from '@playwright/test';

test.describe("リマインド通知管理画面", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/panels/scr-1787119211243.html");
  });

  // SCEN-021
  test("[error] リマインド通知管理画面 - 対象チームを選択せずに保存するとエラー表示になる", async ({ page }) => {
    // 対象チームの選択欄が空のまま、保存ボタンをクリック
    // 画面内のすべてのボタンを確認してから、保存と思われるボタンを探して実行
    const buttons = await page.locator('button').all();
    let saveButtonFound = false;
    
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.includes('保存')) {
        await button.click();
        saveButtonFound = true;
        break;
      }
    }
    
    // 保存ボタンが見つからない場合は、一般的な位置のボタンで試す
    if (!saveButtonFound) {
      const possibleSaveButtons = page.locator('button:has-text("保存")');
      if (await possibleSaveButtons.count() > 0) {
        await possibleSaveButtons.first().click();
      }
    }

    // エラーメッセージの表示を確認
    // ページに「対象チームを選択してください」というエラーメッセージが表示されることを期待
    await expect(page.locator('text="対象チームを選択してください"')).toBeVisible({ timeout: 3000 });
    
    // 画面がリマインド通知管理画面に留まることを確認
    expect(page.url()).toContain('scr-1787119211243.html');
  });

  // SCEN-022
  test("[error] リマインド通知管理画面 - 対象メンバーを選択せずに保存するとエラー表示になる", async ({ page }) => {
    // 対象メンバー選択欄を空のまま、保存ボタンをクリック
    const buttons = await page.locator('button').all();
    let saveButtonFound = false;
    
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.includes('保存')) {
        await button.click();
        saveButtonFound = true;
        break;
      }
    }
    
    // 保存ボタンが見つからない場合の代替
    if (!saveButtonFound) {
      const possibleSaveButtons = page.locator('button:has-text("保存")');
      if (await possibleSaveButtons.count() > 0) {
        await possibleSaveButtons.first().click();
      }
    }

    // エラーメッセージの表示を確認
    // ページに「対象メンバーを選択してください」というエラーメッセージが表示されることを期待
    await expect(page.locator('text="対象メンバーを選択してください"')).toBeVisible({ timeout: 3000 });
    
    // 画面がリマインド通知管理画面のままであることを確認
    expect(page.url()).toContain('scr-1787119211243.html');
  });
});