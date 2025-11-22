;; title: SweatCoin - Proof-of-Physical-Work Mining Contract
;; version: 1.0.0
;; summary: Mint tokens based on real-world physical activities and engage in health prediction markets.
;; description: This contract allows users to mint the SWEAT token by proving physical activity, stake tokens for health predictions, and redeem tokens for gym memberships and health services.

;; traits removed for now - add valid trait signatures later if needed

;; token definitions
(define-constant token-name "SWEAT")
(define-constant token-symbol "SWT")

;; use uint for decimals to avoid signed/int usage
(define-constant token-decimals u18)

;; replace placeholder principals with a valid devnet/testnet principal for now
;; TODO: make these configurable via admin setters
(define-constant oracle-address 'ST3J2GVMMM2R07ZFBJDWTYEYAR8FZH5WKDTFJ9AHA)
(define-constant gym-partners-address 'ST3J2GVMMM2R07ZFBJDWTYEYAR8FZH5WKDTFJ9AHA)
(define-constant contract-owner tx-sender)

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_INSUFFICIENT_BALANCE (err u101))
(define-constant ERR_INVALID_AMOUNT (err u102))
(define-constant ERR_CONTRACT_PAUSED (err u103))
(define-constant ERR_OVERFLOW (err u104))
(define-constant ERR_UNDERFLOW (err u105))
(define-constant ERR_RATE_LIMIT_EXCEEDED (err u106))
(define-constant ERR_ACTIVITY_NOT_VERIFIED (err u107))
(define-constant ERR_INVALID_INPUT (err u108))

;; Security constants
(define-constant MIN_STAKE_AMOUNT u100)
(define-constant MIN_REDEEM_AMOUNT u100)
(define-constant RATE_LIMIT_BLOCKS u10)
(define-constant MAX_STEPS_PER_UPDATE u100000)

;; Reentrancy guard
(define-data-var reentrancy-guard bool true)

(define-public (mint-tokens (steps uint) (user principal))
  (begin
    (asserts! (not (var-get contract-paused)) ERR_CONTRACT_PAUSED)
    (asserts! (is-eq tx-sender oracle-address) ERR_UNAUTHORIZED)
    (asserts! (> steps u0) ERR_INVALID_AMOUNT)
    (asserts! (<= steps MAX_STEPS_PER_UPDATE) ERR_INVALID_INPUT)
    ;; ensure verification returns (ok true)
    (asserts! (unwrap! (is-physical-activity-verified? steps user) ERR_ACTIVITY_NOT_VERIFIED) ERR_ACTIVITY_NOT_VERIFIED)
    (let ((mint-amount (unwrap! (safe-mul steps u10) ERR_OVERFLOW)))
      (mint mint-amount user)
    )
  )
)

;; Constants
(define-constant activity-verification-threshold u10000)  ;; e.g. 10,000 steps needed for minting tokens

;; Data vars
(define-data-var contract-paused bool false)
(define-data-var total-supply uint u0)

;; Data maps
(define-map user-steps principal uint) ;; Track user's steps
(define-map user-balances principal uint) ;; Track balances of SWEAT tokens
(define-map user-stakes principal uint)   ;; Track staked tokens
(define-map user-predictions principal uint) ;; Track user's health prediction (e.g. weight loss goal)
(define-map last-update-block principal uint) ;; Rate limiting

;; Batch operations data structures
(define-data-var next-batch-id uint u0)
(define-map batch-steps {batch-id: uint, user: principal} {steps: uint, verified: bool})
(define-map batch-transfers {batch-id: uint, user: principal} {amount: uint, recipient: principal})

;; Security helper functions

(define-private (safe-add (a uint) (b uint))
  (let ((result (+ a b)))
    (asserts! (>= result a) ERR_OVERFLOW)
    (ok result)))

(define-private (safe-sub (a uint) (b uint))
  (if (>= a b)
    (ok (- a b))
    ERR_UNDERFLOW))

(define-private (safe-mul (a uint) (b uint))
  (let ((result (* a b)))
    (asserts! (or (is-eq b u0) (is-eq (/ result b) a)) ERR_OVERFLOW)
    (ok result)))

(define-private (check-rate-limit (user principal))
  (let ((current-block stacks-block-height)
        (last-block (default-to u0 (map-get? last-update-block user))))
    (asserts! (>= (- current-block last-block) RATE_LIMIT_BLOCKS) ERR_RATE_LIMIT_EXCEEDED)
    (map-set last-update-block user current-block)
    (ok true)))

;; Reentrancy protection
(define-private (non-reentrant)
  (let ((guard (var-get reentrancy-guard)))
    (asserts! guard ERR_UNAUTHORIZED)
    (var-set reentrancy-guard false)
    (ok true)))

(define-private (release-guard)
  (begin
    (var-set reentrancy-guard true)
    (ok true)))

;; Enhanced validation helpers
(define-private (validate-principal (user principal))
  (begin
    (asserts! (not (is-eq user (as-contract tx-sender))) ERR_INVALID_INPUT)
    (ok true)))

(define-private (validate-amount (amount uint) (min-amount uint))
  (begin
    (asserts! (>= amount min-amount) ERR_INVALID_AMOUNT)
    (ok true)))

;; public functions

;; Pause contract (owner only)
(define-public (pause-contract)
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR_UNAUTHORIZED)
    (asserts! (not (var-get contract-paused)) ERR_INVALID_INPUT)
    (var-set contract-paused true)
    (ok true)))

