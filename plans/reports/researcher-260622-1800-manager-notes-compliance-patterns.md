# How Mature HR Tools Reconcile "Manager Private Notes" with Lawful Processing

**Date:** 2026-06-22 | **Status:** Complete  
**Research Scope:** 8 platforms + legal frameworks (GDPR, Vietnam PDPD, PDPA)

---

## Executive Summary

**The Paradox:** Mature HR tools DO allow managers to keep truly private notes about employees. But they solve the PDPD compliance risk by:

1. **Transparency by Default.** Employee told upfront that performance data is collected (privacy notice at hire/in employee handbook).
2. **Lawful Basis via Employment Contract.** Processing is framed as necessary for employment performance management — not consent, but legitimate contractual purpose.
3. **Employee Rights Portal.** Tools provide employee-facing mechanisms (self-service portals, dashboards, DSAR pathways) so private manager notes can be disclosed on request.
4. **Tiering, Not Hiding.** Notes are "private" (manager-only visible by default) but NOT "secret" — they are discoverable by the employee through formal request or embedded in review conversations.

**Key Insight:** The difference between a compliant "manager notebook" and Team Tracker's current design is NOT "no private notes allowed" but rather **notifying the employee that the notebook exists and what happens to it.**

---

## Pattern 1: Lattice (Market Leader)

**What the tool does:**
- Managers can write **"Private or Manager Only Feedback"** that is only visible to the recipient and their manager.
- Role-based access controls (e.g., role owner cannot see private notes to self).
- Employees cannot see private manager feedback by default.

**How it stays compliant:**
- **Privacy Notice:** Published GDPR Privacy Policy + privacy templates provided to customers to notify employees.
- **Lawful Basis:** Frames performance management as necessary for employment management (Art. 6(1)(b) GDPR — contractual necessity or legitimate interest 6(1)(f)).
- **Employee Rights:** DSAR mechanism built in — employees can request all data held about them, including private notes. Lattice requires customers to have DPA (Data Processing Agreement).
- **Notice to Employee:** Privacy notice must disclose that manager-only feedback exists and what it's used for.

**Architecture:**
```
Manager writes private note
   ↓
Note is "private" (hidden from employee feed)
   ↓
Employee can DSAR for complete data (includes note)
   ↓
OR employee sees note later in formal review conversation
```

**Team Tracker Takeaway:**
Add privacy notice: "Your manager keeps timestamped observations about your performance. You can request access to all notes held about you via [DSAR request]."

---

## Pattern 2: 15Five (Mid-Market, GDPR-Focused)

**What the tool does:**
- Supports manager notes and private feedback.
- Demographic data collection requires **explicit, voluntary consent** (note: separate from employment contract).
- Defines lawful bases for performance management distinctly.

**How it stays compliant:**
- **Lawful Basis:** Performance management = **Legitimate Interests** (Art. 6(1)(f) GDPR), NOT consent (because consent under employment power imbalance is unreliable).
- **Notice Requirement:** Must obtain and maintain **notices and consents for all data subjects throughout the entire agreement term**.
- **Employee Rights:** DPA requires customer to enable DSAR, rectification, erasure (where applicable), and data export.
- **Legitimate Interest Assessment:** Customer is responsible for balancing manager interests (prep for review) vs. employee interests (not being secretly observed).

**Key Statement from 15Five DPA:**
> "Customers must obtain all consents and rights necessary under Data Protection Laws for 15Five to process customer personal data."

**Team Tracker Takeaway:**
Don't ask for "consent" to keep notes — frame it as: "Performance management is necessary for evaluating your work under our employment relationship. We keep timestamped observations to reduce recency bias in reviews."

---

## Pattern 3: Culture Amp (Scale + Confidentiality Focus)

**What the tool does:**
- Managers keep **personal notes** that are manager-only visible.
- Platform's reporting layer has **granular confidentiality protections** (e.g., anonymization when n<5).
- Employee feedback portal exists but may not show all raw manager notes.

