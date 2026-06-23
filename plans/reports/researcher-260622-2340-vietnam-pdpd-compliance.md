# Vietnam PDPD/PDPL Compliance Analysis for Team Tracker HR System
## Executive Summary

Team Tracker is currently structured as a **secret dossier** of performance observations about named employees without their knowledge or consent. This design is **not compliant** with Vietnam Nghị định 13/2023 (PDPD, effective July 2023) or its successor, Law No. 91/2025/QH15 (PDPL, effective Jan 1, 2026).

**Critical issue**: Vietnam is a **consent-heavy jurisdiction**. Nearly all employment data processing requires explicit, written, granular consent *before* processing begins, with limited exceptions. Unlike GDPR's "legitimate interests" basis, Vietnam offers no general lawful basis for employer processing of performance notes without consent or notification.

**Repositioning strategy**: Remove the "secret" nature by:
1. Notifying employees upfront (Article 13 notice)
2. Obtaining explicit, written consent for specific data types and purposes (Article 11)
3. Implementing data-subject rights (access, delete, withdraw consent) within statutory deadlines
4. Splitting controller/processor roles and requiring DPA with any SaaS vendor
5. Submitting cross-border transfer impact assessment if data leaves Vietnam

This analysis covers **PDPD (current law until Dec 31, 2025)** with notes on **PDPL changes (Jan 1, 2026+)**.

---

## 1. LAWFUL BASES UNDER VIETNAM PDPD / PDPL

### Overview: Consent-Centric Jurisdiction

Vietnam requires lawful basis for all personal data processing. The default and most widely used basis is **explicit consent** (Article 11, PDPD; continued in PDPL). Unlike GDPR, there is **no "legitimate interests" basis** and no automatic exemption for employment relationships.

### Candidate Lawful Bases for Employer HR Performance Notes

#### 1.1 **Consent (Article 11, PDPD / PDPL)** ← PRIMARY OPTION
- **Viability**: STRONG
- **Applies How**: Employer must obtain written, signed consent from employee before collecting/processing performance notes. Consent must be:
  - **Voluntary** (no coercion; declining must not harm employment)
  - **Informed** (employee understands type of data, purpose, entities involved, their rights)
  - **Specific** (one signature per purpose; if multiple purposes—e.g., "review prep" + "future talent planning"—must consent separately)
  - **Verifiable** (documented in writing or electronic form that can be printed/saved)
  - **Granular** (silence = no consent; checkboxes not pre-ticked)
  
  **Format**: Written, email signature, portal checkbox (if reproducible/printable), or text message confirmation.

- **Practical mechanics**:
  - Employee, on first login to Team Tracker, sees a modal/notice:
    > "Your manager uses this system to record observations about your work, including notes on performance, behaviors, and interactions. This data will be used to prepare for 1-on-1s and annual reviews. You have the right to access, correct, delete, and withdraw this consent at any time. Do you consent? [Yes/No]"
  - Consent recorded in DB with timestamp, user ID, and consent version hash.
  - If employee withdraws consent, manager can no longer ADD new entries; existing entries are NOT automatically deleted (separate deletion right).

- **Concern**: Employees may feel coerced in a hierarchical relationship. Mitigation: Clear policy that declining does not affect employment, and provide alternative (e.g., manager uses notebook instead). See *caveats* section.

---

#### 1.2 **Fulfillment of Contractual Obligation (Article 17, PDPD / PDPL) - LIMITED EXCEPTION**
- **Viability**: MODERATE
- **Applies How**: If the employment contract explicitly states manager will conduct performance evaluations and document observations, this may constitute fulfillment of a contractual obligation under Article 17.

- **BUT**: This is narrower than it sounds:
  - The contract must *explicitly* require the employer to record *these specific types* of observations (subjective notes, sentiment, closeness).
  - Simply saying "subject to performance review" is likely insufficient.
  - Courts have not yet issued guidance on how far this extends in Vietnam.

- **Risk**: Relying solely on this basis without consent is high-risk. Regulators or courts may challenge it as pretextual. Recommend as *secondary* basis (alongside consent).

- **Practical mechanics**: In contract template, add clause:
  > "Employer maintains performance and behavioral observation records on all employees to enable fair evaluation, promotion decisions, and 1-on-1 preparation. Employee acknowledges this processing and agrees to provide access upon request."
  
  This does NOT replace the need for separate consent modal, but strengthens position.

---

#### 1.3 **Legitimate Purpose / Justifiable Rights (Article 17, PDPD & PDPL) - WEAK**
- **Viability**: WEAK
- **Applies How**: PDPD Article 17 and PDPL allow processing without consent to protect "legitimate" or "justifiable" rights/benefits of the controller or another party. However:
  - **NOT the same as GDPR "legitimate interests"**. Vietnam's version is narrower and includes no balancing test.
  - Employer's interest in managing performance does not automatically override employee's privacy interests.
  - No case law clarifies scope.

