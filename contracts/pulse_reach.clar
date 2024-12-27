;; PulseReach - Healthcare Professional Network Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-already-exists (err u103))

;; Define token
(define-fungible-token pulse)

;; Data structures
(define-map professionals 
  principal 
  {
    name: (string-ascii 50),
    credentials: (string-ascii 200),
    specialty: (string-ascii 50),
    verified: bool
  }
)

(define-map posts 
  uint 
  {
    author: principal,
    content: (string-utf8 500),
    timestamp: uint,
    likes: uint
  }
)

(define-map collaborations
  uint
  {
    name: (string-ascii 100),
    creator: principal,
    members: (list 20 principal),
    description: (string-utf8 500)
  }
)

;; Data variables
(define-data-var post-id-nonce uint u0)
(define-data-var collab-id-nonce uint u0)

;; Professional profile functions
(define-public (register-professional (name (string-ascii 50)) (credentials (string-ascii 200)) (specialty (string-ascii 50)))
  (let ((profile {name: name, credentials: credentials, specialty: specialty, verified: false}))
    (if (is-none (map-get? professionals tx-sender))
      (begin
        (map-set professionals tx-sender profile)
        (ok true))
      err-already-exists))
)

(define-public (verify-professional (address principal))
  (if (is-eq tx-sender contract-owner)
    (match (map-get? professionals address)
      profile (begin 
        (map-set professionals address (merge profile {verified: true}))
        (try! (ft-mint? pulse u100 address))
        (ok true))
      err-not-found)
    err-owner-only)
)

;; Post functions
(define-public (create-post (content (string-utf8 500)))
  (let ((post-id (var-get post-id-nonce)))
    (map-set posts post-id {
      author: tx-sender,
      content: content,
      timestamp: block-height,
      likes: u0
    })
    (var-set post-id-nonce (+ post-id u1))
    (ok post-id))
)

(define-public (like-post (post-id uint))
  (match (map-get? posts post-id)
    post (begin
      (map-set posts post-id (merge post {likes: (+ (get likes post) u1)}))
      (try! (ft-mint? pulse u1 (get author post)))
      (ok true))
    err-not-found)
)

;; Collaboration functions
(define-public (create-collaboration (name (string-ascii 100)) (description (string-utf8 500)))
  (let ((collab-id (var-get collab-id-nonce)))
    (map-set collaborations collab-id {
      name: name,
      creator: tx-sender,
      members: (list tx-sender),
      description: description
    })
    (var-set collab-id-nonce (+ collab-id u1))
    (ok collab-id))
)

(define-public (join-collaboration (collab-id uint))
  (match (map-get? collaborations collab-id)
    collaboration (begin
      (map-set collaborations 
        collab-id 
        (merge collaboration 
          {members: (append (get members collaboration) tx-sender)}))
      (ok true))
    err-not-found)
)

;; Read-only functions
(define-read-only (get-professional (address principal))
  (ok (map-get? professionals address))
)

(define-read-only (get-post (post-id uint))
  (ok (map-get? posts post-id))
)

(define-read-only (get-collaboration (collab-id uint))
  (ok (map-get? collaborations collab-id))
)