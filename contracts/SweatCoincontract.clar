;; title: SweatCoin - Proof-of-Physical-Work Mining Contract
;; version: 1.0.0
;; summary: Mint tokens based on real-world physical activities and engage in health prediction markets.
;; description: This contract allows users to mint the SWEAT token by proving physical activity, stake tokens for health predictions, and redeem tokens for gym memberships and health services.

;; traits
(define-trait minting-trait
  (mint (amount uint) (to principal))
)

(define-trait staking-trait
  (stake (amount uint) (prediction uint) (user principal))
)

(define-trait redeem-trait
  (redeem (amount uint) (user principal))
)

;; token definitions
(define-constant token-name "SWEAT")
(define-constant token-symbol "SWT")
(define-constant token-decimals 18)

(define-constant oracle-address 'SP1A2Z3K4...')
(define-constant gym-partners-address 'SP2B3Y4Z5...')

(define-public (mint-tokens (steps uint) (user principal))
  (begin
    (asserts! (is-physical-activity-verified? steps user) (err "Activity not verified"))
    (let ((mint-amount (mul steps 10)))
      (mint mint-amount user)
    )
  )
)

;; Constants
(define-constant activity-verification-threshold 10000)  ;; e.g. 10,000 steps needed for minting tokens

;; Data vars
(define-map user-steps (principal) (uint)) ;; Track user's steps

;; Data maps
(define-map user-balances (principal) (uint)) ;; Track balances of SWEAT tokens
(define-map user-stakes (principal) (uint))   ;; Track staked tokens
(define-map user-predictions (principal) (uint)) ;; Track user's health prediction (e.g. weight loss goal)

;; public functions
(define-public (stake-tokens (amount uint) (prediction uint))
  (let ((user (sender)))
    (asserts! (>= amount 100) (err "Minimum stake is 100 tokens"))
    (begin
      (update-map user-balances user (sub (get user-balances user) amount))
      (update-map user-stakes user (add (get user-stakes user) amount))
      (update-map user-predictions user prediction)
      (ok "Tokens staked successfully")
    )
  )
)

(define-public (redeem-tokens (amount uint))
  (let ((user (sender)))
    (asserts! (>= amount 100) (err "Minimum redeem is 100 tokens"))
    (asserts! (>= (get user-balances user) amount) (err "Insufficient balance"))
    (begin
      (update-map user-balances user (sub (get user-balances user) amount))
      ;; Transfer tokens to gym or health services
      (transfer-tokens amount gym-partners-address)
      (ok "Tokens redeemed successfully")
    )
  )
)

(define-public (get-user-balance (user principal))
  (get user-balances user)
)

(define-public (get-user-steps (user principal))
  (get user-steps user)
)

(define-public (get-user-staked-tokens (user principal))
  (get user-stakes user)
)

(define-public (get-user-prediction (user principal))
  (get user-predictions user)
)


;; read-only functions
(define-read-only (is-physical-activity-verified? (steps uint) (user principal))
  (let ((user-steps (get user-steps user)))
    (if (>= steps activity-verification-threshold)
      (ok true)
      (err "Activity not verified")
    )
  )
)

(define-read-only (get-user-mintable-amount (user principal))
  (let ((steps (get user-steps user)))
    (ok (* steps 10))
  )
)

;; private functions
(define-private (mint (amount uint) (to principal))
  (begin
    (update-map user-balances to (add (get user-balances to) amount))
    (ok "Tokens minted successfully")
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
    (update-map user-steps user steps)
    (ok "Steps updated successfully")
  )
)