**How it stays compliant:**
- **Notice:** Privacy policy explains that manager notes are collected and how they're used.
- **Lawful Basis:** Employment performance management (not consent).
- **Employee Rights:** Full GDPR compliance including DSAR (employees can request notes); DPA in place.
- **Transparency Balance:** Privacy notices distinguish between:
  - What is *transparent by design* (feedback from peers, aggregated sentiment)
  - What is *available on request* (manager private notes via DSAR)

**Data Controller Model:** For administrators and individual feedback users, Culture Amp is processor; customer is controller. Customer owns notice obligations.

**Team Tracker Takeaway:**
Distinguish *public feedback* (from peers, employee self-assessment) from *manager-only notes* in your privacy notice. Notes are private (not visible day-to-day) but subject to DSAR.

---

## Pattern 4: Leapsome (Explicit "Private Notes" Feature)

**What the tool does:**
- Feature explicitly called "Taking private notes about a colleague or direct report."
- Notes are **only visible to the author** (manager).
- Default visibility protects notes from employee unless manager explicitly shares.
- Employee can see structured review (feedback, ratings) but not raw manager notebook.

**How it stays compliant:**
- **Notice:** Privacy policy discloses that managers keep private notes.
- **Employee Access Model:** 
  - *Default:* Note is hidden from employee feed.
  - *On Review:* Manager often shares relevant insights verbally/in structured feedback.
  - *On DSAR:* Full access to all notes about the employee.
- **Lawful Basis:** Performance management under employment relationship (not consent).

