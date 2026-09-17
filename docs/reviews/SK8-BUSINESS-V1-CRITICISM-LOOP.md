# SK8 Scoop for Business v1: three-pass criticism review

Date: 15 September 2026
Status: branch review before any production deployment or live outreach.

## Pass 1: Operational failure and lost-lead risk

### Criticism
A website enquiry that is saved but unseen is commercially useless. An email-only notification can also fail because of a Cloudflare binding/configuration problem. Building a full CRM into D1 merely to solve that would add unnecessary duplication.

### Fix
- keep the existing D1 advertiser enquiry save as the durable inbound record;
- send a notification only after the existing POST handler has returned success;
- notification failure must not turn a successfully saved enquiry into a customer-facing error;
- add a token-protected read-only `/api/advertiser-enquiries` endpoint as a fallback queue;
- add a private noindex admin view for the latest 100 records;
- explicitly state that this queue is not the sales CRM and must be deduped against the canonical advertising CRM.

### Further issue found
Using the existing `CONTACT_EMAIL` binding would have activated notification behaviour in unrelated reader/contact flows already present in `worker.js`. That is scope creep.

### Second fix
Use a dedicated `ADVERTISER_EMAIL` binding for this feature. This keeps the advertiser slice isolated and avoids silently changing other notification behaviour.

### Result
Operational failure is contained: D1 is the durable capture, email is the alert, admin view is the fallback. No new database schema is required.

## Pass 2: Privacy, security and trust

### Criticism
The advertiser queue contains names, email addresses, phone numbers and business intentions. A public admin endpoint or token stored in browser persistence would create an unnecessary privacy/security risk. The commercial system must also avoid weakening the editorial boundary.

### Fix
- `/api/advertiser-enquiries` requires the existing `ADMIN_TOKEN` bearer value;
- endpoint is read-only;
- JSON response is `no-store`;
- admin page is `noindex,nofollow` and contains no enquiry data until authenticated;
- the token is entered manually and is not written to localStorage/sessionStorage by this page;
- no status-edit, delete, outreach-send or payment action is exposed from the admin page;
- payment page explicitly states that payment does not buy favourable editorial treatment;
- first campaign specification retains current PECR/GDPR/contact classification and suppression checks as a separate gate from commercial fit.

### Remaining test
The branch must be previewed with an invalid token and a valid token before deployment. The email destination must be verified in Cloudflare. These are runtime checks and cannot be proven from repository code alone.

## Pass 3: Complexity, economics and false progress

### Criticism
It would be easy to turn this into a mini-Salesforce/Stripe/marketing-automation build before a single £40 TEST campaign is sold. The older advertiser branch also contains useful work but is now heavily diverged from main; merging it wholesale would create technical debt and regression risk.

### Fix
Keep v1 deliberately small:
- no advertiser accounts;
- no replacement CRM;
- no D1 schema migration;
- no status-write API;
- no automatic charging;
- no Stripe account/link changes;
- no mass cold-email agent;
- no full NUE sponsor/premium inventory;
- no wholesale merge of the old advertiser branch;
- no public Campaign Finder rebuild until the current enquiry plumbing and first pilot are validated.

The stale legacy `/advertise/pay/` page is quarantined rather than rebuilt into a checkout. Approved businesses receive the agreed Stripe route only after suitability, scope, price and timing are confirmed.

### Commercial criticism
A £40 product can become uneconomic if each sale consumes substantial manual research, creative and admin time.

### Fix
The Christmas Eating Out pilot explicitly tracks Paul-time per sale/campaign and includes a stop/review rule. Do not respond to weak economics by increasing outreach volume or automation.

## Final judgement

The branch is appropriately small for a first implementation slice. The next evidence should come from runtime validation and a very small supervised advertiser batch, not additional architecture.

### Remaining approval gates
1. Preview/deploy branch changes so the enquiry path can be tested end-to-end.
2. Confirm the Cloudflare `ADVERTISER_EMAIL` destination is allowed/verified.
3. Submit one labelled test enquiry and verify D1 + email + admin view.
4. Review the first four Christmas hospitality prospects and messages.
5. Paul approves live outreach before any message is sent.
6. Stripe stays behind manual approval until the first campaign is actually accepted.
