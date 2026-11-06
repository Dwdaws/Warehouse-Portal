# Warehouse Portal
## IT handover and rebuild specification

**Organization:** Hit Promotional Products  
**Status:** Prototype reference and agreed product requirements; not a production deployment specification  
**Audience:** IT, implementation partners, warehouse operations, and content owners  
**Document purpose:** Explain what to rebuild, how the components connect, and which behaviors require provider or business validation.

## 1. Executive brief

Warehouse Portal is a mobile-first internal reference hub for warehouse employees and their leaders. It brings standard operating procedures (SOPs), externally hosted e-learning, and blank management templates into one searchable, role-aware interface. It complements MeetQuinn/the existing learning platform; it does not replace that platform.

The primary purpose is practical, on-demand help: an employee should be able to find the relevant procedure or refresher when needed. This is not intended to become a mandatory-course dashboard, compliance scorecard, or assignment system. Aim for common resources to be reachable within approximately two taps from home, without hiding the safety warning or access restrictions.

IT will rebuild the portal. The current software demonstrates product behavior and design; IT is not required to retain its framework, database layout, hosting, or simulated authentication. Preserve the agreed experience and permission boundaries, not prototype shortcuts.

### The completion-notification decision

**MeetQuinn sends the portal owner an email when an employee completes a training module. The portal owner then forwards that notification to the employee's manager.**

This is the agreed operational workflow. The prototype does not receive or process those emails, send manager notifications, or synchronize completion statuses. MeetQuinn notification delivery and learner attribution have not been independently verified in this project and must be tested before rollout.

## 2. Status legend and scope boundaries

| Label | Meaning |
|---|---|
| Demonstrated | Implemented in the current prototype; a functional reference for IT. |
| Agreed requirement | A product or operational decision the rebuild should preserve. |
| Validate before rollout | Depends on IT policy, MeetQuinn configuration, browser behavior, or an operational decision not settled here. |

The portal is not currently an HR system, employee performance-record repository, document co-authoring platform, offline application, LMS completion database, or automated email-forwarding service. None of those should be inferred from the presence of training or management templates.

## 3. People, tiers, and permissions

There are four job levels. Content Editor is an additional permission, not a fifth job level. An employee's warehouse area is separate from their job level.

| Capability | Frontline Employee | Lead | Supervisor | Manager | Designated Manager/Editor |
|---|---|---|---|---|---|
| Search and view authorized SOPs | Yes | Yes | Yes | Yes | Yes |
| Open authorized e-learning | Yes | Yes | Yes | Yes | Yes |
| Browse six general warehouse areas | Yes | Yes | Yes | Yes | Yes |
| Talent Management area and management-only content | No | No | Yes | Yes | Yes |
| Download blank management templates | No | No | Yes | Yes | Yes |
| Register employee devices and issue codes | No | No | Yes | Yes | Yes |
| View employee e-learning page-open reports | No | No | Yes | Yes | Yes |
| Add/edit/upload/archive/restore shared content | No | No | No | No | Yes |
| Generate/print workstation SOP QR codes | No | No | No | No | Yes |

**Important:** Leads do not receive manager tools. Supervisors do receive those tools, but not content-editor privileges. Ordinary managers are not automatically content editors. Enforce permissions in the server/API and file delivery as well as navigation.

The prototype does not restrict reports to a supervisor's own team. Authorized supervisors and managers can view the available report population. Team- or site-scoped access, if needed, requires an explicit IT/business decision.

### Demo profiles

| Persona | Job level | Demonstrated purpose |
|---|---|---|
| Alex Morgan | Manager, with Content Editor permission | Full management and content administration experience |
| Taylor Brooks | Supervisor | Management tools without content editing |
| Jordan Lee | Lead | General employee resources; no Talent Management or manager tools |
| Sam Rivera | Frontline Employee | General employee reference experience |

These are fictional, fixed prototype personas, not real directory accounts. Their access assignments are refreshed at server startup. Other registered employees are not reset by that demo refresh.

## 4. How the components connect

### Portal reference and document path

