# V2.1 Parent / learner security implementation plan

**Status:** development only. Do NOT merge or run migration until account migration is planned and tested.

## Why a PIN is insufficient
The existing `learning_progress.game_state` stores learning and rewards together and can be updated by anyone signed into the shared family account. Hidden parent buttons do not protect those writes.

## Target access model
- Parent signs in using current family email account, with a separate device and session.
- Learner signs in using a distinct Supabase Auth user (a child-specific login). Do not disclose the parent password.
- An administrator links `parent_user_id` and `child_user_id` in `maths_families`.
- Learner can write only `maths_learning.progress` for their own uid; parent may read it.
- Parent-only RPC changes coin bonuses and redemption counters in `maths_rewards`; its authority is verified on the server.
- No client may update reward tables or create reward events directly.
- Current `learning_progress` remains intact until verified migration, then legacy write policy must be revoked/retired.

## Next implementation steps
1. Create child auth account and securely establish both UUIDs in Supabase Auth dashboard.
2. Review SQL and run in Supabase SQL Editor; insert one family link using verified UUIDs.
3. Refactor game state: strip `bonus`, `redeemed`, `rewardLog` and manually added coins from client-writable learning; derive totals from server-authorized reward state.
4. Migrate existing progress once, backed up first, and verify equality before changing the site.
5. Use distinct parent/learner UIs and disable parent actions during RPC requests.
6. Test negative authorization using separate accounts, including direct REST attempts; test double-clicks and retries before production.
7. Deploy to main only after full Work browser retest.

**Known limitation:** client-measured learning time can be manipulated; strengthen trusted time measurements separately. Do not treat client-recorded learning time as authoritative for financial rewards.
