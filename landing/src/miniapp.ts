/**
 * Nimiq Pay Mini App SDK integration for DropN.
 *
 * When running inside Nimiq Pay, the Mini App SDK provides:
 * - Direct Hub API access (no popups)
 * - Host language detection
 * - Device identifier for fraud prevention
 *
 * When running standalone (browser), falls back to regular Hub API popups.
 */

import { init as initMiniApp, getHostLanguage } from "@nimiq/mini-app-sdk";

let _isMiniApp = false;
let _language: string | undefined;

/**
 * Initialize the Nimiq environment.
 * Detects whether we're inside Nimiq Pay or a standalone browser.
 */
export async function initNimiq(): Promise<{ isMiniApp: boolean; language?: string }> {
  try {
    await initMiniApp({ timeout: 3000 });
    _isMiniApp = true;
    _language = getHostLanguage();
    console.log("[DropN] Running inside Nimiq Pay Mini App");
  } catch {
    _isMiniApp = false;
    console.log("[DropN] Running as standalone web app");
  }
  return { isMiniApp: _isMiniApp, language: _language };
}

/**
 * Whether we're running inside the Nimiq Pay Mini App.
 */
export function isMiniApp(): boolean {
  return _isMiniApp;
}

/**
 * Get the user's language preference from Nimiq Pay.
 */
export function getLanguage(): string | undefined {
  return _language;
}