1. A person signs in or opens an already registered browser.
2. The portal establishes the current employee identity and permissions.
3. Home, search, and content lists request authorized resource metadata from the portal API.
4. Metadata identifies the resource's type, area, content group, audience, and document location or MeetQuinn URL.
5. For documents, an authorized file request retrieves the file from storage. PDF and Word viewers display supported formats inside the portal; download remains available.
6. For management templates, the user downloads a blank master and completes/saves a separate copy outside the portal.

### E-learning and completion path

1. The employee opens a portal e-learning detail page.
2. The portal records a page-open event against the signed-in employee and browser.
3. The employee's browser loads the configured MeetQuinn HTTPS URL inside an iframe, or opens it in a new tab.
4. MeetQuinn presents the externally hosted training and identifies the learner through its supported mechanisms.
5. When training is completed, MeetQuinn sends the completion email to the portal owner.
6. The portal owner reviews and forwards the notification to the appropriate manager.
7. The manager receives the forwarded email outside the portal. No automatic completion update returns to the portal.

| Component | Connects to | Responsibility and boundary |
|---|---|---|
| Employee browser / portal UI | Portal API; document viewer; MeetQuinn iframe | Navigation, search, forms, safe-use notice, and presentation |
| Portal API | Identity/session data; resource metadata; file storage; page-open events | Authorization, validation, resource persistence, and report queries |
| Identity/session store | Portal API | Who is using this browser and which actions they may perform |
| Resource catalog | Portal UI/API | One catalog connecting SOPs, learning links, and templates to areas/groups/audiences |
| File storage | Authorized file delivery and preview services | Uploaded document bytes; separate from catalog metadata |
| Word conversion service | Authorized Word files and in-app viewer | Produces safe, readable HTML; not exact Word layout fidelity |
| Page-open event store | Learning detail page and Viewing Report | Resource opens, employee identity, browser ID, and timestamps |
| MeetQuinn | Employee browser and email recipient | Training delivery and provider-side completion notifications |
| Portal owner and manager email | MeetQuinn email, then manual forwarding | Human completion-notification handoff; not a portal integration |

There is no implemented MeetQuinn API, webhook, inbox reader, SCORM/xAPI connection, automatic completion import, or email-forwarding integration.

## 5. MeetQuinn embeds: precise requirements

### Content setup

A designated content editor creates an e-learning resource and supplies a real HTTPS MeetQuinn share URL, title, description, warehouse area, content group, audience, and optional estimated duration. The URL is stored as metadata; the training itself stays on MeetQuinn.

The current prototype accepts an HTTPS URL and uses it directly as the iframe source. It does not translate an ordinary share link into a different embed URL, negotiate provider credentials, validate the MeetQuinn domain, or sign a provider-specific launch request. IT must confirm whether the supplied share URL is embeddable or whether MeetQuinn requires a dedicated embed URL.

### Employee experience

- The portal detail page displays the module title, description, area, audience, and estimated minutes when supplied.
- A responsive embedded frame displays the external module. The prototype uses a 16:10 frame with fullscreen support and permissions for autoplay and clipboard-write; IT should retain only provider-required permissions.
- An **Open in new tab** link uses the same external URL and remains the alternative when embedding or authentication fails.
- Missing links are shown explicitly as unavailable/awaiting a MeetQuinn link. Do not show a fake completed training.
- Autoplay is a browser/provider permission, not a guarantee that playback starts automatically.

### Identity and completion are provider responsibilities

Portal sign-in establishes identity for portal records only. The prototype does not send the employee's name, email, employee ID, or portal browser identifier to MeetQuinn through the launch URL. It does not automatically sign the employee into MeetQuinn.

IT must validate how MeetQuinn identifies each employee, especially on shared devices. If MeetQuinn requires a separate login or learner identification step, preserve it or implement a provider-supported identity integration. Do not invent URL parameters or assume iframe loading transfers identity.

Because the frame is on another origin, the portal cannot inspect its internal page, infer assessment results, or read completion state. No provider-documented completion messaging has been integrated. An iframe load, page-open record, new-tab click, or elapsed time must never be labeled “training completed.”

