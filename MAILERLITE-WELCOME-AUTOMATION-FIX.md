# Fix the SK8 Scoop welcome automation

Use this after deploying v8.5.

1. In MailerLite, open **Automations** and open the welcome workflow.
2. Confirm the workflow is **Active**, not Draft or Paused.
3. Set the trigger to **Joins a group**.
4. Select the group exactly named **sk8 Subscribers**.
5. Make the first workflow step **Send email** with no delay before it.
6. Open the email step and confirm the subject, sender and email design are fully saved.
7. In the welcome email, set **Read the latest SK8 Scoop** to `https://www.sk8scoop.com/latest`.
8. Set **See the SK8 Summer Guide** to `https://sk8scoop-uyx0q8.subscribepage.io` for people who are already newsletter subscribers.
9. Keep the welcome email immediate. If a separate Summer Guide email is also triggered by the normal newsletter signup, add a **5-minute delay** before that second email. Keep delivery immediate when the Summer Guide itself is the promised signup reward.
10. Activate the workflow.
11. Open the workflow **Activity** tab and search for the test address.
   - **Queued:** check for a delay step.
   - **Failed:** open the failure reason and repair the email step.
   - **Canceled:** check group membership and exclusions.
   - **Not listed:** the workflow was inactive or the trigger/group is wrong.
12. Because the test subscriber joined before the repair, use **Add subscribers** in the workflow and add that test address from the start. Alternatively, test again with a completely new plus-address.
13. Test with a completely new plus-address, then confirm:
    - the website displays the local success page;
    - the subscriber appears in **sk8 Subscribers**;
    - the address appears in the workflow Activity tab;
    - the welcome email arrives immediately;
    - **Read the latest SK8 Scoop** opens Issue 6 through `/latest`;
    - the Summer Guide link opens `https://sk8scoop-uyx0q8.subscribepage.io`;
    - any separate Summer Guide email arrives about five minutes later, not simultaneously.

Use the group trigger rather than a single-form trigger so both the main website form and QR form can start the same welcome sequence.
