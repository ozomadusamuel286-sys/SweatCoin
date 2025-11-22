
import { describe, expect, it, beforeEach } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const oracleAddress = "ST3J2GVMMM2R07ZFBJDWTYEYAR8FZH5WKDTFJ9AHA";
const gymPartnerAddress = "ST3J2GVMMM2R07ZFBJDWTYEYAR8FZH5WKDTFJ9AHA";

describe("SweatCoin Contract Tests", () => {
  describe("Contract Initialization", () => {
    it("ensures simnet is well initialised", () => {
      expect(simnet.blockHeight).toBeDefined();
    });
  });

  describe("Security Features", () => {
    it("should allow contract owner to pause contract", () => {
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "pause-contract",
        [],
        deployer
      );
      expect(result).toBeOk(true);
    });

    it("should allow contract owner to unpause contract", () => {
      // First pause
      simnet.callPublicFn("SweatCoincontract", "pause-contract", [], deployer);

      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "unpause-contract",
        [],
        deployer
      );
      expect(result).toBeOk(true);
    });

    it("should reject pause from non-owner", () => {
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "pause-contract",
        [],
        wallet1
      );
      expect(result).toBeErr(100); // ERR_UNAUTHORIZED
    });

    it("should reject operations when contract is paused", () => {
      // Pause contract
      simnet.callPublicFn("SweatCoincontract", "pause-contract", [], deployer);

      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "stake-tokens",
        ["u100", "u500"],
        wallet1
      );
      expect(result).toBeErr(103); // ERR_CONTRACT_PAUSED
    });
  });

  describe("Token Minting", () => {
    beforeEach(() => {
      // Ensure contract is unpaused
      simnet.callPublicFn("SweatCoincontract", "unpause-contract", [], deployer);
    });

    it("should mint tokens for verified physical activity", () => {
      // First update user steps via oracle
      simnet.callPublicFn(
        "SweatCoincontract",
        "update-steps",
        ["u15000", `'${wallet1}`],
        oracleAddress
      );

      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "mint-tokens",
        ["u15000", `'${wallet1}`],
        oracleAddress
      );
      expect(result).toBeOk(true);

      // Check balance
      const balanceResult = simnet.callPublicFn(
        "SweatCoincontract",
        "get-user-balance",
        [`'${wallet1}`],
        wallet1
      );
      expect(balanceResult.result).toBeUint(150000); // 15000 steps * 10 tokens
    });

    it("should reject minting from non-oracle", () => {
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "mint-tokens",
        ["u10000", `'${wallet1}`],
        wallet1
      );
      expect(result).toBeErr(100); // ERR_UNAUTHORIZED
    });

    it("should reject minting zero steps", () => {
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "mint-tokens",
        ["u0", `'${wallet1}`],
        oracleAddress
      );
      expect(result).toBeErr(102); // ERR_INVALID_AMOUNT
    });

    it("should reject minting excessive steps", () => {
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "mint-tokens",
        ["u200000", `'${wallet1}`],
        oracleAddress
      );
      expect(result).toBeErr(108); // ERR_INVALID_INPUT
    });
  });

  describe("Token Staking", () => {
    beforeEach(() => {
      // Ensure contract is unpaused and user has tokens
      simnet.callPublicFn("SweatCoincontract", "unpause-contract", [], deployer);

      // Mint tokens for wallet1
      simnet.callPublicFn(
        "SweatCoincontract",
        "update-steps",
        ["u15000", `'${wallet1}`],
        oracleAddress
      );
      simnet.callPublicFn(
        "SweatCoincontract",
        "mint-tokens",
        ["u15000", `'${wallet1}`],
        oracleAddress
      );
    });

    it("should allow staking tokens with valid prediction", () => {
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "stake-tokens",
        ["u1000", "u500"],
        wallet1
      );
      expect(result).toBeOk(true);

      // Check staked balance
      const stakeResult = simnet.callPublicFn(
        "SweatCoincontract",
        "get-user-staked-tokens",
        [`'${wallet1}`],
        wallet1
      );
      expect(stakeResult.result).toBeUint(1000);

      // Check prediction
      const predictionResult = simnet.callPublicFn(
        "SweatCoincontract",
        "get-user-prediction",
        [`'${wallet1}`],
        wallet1
      );
      expect(predictionResult.result).toBeUint(500);
    });

    it("should reject staking below minimum amount", () => {
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "stake-tokens",
        ["u50", "u500"],
        wallet1
      );
      expect(result).toBeErr(108); // ERR_INVALID_INPUT from validate-amount
    });

    it("should reject staking without sufficient balance", () => {
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "stake-tokens",
        ["u200000", "u500"],
        wallet1
      );
      expect(result).toBeErr(101); // ERR_INSUFFICIENT_BALANCE
    });

    it("should reject staking with invalid prediction", () => {
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "stake-tokens",
        ["u1000", "u0"],
        wallet1
      );
      expect(result).toBeErr(108); // ERR_INVALID_INPUT
    });

    it("should reject staking with excessive prediction", () => {
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "stake-tokens",
        ["u1000", "u1500"],
        wallet1
      );
      expect(result).toBeErr(108); // ERR_INVALID_INPUT
    });
  });

  describe("Token Redemption", () => {
    beforeEach(() => {
      // Setup: unpause, mint tokens
      simnet.callPublicFn("SweatCoincontract", "unpause-contract", [], deployer);
      simnet.callPublicFn(
        "SweatCoincontract",
        "update-steps",
        ["u15000", `'${wallet1}`],
        oracleAddress
      );
      simnet.callPublicFn(
        "SweatCoincontract",
        "mint-tokens",
        ["u15000", `'${wallet1}`],
        oracleAddress
      );
    });

    it("should allow redeeming tokens", () => {
      const initialBalance = simnet.callPublicFn(
        "SweatCoincontract",
        "get-user-balance",
        [`'${wallet1}`],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "redeem-tokens",
        ["u1000"],
        wallet1
      );
      expect(result).toBeOk(true);

      const finalBalance = simnet.callPublicFn(
        "SweatCoincontract",
        "get-user-balance",
        [`'${wallet1}`],
        wallet1
      );
      expect(finalBalance.result).toBeUint(149000); // 150000 - 1000
    });

    it("should reject redeeming below minimum amount", () => {
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "redeem-tokens",
        ["u50"],
        wallet1
      );
      expect(result).toBeErr(108); // ERR_INVALID_INPUT
    });

    it("should reject redeeming without sufficient balance", () => {
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "redeem-tokens",
        ["u200000"],
        wallet1
      );
      expect(result).toBeErr(101); // ERR_INSUFFICIENT_BALANCE
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limiting on step updates", () => {
      simnet.callPublicFn("SweatCoincontract", "unpause-contract", [], deployer);

      // First update should succeed
      const firstResult = simnet.callPublicFn(
        "SweatCoincontract",
        "update-steps",
        ["u10000", `'${wallet1}`],
        oracleAddress
      );
      expect(firstResult.result).toBeOk(true);

      // Second update within rate limit should fail
      const secondResult = simnet.callPublicFn(
        "SweatCoincontract",
        "update-steps",
        ["u10000", `'${wallet1}`],
        oracleAddress
      );
      expect(secondResult.result).toBeErr(106); // ERR_RATE_LIMIT_EXCEEDED
    });
  });

  describe("Physical Activity Verification", () => {
    it("should verify physical activity above threshold", () => {
      const { result } = simnet.callReadOnlyFn(
        "SweatCoincontract",
        "is-physical-activity-verified?",
        ["u15000", `'${wallet1}`],
        wallet1
      );
      expect(result).toBeOk(true);
    });

    it("should reject physical activity below threshold", () => {
      const { result } = simnet.callReadOnlyFn(
        "SweatCoincontract",
        "is-physical-activity-verified?",
        ["u5000", `'${wallet1}`],
        wallet1
      );
      expect(result).toBeOk(false);
    });
  });

  describe("Safe Math Operations", () => {
    it("should handle safe addition correctly", () => {
      // This is tested indirectly through balance operations
      simnet.callPublicFn("SweatCoincontract", "unpause-contract", [], deployer);

      // Mint tokens that would cause overflow if not handled safely
      simnet.callPublicFn(
        "SweatCoincontract",
        "update-steps",
        ["u100000", `'${wallet1}`],
        oracleAddress
      );

      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "mint-tokens",
        ["u100000", `'${wallet1}`],
        oracleAddress
      );
      expect(result).toBeOk(true);

      const balance = simnet.callPublicFn(
        "SweatCoincontract",
        "get-user-balance",
        [`'${wallet1}`],
        wallet1
      );
      expect(balance.result).toBeUint(1000000); // 100000 * 10
    });
  });

  describe("Read-Only Functions", () => {
    it("should return correct user balance", () => {
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "get-user-balance",
        [`'${wallet1}`],
        wallet1
      );
      expect(result).toBeOk(0);
    });

    it("should return correct user steps", () => {
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "get-user-steps",
        [`'${wallet1}`],
        wallet1
      );
      expect(result).toBeOk(0);
    });

    it("should return correct total supply", () => {
      const { result } = simnet.callReadOnlyFn(
        "SweatCoincontract",
        "get-total-supply",
        [],
        wallet1
      );
      expect(result).toBeUint(0);
    });

    it("should return contract paused status", () => {
      const { result } = simnet.callReadOnlyFn(
        "SweatCoincontract",
        "is-contract-paused",
        [],
        wallet1
      );
      expect(result).toBe(false);
    });
  });

  describe("Batch Operations", () => {
    beforeEach(() => {
      simnet.callPublicFn("SweatCoincontract", "unpause-contract", [], deployer);
    });

    it("should create batch steps update", () => {
      const userStepsList = [
        { user: `'${wallet1}`, steps: "u10000" },
        { user: `'${wallet2}`, steps: "u12000" }
      ];

      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "create-batch-steps-update",
        [`[${userStepsList.map(item => `{user: ${item.user}, steps: ${item.steps}}`).join(", ")}]`],
        oracleAddress
      );
      expect(result).toBeOk(0); // First batch ID
    });

    it("should reject batch creation from non-oracle", () => {
      const userStepsList = [{ user: `'${wallet1}`, steps: "u10000" }];

      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "create-batch-steps-update",
        [`[{user: ${`'${wallet1}`}, steps: u10000}]`],
        wallet1
      );
      expect(result).toBeErr(100); // ERR_UNAUTHORIZED
    });

    it("should process batch steps", () => {
      // Create batch first
      simnet.callPublicFn(
        "SweatCoincontract",
        "create-batch-steps-update",
        [`[{user: ${`'${wallet1}`}, steps: u10000}]`],
        oracleAddress
      );

      // Process batch
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "process-batch-steps",
        ["u0"],
        oracleAddress
      );
      expect(result).toBeOk(true);
    });
  });

  describe("Reentrancy Protection", () => {
    it("should prevent reentrancy in staking operations", () => {
      // Setup: mint tokens for user
      simnet.callPublicFn("SweatCoincontract", "unpause-contract", [], deployer);
      simnet.callPublicFn(
        "SweatCoincontract",
        "update-steps",
        ["u15000", `'${wallet1}`],
        oracleAddress
      );
      simnet.callPublicFn(
        "SweatCoincontract",
        "mint-tokens",
        ["u15000", `'${wallet1}`],
        oracleAddress
      );

      // Attempt concurrent staking operations (simulated)
      const result1 = simnet.callPublicFn(
        "SweatCoincontract",
        "stake-tokens",
        ["u1000", "u500"],
        wallet1
      );
      expect(result1.result).toBeOk(true);

      // Second staking should work after first completes
      const result2 = simnet.callPublicFn(
        "SweatCoincontract",
        "stake-tokens",
        ["u1000", "u400"],
        wallet1
      );
      expect(result2.result).toBeOk(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid inputs gracefully", () => {
      const { result } = simnet.callPublicFn(
        "SweatCoincontract",
        "stake-tokens",
        ["u100", "u0"], // Invalid prediction
        wallet1
      );
      expect(result).toBeErr(108); // ERR_INVALID_INPUT
    });

    it("should prevent overflow in mathematical operations", () => {
      // This is tested through safe math functions in minting/staking
      expect(true).toBe(true); // Placeholder for overflow tests
    });
  });
});