### Agreed email operating procedure

1. Configure MeetQuinn to send completion notifications to the portal owner.
2. Validate that each notification identifies the learner and completed module sufficiently for the owner to determine the correct employee and manager.
3. The portal owner forwards the notification to the employee's manager.
4. Managers handle any follow-up using the forwarded notification and existing company practices.

The portal does not currently store employee email addresses or employee-to-manager reporting lines. Manager identification and forwarding are manual/external to the portal. Decide the shared-device logout/learner-switch process with operations so a prior learner's MeetQuinn session is not reused accidentally.

### Provider/browser validation checklist

- Confirm the exact launch/embed URL format and whether embedding is permitted.
- Verify MeetQuinn framing policy, allowed origins, authentication requirements, and compatibility with the final portal domain.
- Test phone and desktop browsers, third-party-cookie restrictions, fullscreen, and opening in a new tab.
- Verify employee identity for both individual and shared-device use.
- Complete a real test module and verify the notification arrives, contains useful learner/module details, and can be forwarded to the intended manager.
- Test the forwarded email with a manager and agree how notification issues are handled.
- Do not assume behavior inside a development preview iframe is identical to the final production site.

## 6. Information architecture and content model

Every resource has a content type, warehouse area, content group, and audience. These classify different things and should remain separate.

| Dimension | Meaning | Values / behavior |
|---|---|---|
| Content type | What the resource is | SOP/document; e-learning; management toolkit template |
| Warehouse area | Operational destination | Receiving, Picking, Packing, Shipping, Inventory, Safety; plus Talent Management for supervisors/managers |
| Content group | Substance or process topic | Inbound; Putaway and Storage; Orders and Transfers; Distribution Outbound; Inventory Accuracy; System How-Tos and References |
| Audience | Who may access it | General employee resources or supervisors/managers; enforce authorization independently of grouping |
| Toolkit category | How blank masters are presented | Meeting Templates; 30-60-90 Assessments |

Editors can enter additional content-group names. Grouping does not grant access. Talent Management and all toolkit content are forced to the management audience.

Prototype audience values are `Employees`, `Managers`, and `Both`. The UI labels `Managers` as **Supervisors & managers**. `Employees` is not implemented as an exclusion of managers: leaders can also access general employee material. IT should use unambiguous permission names rather than infer access from these legacy strings.

Common metadata includes stable resource ID, title, description, area, group, audience, creation/update timestamps, and archived status. SOPs additionally expose owner, version, effective date, last-reviewed date, and file reference. Learning resources hold the external share URL and estimated minutes. Toolkit resources hold category and file reference.

Keep resource IDs stable when replacing files or editing titles so QR links and historical page-open records continue to identify the same resource. Version is currently a metadata label, not a version-history repository.

## 7. Screen-by-screen functionality

### Home — `/`

- Personal greeting and job-level label, not an area label such as “Shift reference · Shipping.”
- Search across authorized resource metadata, including title, description, area, content group, owner, category, and filename.
- Content-group filter, role-appropriate area cards, resource counts, and a recent-resource section.
- Area selection opens a filtered resource list; search and group selection narrow results.
- Supervisors/managers receive shortcuts to management resources and device registration.
- Search is metadata-based, not full-text indexing of Word/PDF content. Recent items are based on creation time, not a personalized recommendation engine.

### SOP library and detail — `/sops`, `/sops/:id`

- Search, area/group filtering, resource cards, and a detail view.
- Display title, description, area, owner, version, effective date, and last-reviewed date.
- Download the attached document.
- Preview PDFs using the current embedded browser PDF viewer, with a separate Full screen/new-tab link.
- Preview `.docx` and legacy `.doc` documents inside the app as converted readable content.
- Unsupported preview formats offer a download rather than pretending to render the document.
- Editors can jump to the editor and generate a printable workstation QR sheet pointing to the SOP.

