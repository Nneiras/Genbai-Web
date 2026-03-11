# Phase 2: CRM & AI Agents Integration Plan

This plan outlines the steps to transform the GENBAI landing page into a fully functional platform with a built-in CRM and integrated AI agents.

## User Review Required

> [!IMPORTANT]
> This phase requires setting up a **Supabase** project for the backend (Auth & Database). I will need the Supabase URL and Anon Key once the project is created.
> [!NOTE]
> We will use the **Gemini API** to power the AI agents. You will need to provide an API key for the integration.

## Proposed Changes

### CRM Infrastructure (Supabase)

We will implement a robust backend to store lead data and manage business operations.

#### [NEW] `src/lib/supabase.js`
- Configuration and initialization of the Supabase client.

#### [NEW] Database Schema
- `leads`: id, name, email, industry, message, status (new, contacted, interested, closed), created_at.
- `conversations`: id, lead_id, transcript, summary, created_at.
- `budgets`: id, lead_id, project_details, total_amount, status, created_at.

### Landing Page Enhancements

#### [MODIFY] `index.html`
- Add a floating chat widget for the **Public Attention Agent**.
- Update the contact form to submit data directly to Supabase.

#### [MODIFY] `src/main.js`
- Handle contact form submissions with Supabase integration.
- Initialize the chat widget logic.

### AI Agents Implementation

#### [NEW] `src/agents/public-attention.js`
- Logic for the customer-facing chatbot.
- FAQ handling and lead qualification.

#### [NEW] `src/agents/content-generator.js`
- Tool for generating blog posts and social media content.
- Integration with the `/blog` section of the landing page.

#### [NEW] `src/agents/budget-generator.js`
- Interactive flow to collect project requirements and estimate costs.
- Generates a summary for the CRM.

### Admin Dashboard (CRM)

#### [NEW] `admin.html` & `src/admin.js`
- Protected route to view and manage leads.
- Interface to trigger content and budget generation.

---

## Verification Plan

### Automated Tests
- I will create unit tests for the agent logic using a test runner like Vitest.
- `npm test`: Command to run the test suite.

### Manual Verification
1.  **Form Submission**: Fill out the contact form on the landing page and verify the lead appears in the Supabase dashboard.
2.  **Chatbot Interaction**: Chat with the Public Attention Agent and ensure it captures contact info correctly.
3.  **Content/Budget Generation**: Trigger the generation tools and verify the output is relevant and formatted correctly.