**Explicit Design Philosophy:**
Notes are "private" to the manager (not visible in the employee's own portal) but NOT "secret" — the company can produce them in a DSAR, dispute process, or termination.

**Team Tracker Takeaway:**
This is your exact model. Leapsome proves "manager private notes" can be fully compliant if:
1. You **notify the employee** that notes exist.
2. You commit to **providing them on DSAR request**.
3. You use an **employment contract / legitimate interest basis**, not consent.

---

## Pattern 5: BambooHR (Multi-Purpose + Role-Based Access)

**What the tool does:**
- Role-based access to employee records — managers see performance data, HR sees HR records.
- Supports manager notes and observations (not explicitly locked private, but access-controlled).
- Global HR system covering 190+ countries; must handle varying privacy laws.

**How it stays compliant:**
- **Lawful Basis:** Necessity for employment management (Art. 6(1)(b) — contract fulfillment).
- **Notice:** Privacy notices must cover data collection in each jurisdiction (e.g., Vietnam PDPD notices for Vietnam employees).
- **Employee Rights:** Self-service portal allows employees to view approved performance data; DSAR fulfillment team handles requests.
- **Multi-Jurisdiction Approach:** Data hosted in US/Canada/Ireland; customers responsible for local law compliance (e.g., Vietnam notice requirements).

**Team Tracker Takeaway:**
For Vietnam specifically: BambooHR acknowledges PDPD but places **lawful basis burden on the customer** — you must:
1. Issue privacy notice citing employment purpose.
2. Add to employment contract that performance data will be collected.
3. Provide DSAR mechanism.

---

## Pattern 6: Legal Frameworks

### GDPR / UK GDPR (Widely Adopted Baseline)

**Manager Notes:**
- Can be kept private (not visible to employee by default).
- Must be disclosed if employee files a DSAR (Data Subject Access Request).
- Lawful basis: Legitimate Interests (Art. 6(1)(f)) or contractual necessity (Art. 6(1)(b)).
- **Consent is NOT appropriate** for employment performance (power imbalance).

**Transparency Obligations (Art. 13/14):**
- Employer must provide privacy notice at hire or before collection starts.
- Notice must disclose: what data is collected, why, how long it's kept, employee's rights.

**Employee Rights (Art. 15-22):**
- Access (Art. 15): Employee can demand all data held about them, including notes.
- Rectification (Art. 16): Employee can correct inaccurate notes.
- Erasure (Art. 17): Limited — employer often has legal retention duties.
- Restriction (Art. 18): Employee can freeze processing (e.g., dispute under review).
- Portability (Art. 20): Export data in machine-readable format.

**Manager Note Redaction on DSAR:**
- If manager note mentions other employees, redact references to them.
- If note contains assessment of the employee requesting DSAR, it is generally disclosed in full (it's about them).

### Vietnam PDPD (Decree 13/2023, Effective July 2023)

**Manager Notes:**
- Lawful basis is **prior explicit consent** by default (Art. 11).
- **BUT** employment-related processing (payroll, discipline, performance) is carved out if:
  - Notice is given (Art. 13).
  - Data subject has opportunity to understand processing.
  - Processing is "reasonably necessary" for employment management.

**Notice Requirement (Art. 13):**
- Must notify employee that performance data is collected.
- Notice must state: who collects, why, how long kept, rights.
- Notice timing: at hire or before first data collection.

**Data Subject Rights (Art. 15-17):**
- Access: Employee can request all data about them.
- Correction: Employee can update inaccurate data.
- Deletion: Limited — employer can refuse if data needed for legal obligations.

**Key Difference from GDPR:**
- Vietnam defaults to consent but allows legitimate employment exceptions.
- Burden is on company to justify "reasonably necessary" for employment.
- No explicit mention of "legitimate interest" — employment contract + notice is the framework.

**Team Tracker Implication:**
- To process observations lawfully under PDPD:
  - Add notice to onboarding: "We collect timestamped performance observations to reduce review bias."
  - Include in employment contract: "Performance observations are necessary for fair evaluation."
  - Provide DSAR mechanism: Employee can request all notes.

---

## Pattern 7: Data Subject Rights in Practice

### What DSAR (Data Subject Access Request) Covers

Based on GDPR/UK guidance and industry practice:

**Included in DSAR Response:**
- All manager notes about the employee.
- Manager emails discussing the employee's performance.
- Slack messages from manager about employee behavior.
- Meeting notes (redacted if they mention other employees).
- Handwritten notes if digitized.
- Spreadsheets or databases with employee data.

**Redaction Allowed:**
- References to other employees.
- Confidential sources (e.g., "told by HR in confidence").
- Information revealing internal deliberation unrelated to the data subject (e.g., "promotion pool considerations").

**Timeline:** Must respond within 30 days (GDPR); similarly fast under PDPD.

**Format:** Must be concise, transparent, plain language. If complex, provide human-readable explanation.

### Employee-Facing Portals

**What Tools Provide:**
- **Self-service portal** where employee can see approved performance data (goals, feedback from peers, self-assessment, aggregate scores).
- **Portal does NOT usually show raw manager notes** (those are manager-only by default).
- **Portal DOES link to DSAR request process** if employee wants to see everything.

**Example (Eddy):**
- Performance Notes ARE visible in the employee's own portal.
- Admin Notes are NOT visible to anyone but HR admin.
- This gives employees visibility into what managers write without needing a formal DSAR.

**Example (Leapsome):**
- Manager private notes are NOT in the employee portal.
- Employee can request notes via DSAR.
- OR manager can choose to share notes during formal review conversation.

**Team Tracker Opportunity:**
You could offer **two tiers:**
1. **Default (Portal Visible):** Entries are manager-only in the app, but employee can log in and see all their own entries in a read-only view.
2. **DSAR Formal Request:** Employee formally requests and receives all entries in a timestamped export.

This gives employee transparency without forcing manager to explain every private thought immediately.

---

## Pattern 8: Lawful Basis Comparison

| Basis | Usage | Requirements |
|-------|-------|--------------|
| **Consent** | ❌ Not appropriate for performance notes under employment | Requires freely given, informed, specific consent — power imbalance makes it unreliable |
| **Employment Contract** | ✅ Yes — "Performance management is necessary to fulfill the employment relationship" | Must be stated in contract or offer letter |
| **Legitimate Interest** | ✅ Yes — "Manager fairness, reducing recency bias, informed performance conversations" | Must document why manager interest outweighs employee privacy interest |
| **Legal Obligation** | ✅ Sometimes — "Required to keep records for labor authority, dispute resolution" | Depends on jurisdiction (e.g., Vietnam labor law, FLSA, etc.) |

**Best Practice:** Combine employment contract + notice (transparency) rather than relying on any single basis.

---

## Pattern 9: How Mature Tools Operationalize This

### Privacy Notice (Required)

**Minimal template:**
```
We collect and keep timestamped observations about your performance to:
- Prepare for fair performance reviews (reduce recency bias).
- Document behavior and achievements over time.
- Support career development conversations.

This data is kept in our HR system and is only visible to your manager and HR.
You can request access to all observations about you at any time.
You can correct inaccurate information or request deletion where not required by law.

Data is retained for [X years] after employment ends for legal/dispute purposes.
```

### Employment Contract Clause (Required)

**Minimal template:**
```
Performance Observations: The Company keeps timestamped observations of your 
performance and behavior to inform fair performance management and reviews. 
You have the right to request access to all observations, correct inaccurate 
information, and delete observations where not required for legal purposes.
```

### DSAR Process (Required)

**Minimal implementation:**
1. Employee submits request (email, portal form, verbally to HR).
2. HR collects all data about employee (manager notes, entries, emails, etc.).
3. HR redacts references to other employees.
4. HR responds within 30 days with complete dataset (CSV, PDF, or text).

### Employee Portal (Optional but Recommended)

**Minimal implementation:**
1. Employee logs in, sees read-only view of all their own entries.
2. Employee can export their entries as CSV/PDF.
3. NO need to show internal manager ratings/sentiments — just the raw timestamped observations.

---

## Team Tracker: Repositioning Strategy

### Current Problem

**Secret dossier model:**
- Manager logs observations without employee knowledge (violates PDPD Art. 13).
- No lawful basis stated (violates PDPD Art. 11).
- No employee rights mechanism (violates PDPD Art. 15-17).
- Result: Company is processing sensitive personal data about a named employee with no consent, notice, or legal justification.

### Compliant Redesign

**Four Changes (No Feature Loss):**

1. **Add Privacy Notice**
   - At signup / onboarding: "Team Tracker keeps timestamped observations to reduce review bias."
   - Link to DSAR request form.
   - Disclose data retention (e.g., "Kept for 3 years after employee leaves").

2. **Add Employment Contract Clause**
   - "Performance observations are necessary for fair performance management."
   - "Employee has right to request access to all observations."

3. **Add DSAR Response Mechanism**
   - Email form: employee requests their data.
   - Backend feature: admin can export all entries for one employee as CSV.
   - Response time: 30 days.

4. **Optionally Add Employee Portal** (for VN market advantage)
   - Employee can log in (read-only).
   - See their own entries + sentiment trend (sparkline).
   - Export as CSV.
   - Manager notes remain private in admin panel but employee can see that data exists.

**Result:**
- Data processing is **transparent** (employee knows notebook exists).
- Lawful basis is **clear** (employment necessity, not consent).
- Employee **rights are provided** (DSAR, request to correct, limited deletion).
- **Manager review-prep value unchanged** — notes are still private day-to-day, but not secret.

---

## Unresolved Questions

1. **Vietnam PDPD "Reasonably Necessary" Test:** Is "reducing review bias" enough to justify manager observation collection, or does Vietnam labor code add specific requirements? (Need legal counsel in Vietnam.)

2. **Sentiment Tagging as Sensitive Data:** Is the `sentiment_options` (e.g., "worried", "impressed") in Team Tracker classified as sensitive personal data under PDPD (Art. 3), requiring higher protection? (Likely no — opinion is not explicitly sensitive, but needs confirmation with Vietnamese data protection officer.)

3. **"Closeness 1-5" and "Current Take" Fields:** Are subjective relationship/assessment scores treated as special category data (e.g., character assessment)? May require explicit lawful basis beyond employment. (Likely legitimate interest, not sensitive.)

4. **Cross-Border Data:** If Team Tracker hosts Supabase in Ireland but serves Vietnamese employees, does PDPD apply extraterritorially? (Answer: Yes — PDPD applies to processing of VN residents' data by any company, foreign or domestic.)

5. **Data Retention After Termination:** Vietnam labor law requires employer to retain certain records. Does observation data count? (Need to confirm with local counsel — may require 3-5 year retention post-termination.)

---

## Key Sources

- [Lattice Help: Give Private or Manager Only Feedback](https://help.lattice.com/hc/en-us/articles/360061281033-Give-Private-or-Manager-Only-Feedback)
- [Lattice Privacy Practices FAQ](https://lattice.com/trust/faqs)
- [15Five Data Processing Addendum](https://www.15five.com/terms/data-processing-addendum/)
- [Culture Amp Confidentiality Protections](https://support.cultureamp.com/en/articles/7048386-confidentiality-protections-in-reporting)
- [Culture Amp Privacy Policy](https://www.cultureamp.com/trust/privacy-policy)
- [Leapsome: Taking Private Notes](https://help.leapsome.com/hc/en-us/articles/4409014784145-Taking-private-notes-about-a-colleague-or-direct-report)
- [Leapsome: Feedback Visibility](https://help.leapsome.com/hc/en-us/articles/115001660093-Feedback-visibility-private-by-default)
- [BambooHR Performance Management](https://www.bamboohr.com/platform/performance-management/)
- [GDPR Manager Notes & DSAR (ICO Guidance)](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/subject-access-request-q-and-as-for-employers/)
- [Vietnam Decree 13/2023 (PDPD)](https://thuvienphapluat.vn/van-ban/EN/Cong-nghe-thong-tin/Decree-No-13-2023-ND-CP-dated-April-17-2023-on-protection-of-personal-data/564343/tieng-anh.aspx)
- [KPMG Vietnam: Legal Alert on Decree 13](https://kpmg.com/vn/en/home/insights/2023/04/legal-alert-on-decree-13.html)
- [Employee DSAR Best Practices (DataGrail)](https://www.datagrail.io/blog/data-privacy/considerations-for-handling-employee-access-requests-dsar/)
- [Eddy: Performance Notes & Admin Notes](https://support.eddy.com/knowledge/performance-notes-admin-notes)
- [Fairness in Performance Reviews (DeepLer)](https://deepler.io/en/blogs/hr-strategy/ensuring-fairness-and-transparency-in-performance-reviews/)
- [Processing Employee Data Under GDPR (DataPrivacyManager)](https://dataprivacymanager.net/processing-personal-data-of-employees/)
- [Legal Basis for Performance Management (ICO)](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/legitimate-interests/when-can-we-rely-on-legitimate-interests/)

---

## Summary for Product Team

**You can keep "manager private notes."** Mature tools (Lattice, 15Five, Leapsome, Culture Amp, BambooHR) all do. The compliance shift is:

- **Transparency:** Tell the employee upfront that you keep observations.
- **Lawful Basis:** Frame it as employment necessity, not consent.
- **Rights:** Provide DSAR mechanism + optionally a read-only employee portal to see their own data.

**Business upside for VN market:**
- Offering an **employee portal** (read-only view of their own entries + trend) is a competitive differentiator.
- Compliance signals (privacy notice, DSAR, data export) are trust-builders in regulated markets.
- You retain the core value (manager notebook for review prep) while shifting from "secret" to "transparent."

**Implementation priority:** Privacy notice + DSAR mechanism (2-3 days). Employee portal is phase 2 (1-2 weeks).

**Status:** ✅ Research Complete — Ready for product/legal sync.
