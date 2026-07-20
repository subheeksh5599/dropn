#!/usr/bin/env node
/**
 * DropN Escrow Helper — Nimiq wallet operations for the Python backend.
 *
 * Usage:
 *   node escrow.js new-wallet          → generate mnemonic + first address
 *   node escrow.js address <mnemonic>  → derive address from mnemonic
 *   node escrow.js send <private_key_hex> <to_address> <amount_nim> [network]
 *   node escrow.js balance <address> [network]
 *
 * Network: 'main' (default) or 'test'
 *
 * Output: JSON on stdout, errors on stderr.
 */

const Nimiq = require("@nimiq/core");

const NETWORKS = {
  main: { id: 42, name: "mainalbatross" },
  test: { id: 2, name: "testalbatross" },
};

// ── Helpers ──────────────────────────────────────────

function parseNetwork(name) {
  return NETWORKS[name || "main"] || NETWORKS.main;
}

function nimToLuna(nim) {
  // 1 NIM = 100,000 luna (5 decimal places)
  return BigInt(Math.round(parseFloat(nim) * 100_000));
}

function lunaToNim(luna) {
  return Number(luna) / 100_000;
}

function output(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

function die(msg) {
  process.stderr.write(msg + "\n");
  process.exit(1);
}

// ── Commands ─────────────────────────────────────────

async function cmdNewWallet() {
  // Generate a fresh key pair
  const keyPair = Nimiq.KeyPair.generate();
  const privateKey = keyPair.privateKey;
  const address = keyPair.publicKey.toAddress();

  output({
    private_key: privateKey.toHex(),
    public_key: keyPair.publicKey.toHex(),
    address: address.toUserFriendlyAddress(),
  });
}

async function cmdSend(privateKeyHex, toAddr, amountNim, network) {
  const net = parseNetwork(network);
  const senderKey = Nimiq.KeyPair.fromHex(privateKeyHex);
  const senderAddr = senderKey.publicKey.toAddress();
  const recipientAddr = Nimiq.Address.fromUserFriendlyAddress(toAddr);
  const value = nimToLuna(amountNim);

  // Connect to Nimiq network
  const config = new Nimiq.ClientConfiguration();
  config.network(net.name);
  config.logLevel("error");

  const client = await Nimiq.Client.create(config.build());

  try {
    // Get current block height for validity window
    const blockHeight = client.blockHeight;

    // Build basic transaction
    const tx = Nimiq.TransactionBuilder.newBasic(
      senderAddr,
      recipientAddr,
      value,
      BigInt(0), // fee = 0 for basic transfers (network covers it)
      blockHeight,
      net.id,
    );

    // Sign with sender's key
    senderKey.signTransaction(tx);

    // Broadcast
    const result = await client.sendTransaction(tx);
    const txHash = result.hash();

    output({
      transaction_hash: txHash,
      from: senderAddr.toUserFriendlyAddress(),
      to: recipientAddr.toUserFriendlyAddress(),
      amount_nim: amountNim,
      network: net.name,
    });
  } finally {
    client.destroy();
  }
}

async function cmdBalance(address, network) {
  const net = parseNetwork(network);
  const addr = Nimiq.Address.fromUserFriendlyAddress(address);

  const config = new Nimiq.ClientConfiguration();
  config.network(net.name);
  config.logLevel("error");

  const client = await Nimiq.Client.create(config.build());

  try {
    const account = await client.getAccount(addr);
    const balanceLuna = account ? account.balance : BigInt(0);

    output({
      address: address,
      balance_luna: balanceLuna.toString(),
      balance_nim: lunaToNim(balanceLuna),
      network: net.name,
    });
  } finally {
    client.destroy();
  }
}

async function cmdAddress(mnemonic) {
  // A mnemonic is not directly supported in the light client for key derivation
  // Use a raw private key instead
  die("mnemonic derivation not supported in light client — use private_key hex directly");
}

// ── CLI Dispatch ─────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  switch (cmd) {
    case "new-wallet":
      await cmdNewWallet();
      break;
    case "send":
      if (args.length < 4) die("Usage: node escrow.js send <private_key_hex> <to_address> <amount_nim> [test|main]");
      await cmdSend(args[1], args[2], args[3], args[4]);
      break;
    case "balance":
      if (args.length < 2) die("Usage: node escrow.js balance <address> [test|main]");
      await cmdBalance(args[1], args[2]);
      break;
    default:
      die(`Unknown command: ${cmd}\nUsage: node escrow.js <new-wallet|send|balance>`);
  }
}

main().catch((e) => die(e.message || String(e)));
