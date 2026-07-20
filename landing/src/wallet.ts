/**
 * Nimiq Hub wallet integration for DropN.
 *
 * Uses @nimiq/hub-api to connect wallets and process NIM payments.
 */

import HubApi, {
  type NimiqCheckoutRequest,
  type SignedTransaction,
  type SimpleResult,
} from "@nimiq/hub-api";

const HUB_ENDPOINT = "https://hub.nimiq.com";

let _hubApi: HubApi | null = null;

function getHub(): HubApi {
  if (!_hubApi) {
    _hubApi = new HubApi(HUB_ENDPOINT);
  }
  return _hubApi;
}

/**
 * Connect to the user's Nimiq wallet and get their address.
 * Opens the Nimiq Hub popup for wallet selection.
 */
export async function connectWallet(): Promise<string> {
  const hub = getHub();
  const result = await hub.chooseAddress({ appName: "DropN" });
  return result.address;
}

/**
 * Request a NIM payment via Nimiq Hub checkout.
 * Opens the Hub popup for the payer to confirm the transaction.
 *
 * The checkout flow:
 * 1. Opens Nimiq Hub popup showing payment details
 * 2. Payer confirms the transaction in their wallet
 * 3. Hub broadcasts the signed transaction to the network
 *
 * @param recipient - Recipient's Nimiq wallet address (NQ...)
 * @param amount - Amount in NIM (e.g. 10.5 = 10.5 NIM)
 * @param message - Optional memo for the transaction
 */
export async function requestPayment(
  recipient: string,
  amount: number,
  message: string,
): Promise<string> {
  const hub = getHub();

  // NIM has 5 decimal places — 1 NIM = 100,000 lunas
  const valueInLunas = Math.round(amount * 100_000);

  const checkoutRequest: NimiqCheckoutRequest = {
    appName: "DropN",
    recipient,
    value: valueInLunas,
    extraData: new TextEncoder().encode(message),
  };

  const result = await hub.checkout(checkoutRequest);

  // Result is SignedTransaction (checkout v1) or SimpleResult (v2)
  if (
    result &&
    typeof result === "object" &&
    "hash" in result &&
    typeof (result as SignedTransaction).hash === "string"
  ) {
    return (result as SignedTransaction).hash;
  }

  if (
    result &&
    typeof result === "object" &&
    "success" in result &&
    (result as SimpleResult).success
  ) {
    return "confirmed";
  }

  throw new Error("Payment was not completed");
}

/**
 * Get the Hub API instance for direct use.
 */
export function getHubApi(): HubApi {
  return getHub();
}
