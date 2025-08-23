Great — thanks for clarifying. Based on your answers, I’ll refine the **PRD MVP** so it reflects your priorities:

---

# Product Requirements Document (PRD)

**Product Name:** (TBD – e.g., LeadCopilot)
**Version:** MVP

---

## 1. **Vision & Goal**

To automate the process of sourcing and qualifying leads for agencies, businesses, and HR teams, by using an AI Copilot that pulls data primarily from **LinkedIn** and **public company websites**. The system will generate a **qualified list of leads** with context and allow users to query the agent for further enrichment (e.g., personalized outreach hooks).

---

## 2. **Objectives**

* Provide **cost-effective lead sourcing** (LinkedIn + public data first, optional enrichment via Apollo/Clearbit if required).
* Deliver a list of **qualified, enriched, and verified leads**.
* Allow the user to **interact with the lead dataset** (e.g., add columns, generate outreach hooks).
* Enable **multi-channel notifications** (in-app + email).

---

## 3. **Target Users**

* Marketing & Sales Agencies
* B2B Businesses
* Recruiters / HR Teams
* Startup Founders

---

## 4. **MVP Scope**

### 4.1 Authentication & Onboarding

* Google OAuth (MVP).
* Profile setup: User gives business/agency info + goals (context for lead qualification).

---

### 4.2 Lead Sourcing & Copilot Flow

1. **Define ICP**

   * User enters ICP details (role, industry, location, company size, etc.) via form or chat-like Q\&A with agent.

2. **Trigger Copilot**

   * Runs asynchronously, sourcing leads from:

     * **LinkedIn profiles** (public data / scraping / API if feasible).
     * **Public company websites**.
     * **Optional**: Apollo/Clearbit (if needed to verify emails).
   * Verified emails required (bounce protection).

3. **Notifications**

   * **In-app** and **email notification** when process is complete.

4. **Lead Results Table**
   Each lead must include:

   * First Name
   * Last Name
   * Verified email
   * LinkedIn profile
   * Company name
   * Role/title
   * Website
   * “About” summary
   * Data points with links (e.g., LinkedIn posts, company updates)
   * Qualification reason (AI-generated)
   * Interest rating (1–10)
   * **Agent interaction enabled:** User can ask Copilot to enrich data (e.g., *“Add a Hook column with a personalized outreach message”*).

5. **Download & Export**

   * Leads exportable to **CSV**.

---

## 5. **Non-Functional Requirements**

* **Cost Efficiency:** Prefer free/public sources, use paid APIs (Apollo/Clearbit) only when strictly necessary.
* **Scalability:** Handle parallel searches asynchronously.
* **Accuracy:** Verify email validity.
* **Performance:** Initial sourcing may take minutes depending on depth.
* **Security:** Encrypt user data and lead lists.

---

## 6. **Future Enhancements (Beyond MVP)**

* ICP templates (save & reuse).
* CRM integrations (HubSpot, Salesforce).
* Team collaboration & shared ICPs.
* Automated lead updates (continuous enrichment).
* Advanced filtering (funding stage, hiring signals, tech stack).

---

## 7. **Success Metrics**

* % of verified leads (bounce rate <5%).
* User rating of lead quality (>7/10).
* % of users exporting data or requesting hooks.
* Retention (# of repeated searches per user).

---

## 8. **Tech Stack (Proposed for MVP)**

* **Frontend:** React (Next.js), TailwindCSS
* **Backend:** Node.js (Express/NestJS)
* **Database:** PostgreSQL
* **Lead Sourcing:**

  * LinkedIn scraping (public data)
  * Company websites (scraping + enrichment)
  * Apollo/Clearbit (only for verified email if needed)
* **AI Agent:** OpenAI (GPT-4.1-mini / GPT-4.1), LangChain for enrichment + table manipulations
* **Auth:** Google OAuth (via Supabase/Auth0/Firebase)
* **Notifications:** Email (SendGrid/Resend) + in-app alerts
* **Infra:** AWS/Azure/GCP

---

👉 I suggest we now build a **user flow diagram** that shows:

1. Login → Profile setup → ICP definition
2. Copilot triggered → Async process → Notifications
3. Leads table displayed → User interacts (ask Copilot to add columns like “Hook”) → Export

Would you like me to draft that **visual flow** for the PRD? It would make the MVP clearer for both devs and stakeholders.
