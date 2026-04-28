import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createPublicClient, formatEther, formatUnits, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";
import { decrypt, encrypt } from "../utils/crypto";
import type { PaymentChain } from "../utils/settings";
import type { WalletBalance, WalletData } from "./types";

const WALLET_DIR = path.join(os.homedir(), ".grok");
const WALLET_PATH = path.join(WALLET_DIR, "wallet.json");

const USDC_BY_CHAIN: Record<PaymentChain, `0x${string}`> = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface StoredWallet {
  privateKey: `0x${string}`;
  address: string;
  chain: PaymentChain;
  createdAt: string;
}

/**
 * On-disk shape: privateKey is encrypted via utils/crypto (enc: prefix),
 * everything else is plaintext for visibility (address is public anyway).
 * Pre-encryption wallet files (plain "0x..." privateKey) still parse.
 */
interface OnDiskWallet {
  privateKey: string;
  address: string;
  chain: PaymentChain;
  createdAt: string;
}

function writeWalletFile(stored: StoredWallet): void {
  const onDisk: OnDiskWallet = {
    privateKey: encrypt(stored.privateKey),
    address: stored.address,
    chain: stored.chain,
    createdAt: stored.createdAt,
  };
  fs.mkdirSync(WALLET_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(WALLET_PATH, JSON.stringify(onDisk, null, 2), { mode: 0o600 });
}

export class WalletManager {
  static exists(): boolean {
    return fs.existsSync(WALLET_PATH);
  }

  init(chain: PaymentChain = "base-sepolia"): WalletData {
    if (WalletManager.exists()) {
      const current = this.getStoredWallet();
      return { address: current.address, chain: current.chain, createdAt: current.createdAt };
    }

    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const createdAt = new Date().toISOString();
    const stored: StoredWallet = { privateKey, address: account.address, chain, createdAt };

    writeWalletFile(stored);

    return { address: stored.address, chain: stored.chain, createdAt: stored.createdAt };
  }

  getWalletData(): WalletData {
    const stored = this.getStoredWallet();
    return { address: stored.address, chain: stored.chain, createdAt: stored.createdAt };
  }

  getStoredWallet(): StoredWallet {
    if (!WalletManager.exists()) {
      throw new Error("No wallet found. Run `grok wallet init` first.");
    }
    const parsed = JSON.parse(fs.readFileSync(WALLET_PATH, "utf-8")) as Partial<OnDiskWallet>;
    if (!parsed.privateKey || !parsed.address || !parsed.chain || !parsed.createdAt) {
      throw new Error("Wallet file is incomplete.");
    }
    if (parsed.chain !== "base" && parsed.chain !== "base-sepolia") {
      throw new Error(`Unsupported wallet chain: ${parsed.chain}`);
    }

    const onDiskKey = parsed.privateKey;
    const decrypted = decrypt(onDiskKey);
    if (!decrypted.startsWith("0x")) {
      throw new Error(
        "Failed to decrypt wallet private key. If you set or changed GROK_STORAGE_KEY, restore the previous value or recreate the wallet.",
      );
    }
    const stored: StoredWallet = {
      privateKey: decrypted as `0x${string}`,
      address: parsed.address,
      chain: parsed.chain,
      createdAt: parsed.createdAt,
    };

    // Migrate plaintext-on-disk wallets to encrypted form on first read.
    if (!onDiskKey.startsWith("enc:")) {
      try {
        writeWalletFile(stored);
      } catch {
        // best-effort migration; failure here doesn't block use
      }
    }

    return stored;
  }

  async getBalance(): Promise<WalletBalance> {
    const stored = this.getStoredWallet();
    const viemChain = stored.chain === "base" ? base : baseSepolia;
    const publicClient = createPublicClient({ chain: viemChain, transport: http() });

    const nativeBalance = await publicClient.getBalance({ address: stored.address as `0x${string}` });
    const usdcBalance = await publicClient.readContract({
      address: USDC_BY_CHAIN[stored.chain],
      abi: ERC20_BALANCE_ABI,
      functionName: "balanceOf",
      args: [stored.address as `0x${string}`],
    });

    return {
      address: stored.address,
      chain: stored.chain,
      nativeSymbol: "ETH",
      nativeBalance: formatEther(nativeBalance),
      usdcBalance: formatUnits(usdcBalance, 6),
    };
  }
}
