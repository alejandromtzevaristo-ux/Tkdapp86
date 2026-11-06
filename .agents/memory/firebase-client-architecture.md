---
name: Firebase client architecture
description: App TKD's Firebase choice and offline data approach.
---

App TKD uses Firebase's web SDK directly for email/password authentication, Firestore, and Storage, with persistent Firestore caching for offline work.

**Why:** the user chose direct Firebase SDK over PostgreSQL after Firebase was not available as a managed integration.

**How to apply:** keep Firebase as the system of record and preserve the UID-scoped Firestore/Storage paths and offline sync; ask before replacing it with another database.