;; Unpause contract (owner only)
(define-public (unpause-contract)
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR_UNAUTHORIZED)
    (asserts! (var-get contract-paused) ERR_INVALID_INPUT)
    (var-set contract-paused false)
    (ok true)))
(define-public (stake-tokens (amount uint) (prediction uint))
  (let (
        (user tx-sender)
        (bal (default-to u0 (map-get? user-balances user)))
        (staked (default-to u0 (map-get? user-stakes user)))
      )
    (asserts! (not (var-get contract-paused)) ERR_CONTRACT_PAUSED)
    (asserts! (not (is-eq user (as-contract tx-sender))) ERR_INVALID_INPUT)
    (asserts! (>= amount MIN_STAKE_AMOUNT) ERR_INVALID_AMOUNT)
    (asserts! (<= amount bal) ERR_INSUFFICIENT_BALANCE)
    (asserts! (> prediction u0) ERR_INVALID_INPUT)
    (asserts! (<= prediction u1000) ERR_INVALID_INPUT)
    (asserts! (var-get reentrancy-guard) ERR_UNAUTHORIZED)
    (var-set reentrancy-guard false)
    (map-set user-balances user (- bal amount))
    (map-set user-stakes user (+ staked amount))
    (map-set user-predictions user prediction)
    (var-set reentrancy-guard true)
    (ok true)
  )
)

(define-public (redeem-tokens (amount uint))
  (let (
        (user tx-sender)
        (bal (default-to u0 (map-get? user-balances user)))
      )
    (asserts! (not (var-get contract-paused)) ERR_CONTRACT_PAUSED)
    (asserts! (not (is-eq user (as-contract tx-sender))) ERR_INVALID_INPUT)
    (asserts! (>= amount MIN_REDEEM_AMOUNT) ERR_INVALID_AMOUNT)
    (asserts! (<= amount bal) ERR_INSUFFICIENT_BALANCE)
    (asserts! (var-get reentrancy-guard) ERR_UNAUTHORIZED)
    (var-set reentrancy-guard false)
    ;; Update balance first (reentrancy protection)
    (map-set user-balances user (- bal amount))
    ;; Transfer tokens to gym or health services (stub)
    ;; Note: transfer-tokens is a stub that always succeeds - removed to avoid compilation issues
    ;; (transfer-tokens amount gym-partners-address)
    (var-set reentrancy-guard true)
    (ok true)
  )
)

(define-public (get-user-balance (user principal))
  (ok (default-to u0 (map-get? user-balances user)))
)

(define-public (get-user-staked-tokens (user principal))
  (ok (default-to u0 (map-get? user-stakes user)))
)

(define-public (get-user-prediction (user principal))
  (ok (default-to u0 (map-get? user-predictions user)))
)


;; read-only functions
(define-read-only (is-physical-activity-verified? (steps uint) (user principal))
  (let ((stored-steps (default-to u0 (map-get? user-steps user))))
    (if (>= steps activity-verification-threshold)
      (ok true)
      (ok false)
    )
  )
)

(define-read-only (get-user-mintable-amount (user principal))
  (let ((steps (default-to u0 (map-get? user-steps user))))
    (ok (* steps u10))
  )
)

;; private functions
(define-private (mint (amount uint) (to principal))
  (let (
    (bal (default-to u0 (map-get? user-balances to)))
    (current-supply (var-get total-supply))
  )
    (let (
      (new-balance (unwrap! (safe-add bal amount) ERR_OVERFLOW))
      (new-supply (unwrap! (safe-add current-supply amount) ERR_OVERFLOW))
    )
      (map-set user-balances to new-balance)
      (var-set total-supply new-supply)
      (ok true)
    )
  )
)

(define-private (transfer-tokens (amount uint) (to principal))
  (begin
    ;; Transfer logic - assuming transfer to gym or health service contract
    ;; This will interface with external services (via oracle or API).
    (ok true)
  )
)

;; Example of updating user's steps via oracle
(define-public (update-steps (steps uint) (user principal))
  (begin
    (asserts! (not (var-get contract-paused)) ERR_CONTRACT_PAUSED)
    (asserts! (is-eq tx-sender oracle-address) ERR_UNAUTHORIZED)
    (asserts! (> steps u0) ERR_INVALID_AMOUNT)
    (asserts! (<= steps MAX_STEPS_PER_UPDATE) ERR_INVALID_INPUT)
    (try! (check-rate-limit user))
    (map-set user-steps user steps)
    (ok true)
  )
)

;; NEW: Security read-only functions
(define-read-only (is-contract-paused)
  (var-get contract-paused))

(define-read-only (get-total-supply)
  (var-get total-supply))

(define-read-only (get-rate-limit-blocks)
  RATE_LIMIT_BLOCKS)

(define-read-only (get-last-update-block (user principal))
  (default-to u0 (map-get? last-update-block user)))