The user chose to retain the existing PDF viewer despite Chrome blocking some embedded previews. Keep Full screen and Download alternatives. PDF supplies more reliable layout fidelity than converted Word when exact presentation is important.

### E-learning library and detail — `/learnings`, `/learnings/:id`

- Search and filter authorized module cards, then open the module detail page.
- Show metadata, the external embed, and the new-tab alternative.
- Record the authorized detail-page open, with visible recording/success/failure status and retry.
- This record can occur even if the provider frame later fails to load or the person does not complete training. It measures opening the portal page.
- Editors have an edit shortcut; everyone else is read-only.

### Manager Toolkit — `/toolkit`

- Supervisors and managers only.
- Area/group filtering and two presentation categories: Meeting Templates and 30-60-90 Assessments.
- Word meeting masters and Excel assessment masters are downloaded as blank documents.
- Users complete and save their own copies outside the portal. The portal must not collect completed assessments or meeting notes by implication.
- Link to the Viewing Report.

### Viewing Report — `/viewing-report`

- Supervisors and managers only.
- Filter by person and e-learning module.
- Group page-open events by person, module, and browser identifier.
- Show employee identity, job level, module, browser identifier, number of opens, and first/last-open timestamps.
- Retain historical reporting for archived modules and identify their archived status.
- Reporting does not prove playback, attention, passing, or completion. No completion percentage or LMS certification is implemented.
- No report export, team-specific scope, or automatic manager alerting is implemented.

### Register a Device — `/register-device`

- Supervisors and managers can choose an existing employee or add one using name, unique employee ID, and warehouse area.
- Choose Frontline Employee, Lead, or Supervisor as the employee's job level.
- Generate a six-digit code, single-use and valid for 15 minutes. A new code replaces that employee's previous outstanding code.
- The employee enters the code on the sign-in page to establish the browser session.
- Updating an existing employee's job level is saved when the code is generated.
- Manager accounts and content-editor privileges cannot be created through this employee device-registration form.

This is browser registration, not hardware enrollment, kiosk management, mobile-device management, or a hardware fingerprint. Clearing cookies creates a new browser identity. A shared device must reflect the currently signed-in person.

### Content Administration — `/admin`

- Designated Manager/Editors only.
- Add documents, e-learnings, and blank management templates.
- Edit metadata and replace associated files or external learning links.
- Upload document files; the prototype upload size limit is 20 MiB.
- Set area, audience, and content group; enforce management-only audience for toolkit/Talent Management.
- Search/filter by content type/group and switch between active and archived items.
- Archive with confirmation; restore archived content. Archiving hides content from normal users rather than permanently deleting it.
- Show SOPs needing review: missing last-reviewed date or last review at least one year ago.
- Flag missing MeetQuinn links. The current editor requires an HTTPS share URL for a saved learning resource.

The review indicator is not an automatic review reminder, approval process, or scheduled email. Replacing a file does not preserve a browsable historical file-version library.

### Sign-in and account switching — `/login`

- Choose among the four demo profiles, visibly labeled with their job levels and editor permission where applicable.
- Alternatively, redeem an employee device code.
- Switch profiles without exposing the previous person's cached restricted content.
- Show the current identity, support sign-out, and retain the safety notice.
- The prototype may automatically enter Alex's demo session for an unsigned visitor opening the main portal. This is a demonstration shortcut, not an acceptable production sign-in policy.

## 8. UI, branding, and safety

**Visual direction:** Hit Promotional Products branding, using the approved local blue/white Hit logos, strong blue accents, white cards, pale blue/gray backgrounds, and dark text. The signature brand blue reference is approximately `#0081C6`; deeper blue is used where needed for contrast. Keep a practical internal-tool identity rather than turning the portal into a product-sales catalog.

Desktop uses a persistent left sidebar with role-aware Home, SOPs, Learn, Toolkit, Devices, and Admin navigation. Phone layouts use a compact branded top bar and bottom navigation: Home, SOPs, Learn, and a Tools menu for supervisors/managers or Account for other employees. The account control leads to sign-in/profile switching.

