# Update Firestore Rules

## Goal

Fix `packingRecords` not loading in Dashboard by updating Firestore Security Rules. The current rules only cover the `/users` collection, blocking access to `packingRecords`.

## Problem

The current rules are restrictive and do not mention `packingRecords` at all:

```javascript
match /users/{userId} { ... }
```

This implicitly denies all access to other collections, including `/packingRecords` which the Dashboard relies on.

## Proposed Rules

Add a rule block for `packingRecords` to allow authenticated users (or anyone, depending on needs) to read/write.

Since the app seems to be for internal company use (based on role 'admin'/'user'), we should allow:

- **Read**: Authenticated users.
- **Write**: Authenticated users (or just Admins, if safer).

### Proposed Rule Update

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Existing Users collection rules...
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow update: if request.auth != null && (
        (request.auth.uid == userId && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'status'])) ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow create: if request.auth != null && request.auth.uid == userId;
    }

    // NEW: Packing Records rules
    match /packingRecords/{recordId} {
      // Allow any authenticated user to read/write packing records
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'approved';
    }
  }
}
```

## Action

I cannot update Firestore rules directly via code. I must provide the correct rules to the user to paste into their Firebase Console.

### Verification

- User updates rules in Firebase Console.
- Refresh Dashboard page -> Data should appear (or empty state instead of error).
