# Fix the SK8 Scoop welcome automation

Use this after deploying v7.6.

1. In MailerLite, open **Automations** and open the welcome workflow.
2. Confirm the workflow is **Active**, not Draft or Paused.
3. Set the trigger to **Joins a group**.
4. Select the group exactly named **sk8 Subscribers**.
5. Make the first workflow step **Send email** with no delay before it.
6. Open the email step and confirm the subject, sender and email design are fully saved.
7. Activate the workflow.
8. Open the workflow **Activity** tab and search for the test address.
   - **Queued:** check for a delay step.
   - **Failed:** open the failure reason and repair the email step.
   - **Canceled:** check group membership and exclusions.
   - **Not listed:** the workflow was inactive or the trigger/group is wrong.
9. Because the test subscriber joined before the repair, use **Add subscribers** in the workflow and add that test address from the start. Alternatively, test again with a completely new plus-address.
10. Test with a new address such as `yourname+sk8test8@gmail.com`, then confirm:
    - the website displays the local success page;
    - the subscriber appears in **sk8 Subscribers**;
    - the address appears in the workflow Activity tab;
    - the first welcome email arrives.

Use the group trigger rather than a single-form trigger so both the main website form and QR form can start the same welcome sequence.
