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

(define-public (mint-tokens (steps uint) (user principal))
  (begin
    ;; ensure verification returns (ok true)
    (asserts! (is-ok (is-physical-activity-verified? steps user)) (err "Activity not verified"))
    (let ((mint-amount (* steps u10)))
      (mint mint-amount user)
    )
  )
)

;; Constants
(define-constant activity-verification-threshold u10000)  ;; e.g. 10,000 steps needed for minting tokens

;; Data maps
(define-map user-steps principal uint) ;; Track user's steps

;; Data maps
(define-map user-balances principal uint) ;; Track balances of SWEAT tokens
(define-map user-stakes principal uint)   ;; Track staked tokens
(define-map user-predictions principal uint) ;; Track user's health prediction (e.g. weight loss goal)

;; public functions
(define-public (stake-tokens (amount uint) (prediction uint))
  (let (
        (user tx-sender)
        (bal (default-to u0 (map-get? user-balances user)))
        (staked (default-to u0 (map-get? user-stakes user)))
      )
    (asserts! (>= amount u100) (err "Minimum stake is 100 tokens"))
    (asserts! (>= bal amount) (err "Insufficient balance to stake"))
    (begin
      (map-set user-balances user (- bal amount))
      (map-set user-stakes user (+ staked amount))
      (map-set user-predictions user prediction)
      (ok "Tokens staked successfully")
    )
  )
)

(define-public (redeem-tokens (amount uint))
  (let (
        (user tx-sender)
        (bal (default-to u0 (map-get? user-balances user)))
      )
    (asserts! (>= amount u100) (err "Minimum redeem is 100 tokens"))
    (asserts! (>= bal amount) (err "Insufficient balance"))
    (begin
      (map-set user-balances user (- bal amount))
      ;; Transfer tokens to gym or health services (stub)
      (unwrap! (transfer-tokens amount gym-partners-address) (err "transfer failed"))
      (ok "Tokens redeemed successfully")
    )
  )
)

(define-public (get-user-balance (user principal))
  (ok (default-to u0 (map-get? user-balances user)))
)

(define-public (get-user-steps (user principal))
  (ok (default-to u0 (map-get? user-steps user)))
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
  (let ((bal (default-to u0 (map-get? user-balances to))))
    (begin
      (map-set user-balances to (+ bal amount))
      (ok "Tokens minted successfully")
    )
  )
)

(define-private (transfer-tokens (amount uint) (to principal))
  (begin
    ;; Transfer logic - assuming transfer to gym or health service contract
    ;; This will interface with external services (via oracle or API).
    (ok "Tokens transferred")
  )
)

;; Example of updating user's steps via oracle
(define-public (update-steps (steps uint) (user principal))
  (begin
    (map-set user-steps user steps)
    (ok "Steps updated successfully")
  )
)

