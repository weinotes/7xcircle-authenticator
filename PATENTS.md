# Patent Policy

Author: Davey Wong <wgwcko@gmail.com> (https://www.guangweiblog.com)

## 1. This project claims no patents

7X Circle Authenticator is an independent client implementation of published,
royalty-free standards. The project has no patents, no pending patent
applications, and claims no patentable invention over anything in this
repository. Nothing here is a patent filing, a defensive publication, or a
promise of validity.

## 2. Standards implemented

| Area | Specification |
|---|---|
| TOTP | RFC 6238 |
| HOTP | RFC 4226 |
| Base32 secret encoding | RFC 4648 |
| PBKDF2-HMAC-SHA256 key derivation | RFC 8018 (PKCS #5 v2.1) |
| AES-256-GCM sealing | NIST SP 800-38D |
| `otpauth://` and `otpauth-migration://` URIs | Google Authenticator key URI format (de facto) |

RFC 4226 states that the algorithm "is made freely available to the developer
community under the terms and conditions of the IETF Intellectual Property
Rights" and was specified by the OATH initiative "to facilitate collaboration
among strong authentication technology providers", so implementing it is
expected to be unencumbered. Third-party runtime dependencies (`otpauth`,
React, Capacitor, zustand, `uuid`) are used unmodified under their own licences.

## 3. No patent search, no warranty

No freedom-to-operate or patent-landscape search has been performed. No
warranty of non-infringement is given, and no indemnity is offered — the licence
in `LICENSE` (Apache-2.0, §7, "AS IS" BASIS) governs. Anyone shipping this
software commercially inside a patent-heavy jurisdiction should do their own
clearance.

## 4. Patent grant from contributions

The Apache License, Version 2.0 (§3) applies to every contribution: by
submitting a pull request you grant a perpetual, worldwide, non-exclusive,
royalty-free patent licence over the patents you own or control that are
necessarily infringed by your contribution. Do not contribute code covered by a
patent you are not licensed to grant.

## 5. Trademarks are separate from this licence

"7X Circle" is the club's brand name. This repository grants no trademark
licence. The logo assets shipped here are an AI-generated draft that is **not**
an approved brand asset — see `docs/logo-guidelines.md`.