Use readable system sans-serif typography, large touch targets, clear card hierarchy, restrained area-color accents, responsive search/filter controls, and explicit loading, empty, restricted, and error states. Retain keyboard operation, visible focus, meaningful labels, readable contrast, and a usable mobile layout in the rebuild.

### Required safety notice

Display this non-dismissible notice on sign-in and portal screens:

**“Stop in a safe location before using your device. Do not use this portal while operating heavy machinery or while in the path of moving equipment.”**

The current notice appears near the top of each screen; it is not a permanent sticky overlay while scrolling. It is a safety instruction, not a substitute for company training, safe work practices, or enforced device-use policy.

## 9. Persistence and technical reference

The prototype uses a React/Vite/TypeScript frontend, Wouter routing, TanStack Query, an Express/TypeScript API, PostgreSQL with Drizzle, an OpenAPI contract with generated client/Zod validation, and object storage for uploaded files.

| Logical record | Connects to / stores |
|---|---|
| Employee/user | Stable identity, employee ID, name, warehouse area, job level, access tier, editor permission |
| Browser session | Employee identity and expiration; secret cookie token is distinct from reporting browser ID |
| Device registration code | Employee, expiry, and single-use redemption |
| Resource | Stable resource identity plus catalog metadata and file reference or MeetQuinn URL |
| Uploaded file | File bytes in storage; referenced by the resource |
| Learning page-open event | Unique event, employee, resource, browser ID, server timestamp |

Current resource metadata is stored in JSONB under stable resource IDs; IT may normalize it. Job level and the older binary access tier are separate fields. Supervisor tool access is computed from job level, while editor access is separately restricted. IT should implement a clear role/permission model without copying ambiguous legacy names.

File delivery checks the session, resource audience, and archive status. Word conversion is performed server-side: `.docx` via Mammoth and sanitized HTML; legacy `.doc` via antiword text extraction. The converted preview is displayed in an isolated iframe with restrictive content handling. Do not rely on precise Word pagination or formatting.

The prototype browser-session lifetime is approximately one year. The registration code lifetime is 15 minutes. These demonstrate convenience, not approved production security settings.

### Page-open event semantics

Each authorized learning-detail visit gets a unique event ID. Server-side identity and timestamps are authoritative. Repeated delivery of the same event ID is deduplicated; revisiting the page can create another open. Browser IDs are pseudonymous cookie identifiers, not email addresses, physical-device registrations, or employee hardware IDs.

## 10. API and source map for IT

| Interface | Current responsibility |
|---|---|
| `GET/POST/DELETE /api/portal/session` | Session lookup, demo-profile/device-code sign-in, sign-out |
| `GET/POST /api/portal/resources` | Authorized catalog listing and editor-only resource save |
| `GET /api/portal/employees` | Employee selection for authorized device registration |
| `POST /api/portal/registrations` | Employee creation/job-level assignment and code issuance |
| `POST /api/storage/uploads/request-url` | Editor-authorized upload initiation |
| `GET /api/storage/objects/...` | Authorized uploaded-file delivery |
| `GET /api/portal/files/:id` | Seeded demonstration master-file delivery |
| `GET /api/portal/resources/:id/word-preview` | Authorized Word-to-readable-HTML preview |
| `POST /api/portal/learning-views` | Authorized, deduplicated page-open recording |
| `GET /api/portal/viewing-report` | Management-only page-open aggregation |

Useful source references:

- `artifacts/warehouse-portal/src/components/hit-shell.tsx`: session context, navigation, responsive shell.
- `artifacts/warehouse-portal/src/pages/`: all screens described above.
- `artifacts/warehouse-portal/src/lib/portal.ts`: frontend visibility, area/group definitions, metadata search, stale-review logic.
- `artifacts/warehouse-portal/src/hit-brand.css`: approved branding and responsive layout.
- `artifacts/api-server/src/routes/portal.ts`: authorization, resources, file access, and device registration.
- `artifacts/api-server/src/routes/learning-views.ts`: event recording and report aggregation.
- `artifacts/api-server/src/routes/word-preview.ts`: document preview boundary.
- `lib/api-spec/openapi.yaml`: current API contracts and field definitions.
- `lib/db/src/schema/`: current persistence definitions.
- `replit.md`: ongoing product decisions and prototype constraints.