- **Risk**: Highest uncertainty. Regulators likely to view this as an excuse to avoid consent. Avoid as primary basis.

---

### Recommended Basis Combination for Team Tracker

**Primary**: Explicit written **consent** (Article 11) via in-app modal on first login. This is unambiguous and hard to challenge.

**Secondary**: Contractual clause referencing the obligation to conduct performance evaluations. Strengthens argument if consent is later disputed.

**Do NOT rely on**: "Legitimate purpose" or any exception not explicitly listed in Articles 17, as it opens regulatory risk.

---

## 2. NOTICE REQUIREMENTS (ARTICLE 13, PDPD / PDPL)

### Timing & Delivery

**When**: Notice must be provided **BEFORE processing begins** (Article 13, PDPD; same in PDPL). For Team Tracker, this means *before* manager logs first entry about an employee.

**To Whom**: The employee (data subject) directly, not HR or payroll department.

**Form**: Written or electronic format that can be printed, reproduced, or saved (not verbal; not pop-ups that can't be saved).

### Required Contents

The notice must include:

1. **Identity of data controller** (manager or employer entity, e.g., "Acme Corp, HR Department, managed by John Doe")
2. **Purpose(s) of processing** (e.g., "to prepare for 1-on-1 meetings," "to inform annual reviews," "to identify strengths/development areas")
3. **Categories of personal data** being collected (e.g., "performance observations, behavioral notes, sentiment, closeness score 1-5")
4. **Recipients of data** (who else may see it: HR manager, legal dept, board? list explicitly)
5. **Data retention period** (how long notes are kept: until end of employment + X months? depends on company policy)
6. **Data subject rights** (access, correct, delete, withdraw consent, restrict processing, complain)
7. **Mechanism to exercise rights** (how to file a request: email, portal, in-app button)
8. **Right to withdraw consent** and consequences (if withdraw, no new notes, but what happens to existing ones?)
9. **Contact of data controller or designated person** for data subject inquiries
10. **Cross-border transfer details** (if data goes to Tokyo or any country outside Vietnam, must disclose: recipient country, protections, risks)

### Practical Delivery for Team Tracker

- **Method 1 (Recommended)**: In-app notice on employee's first login:
  - Display printable/downloadable PDF notice.
  - Require "I acknowledge" checkbox + ask for affirmative consent (separate step).
  - Log timestamp, version, and consent response.
  - Allow employee to re-download notice anytime.

- **Method 2 (Redundancy)**: Email to employee's work email with PDF attachment, before manager creates first entry about them. Manager must wait for manager's email to employee + acknowledgment before starting.

- **Method 3 (Legal requirement, document for audit)**: Include notice in employee handbook or contract, signed by employee during onboarding. Acts as proof of prior notice if combined with in-app notice.

### Notice Template Outline (Team Tracker)

```
Subject: Data Processing Notice — Performance Observation System

Dear [Employee Name],

Your employer, [Company], has deployed a system called "Team Tracker" to 
record and manage performance observations, feedback, and insights about your work.

**Purpose**: Preparing for your 1-on-1s, informing performance reviews, and 
identifying development opportunities.

**Data Collected**: Timestamped notes about your performance, behaviors, 
interactions, sentiment (positive/neutral/negative), and closeness (1-5 scale).

**Recipients**: Your direct manager (primary), HR department (for reviews), 
possibly executive team (for succession planning).

**Retention**: Notes kept for duration of employment + 2 years, unless you request deletion.

**Your Rights**: You may request access to all notes about you, correct inaccurate notes, 
delete notes, withdraw consent to future processing, or restrict certain uses.

**To Exercise Rights**: Email [contact] or use the "Data Requests" section in Team Tracker.

**Withdrawal of Consent**: If you withdraw consent, no new notes will be recorded, 
but existing notes may be retained for legal/business purposes (see policy).

**Cross-Border Transfer**: Notes may be stored on servers in Japan (Supabase Tokyo region). 
This is a location outside Vietnam. See DPIA below for protections.

[Include DPIA summary or link]

---
I acknowledge receipt of this notice and understand how my data will be processed.
```

---

## 3. DATA-SUBJECT RIGHTS (ARTICLES 9–10, PDPD / PDPL)

### Rights the Employee Must Be Able to Exercise

#### 3.1 **Right to Know / Access (Art. 9, PDPD)**
- Employee may request to see all data about them in the system.
- Controller must provide a **complete, readable copy** of all notes, metadata (dates, manager names), and any inferences/analysis.
- **Deadline**: 72 hours under PDPD (strict); PDPL (Jan 2026+) relaxes to "timely" (TBD by implementing regulations, but likely 30 days).

**Team Tracker implementation**:
- Add "Export My Data" button in employee portal.
- Clicking downloads JSON/PDF with all entries mentioning them, sorted by date.
- Notify manager via email that employee requested their data.

#### 3.2 **Right to Correct / Modify (Art. 9, PDPD)**
- If data is inaccurate or incomplete, employee may request correction.
- Controller must investigate and correct if justified.
- **Deadline**: 72 hours (PDPD) / timely (PDPL).

**Team Tracker implementation**:
- Add "Request Correction" link in employee's data export or portal.
- Employee submits comment/rebuttal (e.g., "This date is wrong; I was on leave then").
- Manager is notified and must respond within 72 hours (or per company policy).
- Correction is logged as a new entry (do NOT edit the original note; log: "Employee disputed this on [date]: [comment]").
- Cannot delete manager's original observation; must add employee's counter-note.

#### 3.3 **Right to Delete (Art. 10, PDPD)**
- Employee may request deletion of their personal data if:
  - Data is no longer necessary for the purpose (e.g., employee left company, no more reviews needed).
  - Employee withdraws consent (see 3.5).
  - No legal basis justifies continued storage.
  - Data was processed unlawfully.
- Controller must delete **within 72 hours** (PDPD) / timely (PDPL).
- **Exception**: If legal obligation (e.g., tax law, employment dispute) requires retention, employer may refuse but must explain.

**Team Tracker implementation**:
- Add "Request Deletion" button.
- Employee submits request with reason.
- Manager notified; employer decides (delete or refuse with justification).
- If approved: entries are hard-deleted from DB.
- If refused: employee receives written explanation (e.g., "We are retaining this for legal compliance with Labor Law Article XYZ").
- Log all denial decisions for audit.

**Risk note**: After employment ends, must delete or anonymize all notes within 72 hours unless legal reason exists (labor dispute, tax, etc.). See Section 1.1 in this memo re: retention policy.

#### 3.4 **Right to Withdraw Consent (Art. 10, PDPD / PDPL)**
- Employee may withdraw consent to future processing at any time.
- Controller must **stop collecting new data** after withdrawal.
- **Existing data**: Not automatically deleted; employee must separately request deletion (see 3.3).
- Must inform employee of consequences (e.g., "If you withdraw, manager cannot record observations, but your performance reviews may be based on other sources or be delayed").

**Team Tracker implementation**:
- Add "Withdraw Consent" button in employee settings.
- Clicking shows confirmation modal with consequences.
- Upon confirmation, set employee's `consent_withdrawn_at` timestamp.
- Manager's UI for that employee shows: "Consent withdrawn on [date]; new entries cannot be recorded."
- Existing entries remain visible to manager and HR (unless separately deleted).

#### 3.5 **Right to Restrict Processing (Art. 10, PDPD)**
- Employee may ask employer to limit how data is used (e.g., "Don't share notes with C-level").
- Employer must honor unless it undermines the purpose (e.g., if purpose is performance review, cannot restrict HR access).

**Team Tracker implementation**:
- Add "Restriction Preferences" form (checkboxes for: no C-level access, no talent planning use, etc.).
- Manager UI reflects restrictions (e.g., "Cannot be shared externally per employee request").
- Ensure access controls enforce this.

#### 3.6 **Right to Object (Art. 10, PDPD)**
- Employee may object to certain processing (though grounds are narrower than GDPR).
- Employer must stop unless it can demonstrate overriding legitimate interest (undefined in Vietnam law).

**Practical rarity**: Most employers will treat objection as a request to restrict or delete. Recommend offering both options in UI.

#### 3.7 **Right to Complain & Sue (Art. 10, PDPD)**
- Employee may file complaint with Ministry of Public Security (MPS) or initiate civil lawsuit for damages.
- No formal mechanism required in Team Tracker, but:
  - Employer must keep records of all data-subject requests and responses.
  - If employer ignores request, employee has evidence of non-compliance.

**Team Tracker implementation**:
- Log all requests (access, correct, delete, restrict, object, withdraw) with timestamps.
- Store responses (approved, denied, reason, action taken).
- Audit log exportable for legal defense if needed.

---

### Implementation Roadmap for Data-Subject Rights

**MVP Phase (Before Launch)**:
1. Add "Export My Data" (access right).
2. Add "Request Deletion" form.
3. Add "Withdraw Consent" button.
4. Add 72-hour response SLA tracking (for PDPD; relax post-Jan-2026).

**Secondary Phase**:
5. Add "Request Correction" with rebuttal logging.
6. Add "Restrict Processing" preferences.
7. Add audit log export for compliance reviews.

---

## 4. CONTROLLER VS PROCESSOR — OBLIGATIONS & DPA

### Definitions

- **Data Controller (PDC)**: The person/entity determining purpose and means of processing. In Team Tracker: **the employer** and **the manager** (joint controllers, likely).
- **Data Processor (PDP)**: Entity processing data *on behalf of* controller under contract. In Team Tracker: **Supabase (or any SaaS vendor)**.

### Controller Obligations

The employer (controller) is responsible for:
1. Obtaining and documenting consent (Article 11).
2. Delivering Article 13 notice.
3. Responding to data-subject requests (Article 9-10) within 72 hours (PDPD) / timely (PDPL).
4. Securing data (encryption, access controls).
5. Notifying MPS of data breaches within 72 hours.
6. Submitting DPIA and cross-border transfer impact assessment (if applicable) within 60 days.
7. Ensuring processor complies with DPA.

### Processor Obligations (Supabase, et al.)

Under Article 39 (PDPD), processor **must**:
1. **Sign a Data Processing Agreement (DPA)** with controller before processing begins.
2. Process data **only per controller's written instructions** (in DPA).
3. **Maintain data confidentiality** (employees, contractors).
4. **Not sub-process without controller's prior, written approval** (and DPA with sub-processor).
5. **Assist controller** in responding to data-subject requests (access, delete, etc.) within 72 hours.
6. **Notify controller immediately** of any data breach.
7. **Allow controller audit rights** (ability to inspect, audit processor's practices).
8. **Delete or return data** to controller upon contract termination.

### Data Processing Agreement (DPA) — What It Must Contain

Vietnam law does not specify an exact DPA template, but based on international best practice and regulatory guidance, it should cover:

**Parties**: [Controller] and [Processor].

**Scope**: Processor processes [types of data] for the purpose of [specific purpose, e.g., "secure storage and retrieval of performance observation data"].

**Instructions**: Processor processes data only per written instructions from Controller. Any new use requires updated written instruction.

**Sub-Processors**: Processor may not use sub-processors (e.g., sub-hosting provider) without Controller's prior written approval. List of approved sub-processors attached.

**Data Security**: 
- Encryption at rest (AES-256) and in transit (TLS 1.2+).
- Access controls (authentication, role-based access).
- Audit logging.
- Regular security assessments (annually).

**Data Subject Rights Assistance**: 
- Processor must respond to Controller's requests for data access, deletion, correction within 72 hours (PDPD) / timely (PDPL).
- Processor provides APIs or manual processes to export, delete, correct data.

**Cross-Border Transfer**: If Processor stores data outside Vietnam, agreement must disclose:
- Countries where data is stored.
- Legal protections in those countries.
- Processor's commitment to maintain same level of security.

**Breach Notification**: Processor notifies Controller immediately (within 24 hours recommended) upon discovery of breach.

**Audit Rights**: Controller may audit Processor's practices (e.g., annual SOC 2 report, security policy, infrastructure audit).

**Term & Termination**: 
- DPA term matches service agreement.
- Upon termination, Processor deletes all data within [X days, e.g., 30 days] unless Controller instructs otherwise.

**Liability**: Processor liable to Controller for damages from non-compliance. Sub-processors liable to Processor.

### Supabase (Team Tracker's Current Processor) - Gap Analysis

**Current State**:
- Supabase likely has a generic Terms of Service, not a DPA tailored to Vietnam PDPD/PDPL.
- Supabase documentation does not explicitly address Vietnam compliance.

**Risks**:
- No formal DPA = potential non-compliance with Article 39.
- Supabase's data locations (Tokyo, EU) may not have signed DPA addressing cross-border transfer.
- Supabase does not guarantee 72-hour response to data-subject requests; likely requires Controller to process requests via Supabase's standard support.

**Actions Required**:
1. **Review Supabase's current DPA/ToS**: Check if any GDPR-style DPA exists; if so, assess if it covers Vietnam requirements.
2. **Request Vietnam-Specific DPA**: Contact Supabase and request a DPA that explicitly addresses:
   - Vietnam PDPD/PDPL compliance.
   - 72-hour (or timely) response to data-subject requests.
   - Security audit rights.
   - Sub-processor disclosure (e.g., if Supabase uses Amazon/Google cloud, DPA must list these).
   - Cross-border transfer details.
3. **Fallback**: If Supabase declines to sign DPA, consider:
   - Switching to a processor with explicit Vietnam compliance (rare; most SaaS vendors don't have this yet).
   - Self-hosting in Vietnam (high cost, complexity).
   - Using an intermediary processor (e.g., Vietnamese data processing firm) between Supabase and employer.

**Current Gap**: This is a **blocking issue** for compliance. Do not launch until DPA is signed.

---

## 5. CROSS-BORDER TRANSFER & DPIA/TIA OBLIGATIONS

### Key Requirement: Article 25, PDPD / PDPL

If personal data of **Vietnamese citizens** is transferred to, or processed in, a location **outside Vietnam**, a **Cross-Border Transfer Impact Assessment (CTIA)** or **Dossier** must be submitted to Vietnam's Ministry of Public Security (MPS) within **60 days of first transfer**.

### Team Tracker's Current Status

**Current Flow**:
- Employees register in Team Tracker (web app, likely next.js).
- Manager notes stored in Supabase database.
- Supabase **default region: Tokyo** (Asia-Northeast).
- Data is **regularly accessed** from Vietnam (by manager/employees) but **stored outside Vietnam**.

**Assessment**: Team Tracker's data is being **transferred to and processed in Japan**. CTIA requirement applies.

### What Must Be in the CTIA Dossier

Per Article 25 (PDPD) and guidance from Vietnamese regulators, the dossier must include:

1. **Objectives and Scope**: Why data is transferred (e.g., "secure cloud storage for performance management system").

2. **Personal Data Categories**: Types of data being transferred (names, performance notes, sentiment, dates, user IDs).

3. **Recipients in Recipient Country**: Which entities receive/access the data abroad. In Team Tracker: Supabase (data processor), any Supabase staff with access (engineering, ops), potentially cloud providers (AWS, Google Cloud) if Supabase uses them.

4. **Data Retention Duration**: How long data is kept in the foreign location.

5. **Security Measures**:
   - Encryption at rest (AES-256).
   - Encryption in transit (TLS 1.2+).
   - Access controls.
   - Authentication (multi-factor if possible).
   - Audit logging.
   - Regular security updates and patches.
   - DPA with processor.

6. **Risk Assessment**:
   - Potential risks from storing data in Japan (e.g., regulatory access by Japanese authorities, natural disaster, cyber-attack).
   - Mitigation measures (e.g., backups, incident response plan, notification procedures).
   - Assessment of whether risks are acceptable or prohibitive.

7. **Legal Basis**: Which article permits the transfer (likely consent under Article 11 + contractual obligation under Article 17).

8. **Approval from Data Subjects**: Obtain and document consent from all data subjects (employees) before transfer.

### Practical Mechanics for Team Tracker

**Timeline**:
1. **Before launch**: Prepare CTIA dossier (draft).
2. **Week 1 after launch**: Collect consent from all employees for data transfer to Japan (via Article 13 notice + Article 11 consent modal).
3. **Within 60 days of first transfer**: Submit CTIA to MPS.

**Submission Process** (TBD by MPS; check current guidance):
- MPS has a dedicated portal or email for CTIA submissions (likely A05 Department / Cyberspace Administration).
- Dossier is submitted in Vietnamese (or English; check current requirement).
- MPS reviews for 30 days; may request clarification.
- No formal "approval" issued; MPS uses submission to monitor transfers.
- If MPS flags high risks (e.g., insecure transfer), may restrict or prohibit transfer.

### DPIA (Data Processing Impact Assessment) vs CTIA

- **DPIA**: Required for *all* data processing activities (Article 22, PDPD). Assesses risks and mitigations for general processing (not just cross-border).
- **CTIA**: Specific subset of DPIA for cross-border transfers.

**For Team Tracker**: Both required. DPIA covers all processing (notes, access, retention). CTIA covers the Tokyo transfer specifically.

### Regulatory Uncertainty

**Issue**: Vietnam's MPS has not published detailed implementing guidance for CTIA preparation, submission, or review process. Recommendations based on PDPD text and regional best practice, but exact requirements may evolve.

**Mitigation**: 
- Consult with Vietnamese data protection law firm (e.g., Tilleke & Gibbins Vietnam, D'Andrea & Partners Vietnam) for latest MPS guidance.
- Prepare DPIA and CTIA now; submit as soon as process is clarified.
- Document all steps for audit.

---

## 6. PRACTICAL STEPS FOR SOLO VN FOUNDER (CONCRETE ROADMAP)

### Phase 1: Legal & Regulatory (Timeline: 4–6 weeks)

1. **Consult Vietnamese Data Protection Lawyer**
   - Engage firm: Tilleke & Gibbins, D'Andrea & Partners, Rouse, or local firm.
   - Scope: Review Team Tracker's data flows, draft DPA, draft CTIA dossier, advise on consent mechanism.
   - Cost: ~USD 2,000–5,000.
   - Output: Written legal opinion, DPA template, CTIA template.

2. **Conduct Internal Data Audit**
   - Document: What data types are collected? Where stored? Who accesses? How long retained?
   - Output: Data map (template provided below).

3. **Revise Terms of Service & Privacy Policy**
   - Add explicit mention of PDPD/PDPL compliance.
   - Disclose data transfers to Japan.
   - List data-subject rights and contact info.
   - Link to CTIA dossier summary (optional but recommended for transparency).

4. **Draft Consent Modal & Article 13 Notice**
   - See Section 2 above for template.
   - Have lawyer review.
   - Translate to Vietnamese if targeting VN market (high priority).

5. **Request DPA from Supabase (or Switch Processor)**
   - Email Supabase support / legal.
   - If Supabase has existing GDPR DPA, ask if it covers Vietnam.
   - If not, request new DPA addressing PDPD/PDPL.
   - **Fallback**: If Supabase declines within 4 weeks, plan to switch to a processor willing to sign (research alternatives; this is rare).

### Phase 2: Product Development (4–8 weeks, in parallel with Phase 1)

1. **Implement Data-Subject Rights UI**
   - Add "Export My Data" button (employee portal).
   - Add "Request Deletion" form.
   - Add "Withdraw Consent" button.
   - Add "Request Correction" form.
   - Backend: Log all requests with timestamp, status, outcome.

2. **Implement Consent Tracking**
   - Upon first employee login, show Article 13 notice (printable PDF).
   - Require affirmative consent checkbox (not pre-ticked).
   - Record consent decision + version hash + timestamp in DB.
   - Track withdrawal of consent separately.

3. **Implement 72-Hour SLA Tracking**
   - Data-subject request → Timestamp.
   - Set reminder: Must respond within 72 hours (PDPD; relax post-Jan 2026).
   - Dashboard showing pending requests, overdue requests, completion rate.

4. **Implement Audit Logging**
   - All access to employee data (who, when, which entries).
   - All data modifications (original vs current state).
   - All data-subject requests (request, response, outcome).
   - Export audit log as PDF/JSON for compliance review.

5. **Data Retention Policy**
   - Define: How long are notes kept after employee leaves?
   - Recommendation: Until end of employment + 1 year (for potential disputes), then delete unless legal hold.
   - Implement automated deletion job (or flag for manual review after 1 year).

6. **Sub-Processor Disclosure**
   - If using Supabase, document: Does Supabase use AWS? Google Cloud? Other services?
   - Add to CTIA dossier.
   - Notify employees in Article 13 notice (e.g., "Data may be processed by sub-processors including...").

### Phase 3: Submission to Authorities (Timeline: 4 weeks after Phase 2 completion)

1. **Prepare DPIA Dossier**
   - Template (summarized):
     - Purpose: Secure, timestamped performance observation system for 1-on-1 prep and reviews.
     - Data types: Employee names, dates, observations, sentiment, closeness scores, metadata.
     - Retention: Until employment end + 1 year.
     - Recipients: Manager, HR, possibly executives.
     - Risks: Unauthorized access, data breach, employee privacy concerns.
     - Mitigations: Encryption, access controls, consent, notice, data-subject rights, audit logging.

2. **Prepare CTIA Dossier**
   - See Section 5 for template.
   - Include security audit (e.g., Supabase SOC 2 report).
   - Include DPA (signed with Supabase).
   - Include risk assessment for Japan-based storage.

3. **Obtain Consent from All Active Employees**
   - Before submitting CTIA, ensure all employees have seen Article 13 notice and consented.
   - Send email: "Please log into Team Tracker to review your data privacy notice and provide consent."
   - Track responses.
   - For non-responsive employees, follow up or wait (do not proceed with their data until consent obtained).

4. **Submit CTIA to MPS**
   - Contact: Ministry of Public Security, A05 Department (Cyberspace Administration) or via official portal (TBD).
   - Language: Vietnamese (recommended; check current requirement).
   - Format: PDF, likely via email or web portal.
   - Retain receipt/confirmation.

5. **Retain Documentation**
   - Keep copies of all consent records, DPIA, CTIA, DPA, audit logs, legal opinions.
   - Organize in secure, backed-up folder for regulatory inspection.

### Phase 4: Ongoing Compliance (Post-Launch, Continuous)

1. **Monitor Data-Subject Requests**
   - Respond to access/delete/correct/withdraw within 72 hours (PDPD) / timely (PDPL).
   - Log all decisions and actions.

2. **Respond to MPS Inquiries**
   - MPS may audit or ask questions about DPIA/CTIA.
   - Maintain clear, documented responses.

3. **Update DPIA/CTIA if Process Changes**
   - If you add new data types, change retention, or switch processors, update dossiers.
   - Re-notify employees.
   - May require new consent.

4. **Annual Compliance Review**
   - Audit all data-subject rights requests and responses.
   - Check for any breaches; notify MPS within 72 hours if found.
   - Update security controls (patches, updates, new threats).

5. **Transition from PDPD to PDPL (Jan 1, 2026)**
   - PDPL replaces PDPD but maintains most requirements.
   - Key change: 72-hour deadline becomes "timely" (implementing regulation TBD).
   - Review PDPL text for any changes; update policies/notices accordingly.

---

## 7. CAVEATS & UNRESOLVED QUESTIONS

### Major Uncertainties

1. **Consent Coercion in Employment Context**
   - **Issue**: Employee may feel pressured to consent because manager is superior. PDPD does not allow "coerced" consent.
   - **Risk**: Regulators or employees could challenge consent as invalid.
   - **Mitigation**: Clear written policy: "Declining consent to performance observation does not affect employment. Employees who decline may be evaluated via other means (e.g., 360 review, manager observation without system)."
   - **Recommendation**: Obtain external legal opinion on this specific risk in VN labor law context.

2. **Scope of "Contractual Obligation" Exception (Article 17, PDPD)**
   - **Issue**: Not clarified by regulators or courts whether employment contracts can override consent requirement for subjective performance notes.
   - **Risk**: Court may rule that contract clause is insufficient; consent required anyway.
   - **Mitigation**: Use contract clause as *secondary* basis; primary basis is explicit consent.

3. **MPS Guidance on CTIA**
   - **Issue**: MPS has not published detailed implementing guidance for CTIA submission/review.
   - **Risk**: Submission format, deadline, or approval process may differ from expectations.
   - **Mitigation**: Consult lawyer; monitor MPS announcements; prepare draft CTIA early; submit as soon as guidance is available.

4. **PDPL Implementation (Jan 1, 2026)**
   - **Issue**: PDPL is law, but implementing decrees (e.g., details on "timely" deadline, DPIA/CTIA procedures) not yet finalized as of June 2026.
   - **Risk**: Compliance approach may shift.
   - **Mitigation**: Plan to review and update DPIA/CTIA/policies by Dec 2025.

5. **Employee Monitoring & Sentiment Data**
   - **Issue**: Sentiment colors, closeness scores, and subjective notes could be classified as "employee surveillance" requiring explicit consent under employment-specific rules (PDPL Article 25, if applicable).
   - **Risk**: Regulators may view sentiment/closeness as more sensitive than behavior notes; higher compliance bar.
   - **Mitigation**: In consent modal, explicitly explain what sentiment/closeness means and why it's collected. Offer option to opt out of sentiment/closeness while allowing behavior notes.

6. **Data Retention & Dispute Period**
   - **Issue**: After employee leaves, must delete data within 72 hours (PDPD) unless legal reason. But what if employee disputes a review, or sues company?
   - **Risk**: Competing obligations: delete employee data vs. retain for legal defense.
   - **Mitigation**: Policy should state: "Notes retained until employment + 1 year, or until any pending dispute/lawsuit is resolved, then deleted." Document any legal hold in writing.

7. **Multi-Jurisdiction Employers**
   - **Issue**: If employer has offices in multiple countries, Team Tracker may be processing data from multiple jurisdictions (VN, Thailand, SG, etc.). Each has different rules.
   - **Risk**: Compliance approach must account for strictest jurisdiction (Vietnam is quite strict).
   - **Mitigation**: For MVP, assume Vietnam is strictest; apply VN rules globally. Later, segment by jurisdiction if needed.

### Where a Lawyer is Mandatory

1. **Before launching**: Have lawyer review consent modal, Article 13 notice, terms, and privacy policy. Cost: USD 500–1,000.
2. **Before submitting CTIA**: Have lawyer prepare/review dossier. Cost: USD 1,500–3,000.
3. **If MPS inquires or audits**: Have lawyer respond. Cost: USD 2,000+ (hourly or flat fee).
4. **If employee sues or demands deletion of data**: Have lawyer handle. Cost: USD 5,000+ (dispute resolution).

### Recommended Legal Timeline

- **Month 1**: Engage lawyer for initial consultation (PDPD/PDPL overview, data audit, high-risk areas).
- **Month 2–3**: Lawyer drafts consent, notice, DPA, CTIA templates; you implement product changes.
- **Month 4**: Lawyer reviews final product and policies; you prepare to submit CTIA.
- **Month 5–6**: Submit CTIA; engage lawyer for any MPS follow-up.

---

## 8. SUMMARY TABLE: LAWFUL BASES & VIABILITY

| Basis | Article | Viability | Appliesness | Notes |
|-------|---------|-----------|-------------|-------|
| **Explicit Consent** | 11 | **STRONG** | Write notice, get employee signature (in-app or email), record timestamp. Repeat for each purpose (separate consents if multiple). | **PRIMARY** — use this. |
| **Contractual Obligation** | 17 | MODERATE | Add clause to employment contract: "Employer maintains performance evaluation records." Requires explicit link to data types collected. | Secondary; complements consent. High uncertainty on scope. |
| **Legitimate Purpose** | 17 | **WEAK** | Employer interest in performance mgmt. Not same as GDPR. No balancing test. High regulatory challenge risk. | Avoid. Too vague; no case law. |

---

## 9. SUMMARY TABLE: DATA-SUBJECT RIGHTS & IMPLEMENTATION

| Right | Deadline | Implementation | Frequency |
|-------|----------|-----------------|-----------|
| **Access** | 72 hrs (PDPD) / timely (PDPL) | "Export My Data" button → PDF/JSON. | On-demand. |
| **Correct** | 72 hrs | "Request Correction" form → Manager review → Log counter-note (don't edit original). | On-demand. |
| **Delete** | 72 hrs | "Request Deletion" form → Manager approve/deny → Hard-delete if approved. | On-demand. |
| **Withdraw Consent** | Immediate | "Withdraw Consent" button → Stop recording new entries. Existing entries not auto-deleted. | On-demand. |
| **Restrict** | 72 hrs | "Restriction Preferences" form → Limit who can see notes. | On-demand. |
| **Object** | 72 hrs | Treat as restrict request or forward to legal. | On-demand. |

---

## 10. SUMMARY: REPOSITIONING STRATEGY

**From**: Secret dossier (no notice, no consent, no employee rights).
**To**: Transparent performance-observation system with:
- ✅ Clear notice before processing begins.
- ✅ Explicit written consent for each purpose.
- ✅ Employee rights to access, correct, delete, restrict, withdraw.
- ✅ DPA with SaaS processor.
- ✅ DPIA and CTIA submitted to regulators.
- ✅ 72-hour SLA for responding to employee requests.
- ✅ Policy protecting against coerced consent.

**Result**: Team Tracker transitions from **non-compliant** to **compliant** with Vietnam PDPD/PDPL.

**Commercial Impact**: Employers buying Team Tracker can now legally use it in Vietnam (and other PDPD-adjacent jurisdictions) with confidence that they have documented lawful basis, notice, consent, and employee rights. This becomes a selling point: "Compliant with Vietnam PDPD, GDPR-level transparency."

---

## Sources

- [Decree 13/2023/ND-CP on protection of personal data - Viet An Law](https://vietanlaw.com/decree-13-2023-nd-cp-on-protection-of-personal-data/)
- [Vietnam enacts landmark law on personal data protection: stable standing with stricter compliance - Hogan Lovells](https://www.hoganlovells.com/en/publications/vietnam-enacts-landmark-law-on-personal-data-protection-stable-standing-with-stricter-compliance)
- [Vietnam's Personal Data Protection Decree: Overview, Key Takeaways, and Context - Future of Privacy Forum](https://fpf.org/blog/vietnams-personal-data-protection-decree-overview-key-takeaways-and-context/)
- [A Closer Look at Vietnam's First-Ever Personal Data Protection Decree - Tilleke & Gibbins](https://www.tilleke.com/insights/a-closer-look-at-vietnams-first-ever-personal-data-protection-decree/)
- [Vietnam's New Personal Data Protection Law: A Complete Guide for 2025 - CookieYes](https://cookie-script.com/privacy-laws/vietnam-personal-data-protection-law)
- [Legal Alert on Decree 13 on Personal Data Protection - KPMG Vietnam](https://kpmg.com/vn/en/home/insights/2023/04/legal-alert-on-decree-13.html)
- [Vietnam Personal Data Protection Decree | TrustArc](https://trustarc.com/regulations/vietnam-pdpd/)
- [Vietnam PDPD - Compliance | Google Cloud](https://cloud.google.com/security/compliance/vietnam-pdpd)
- [Vietnam's Cross-Border Data Transfer Regulation - ITIF](https://itif.org/publications/2025/06/09/vietnam-cross-border-data-transfer-regulation/)
- [Starting January 1, 2026: Employers are legally required to delete personal data of employees upon termination of employment - LTS Law](https://lts.com.vn/updated-news/starting-january-1-2026-employers-are-legally-required-to-delete-personal-data-of-employees-upon-termination-of-employment-lts-law/)
- [Data protection laws in Vietnam - Data Protection Laws of the World](https://dlapiperdataprotection.com/?t=law&c=VN)
- [Legal Bases for Processing of Personal Data | Vietnam | Global Data and Cyber Handbook - Baker McKenzie](https://resourcehub.bakermckenzie.com/en/resources/global-data-and-cyber-handbook/asia-pacific/vietnam/topics/legal-bases-for-processing-of-personal-data)