These paths describe the reference implementation, not a mandated architecture for IT.

## 11. Production decisions IT must resolve

1. **Identity and account lifecycle:** Choose real company authentication, provisioning, termination handling, shared-device sign-out, session duration, and role assignment authority. Remove automatic/demo sign-in from production.
2. **Permissions:** Preserve the four tiers and explicit editor grant. Decide whether supervisors may promote employees to Supervisor, and who provisions Manager/Editor accounts. The prototype's registration form allows supervisors/managers to assign Frontline Employee, Lead, or Supervisor.
3. **Visibility scope:** Confirm whether reports and Talent Management material are company-wide, warehouse/site-scoped, or limited to direct reports. No reporting-line enforcement is implemented.
4. **MeetQuinn:** Validate embedding, learner identity, shared-device behavior, notification recipients/content, and the manual forwarding process through a real completion test.
5. **Content governance:** Assign owners/reviewers, agree review cadence, approved formats and file limits, replacement/archive rules, and whether formal approvals or version history are required.
6. **File/security controls:** Approve file validation, malware scanning, secure previews, URL/domain allowlisting, upload cleanup, storage permissions, authorization tests, and safe download behavior.
7. **Privacy and retention:** Define why viewing records are retained, employee notice, access restrictions, retention/deletion schedules, and how archived or departed-user history is handled.
8. **Reliability and support:** Establish backups/restore, monitoring, logging, error ownership, browser support, accessibility checks, support contacts, and rollout/training.
9. **QR links and domain:** Use stable final-domain links, preserve identifiers or redirects during migration, and confirm printed QR codes lead to authorized current content.

These are unresolved production decisions, not claims that the prototype already supplies those controls.

## 12. Rebuild acceptance checklist

- All four job levels are represented; content editing remains an explicit extra permission.
- Jordan/Lead and Sam/Frontline cannot see Talent Management, download its files, open management-only learning, register devices, or retrieve viewing reports through direct API calls.
- Taylor/Supervisor can use templates, registration, and reports, but cannot upload/edit/archive content or access Admin.
- Alex/Manager-Editor can maintain all three resource types, archive/restore, and print SOP QR sheets.
- Switching identities clears previous-user content and updates role-aware navigation; reloads preserve the correct identity.
- Home search and area/group filters operate on authorized metadata; group labels never bypass audience controls.
- PDF, Word, unsupported-document, missing-file, and failed-preview states have usable fallbacks.
- Replacing a document preserves its resource link; archived content disappears from normal access while authorized history remains reportable.
- A real MeetQuinn module works embedded or through the new-tab fallback; the correct employee is identified.
- Completing that real module produces the expected email to the portal owner; forwarding delivers it to the correct manager.
- A portal page open produces a reportable open event without claiming completion; event retry does not double-count the same visit.
- Codes expire after 15 minutes, are single-use, and cannot grant Manager/Editor access; non-demo employees cannot bypass codes through the demo-profile mechanism.
- The required safety notice appears on sign-in and portal pages on phones and desktop.
- Branding, touch interaction, keyboard access, mobile navigation, restricted states, loading states, and recoverable errors remain usable.
- Production identity, shared-device procedures, reporting scope, privacy/retention, backups, and content ownership are approved before operational rollout.

## 13. Handover interpretation

Use this document with the prototype to agree the rebuild scope and validate real workflows. Demonstration documents and personas are not approved operational procedures or production accounts. Provider-dependent behaviors should be signed off with a real MeetQuinn completion/notification test, not inferred from screenshots or portal view counts.

**Baseline to preserve:** a safe, branded, easily searchable warehouse reference hub; four clear job levels; explicitly restricted management/editor functions; in-app document access; externally hosted MeetQuinn learning; page-open visibility; and the manual completion-email handoff from MeetQuinn to the portal owner to the manager.
