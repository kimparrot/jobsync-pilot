# Product workflows: document reuse map (job-search pilot)

Base: `527333e60d4913f3af217c2153a8ee7bc68cf857` (public repo `kimparrot/jobsync-pilot`, upstream `Gsync/jobsync`).
Scope: product/UX documentation only. Source evidence (static inspection of the worktree); **no runtime validation** — nothing was run, installed, or deployed for this note. Security/auth/data-boundary analysis is owned by a separate assessor and is out of scope here.

Goal: adapt the existing application/resume product into a polished job-search pilot **without a rewrite**, by reusing what exists and adding the smallest missing transitions.

## 1. What exists today (with source pointers)

### A. Uploaded resumes (original source files)

- Upload dialog: `src/components/profile/CreateResume.tsx` — title + `.pdf`/`.docx` file as `FormData{title,file,id?}` → `POST /api/profile/resume`. Validation in `src/models/createResumeForm.schema.ts` (title 1–100 chars, allowed MIME, ≤ 5 MB).
- Upload API: `src/app/api/profile/resume/route.ts` — `POST` validates size, MIME, and magic bytes (`%PDF` / `PK\x03\x04`), then `saveResumeUpload()`; `GET ?resumeId=` streams the stored file back with an ownership check (`profile.userId`). Download button: `src/components/profile/DownloadFileButton.tsx`.
- Storage helpers: `src/lib/resumeFiles.ts` (`resumesDir()` under `UPLOADS_DIR/files/resumes`, traversal guard `isResumeFilePath()`); DB link in `src/actions/profile/resumeUpload.ts` (`createResume()` / `replaceResumeFile()`, `createFileEntry()` with `fileType='resume'` in `src/actions/profile/shared.ts`).
- Limits/constants: `src/lib/constants.ts` (`MAX_RESUME_FILE_SIZE_BYTES=5MB`, `RESUME_ALLOWED_MIME_TYPES`, import caps: 5 PDF pages / 50k chars, 30 s extract timeout, 240 s AI import timeout).
- Parsing: `src/lib/ai/import/extract-text.ts` — `unpdf` (PDF) + `mammoth` (DOCX raw text) with zip-bomb/encryption guards. Deps in `package.json`: `unpdf`, `mammoth`, `jszip`.
- AI structuring: `src/app/api/ai/resume/import/route.ts` — reads the stored file, `extractText()` → `preprocessText()` → streams structured `ResumeImportSchema` (`src/models/resumeImport.schema.ts`) as NDJSON. Client orchestrator: `src/components/profile/resume-container/useResumeImport.ts` (+ `StructureWithAiCard.tsx`, `ImportReviewBanner.tsx`, `PendingCardRow.tsx`, `pendingCards.ts`); writers: `src/actions/resumeImport.actions.ts` + the writers under `src/actions/resumeImport/`.
- Prisma: `prisma/schema.prisma` — `Resume` (`title`, `FileId? @unique`, `reviewData?`), `File` (`fileName`, `filePath` local relative path, `fileType` always `"resume"`), `User.defaultResumeId` default pointer, `Profile` as ownership scope.

### B. Reusable profile facts (the corrected, structured profile)

All reusable facts live **under a `Resume`**, not under a standalone profile. `Profile` (`prisma/schema.prisma`) is a thin `userId` scope holding `resumes[]` + `coverLetters[]`.

- Canonical include: `src/lib/jobs/resumeDetailInclude.ts` (`ContactInfo`, `File`, `ResumeSections` with `summary`, `workExperiences{jobTitle,Company,location}`, `educations{location}`, `licenseOrCertifications`, `skills{Tag}`).
- Textifier for AI/match: `src/lib/ai/tools/preprocessing.ts` (`convertResumeToText()` → CONTACT + SUMMARY + EXPERIENCE + EDUCATION + CERTIFICATION + SKILLS); lighter variant `src/lib/scraper/automation-run/resumeText.ts`.
- Default-resume resolution: `src/lib/jobs/getDefaultResumeForUser.ts` (`User.defaultResumeId` → full include); agent variant `src/lib/agent/resumeLookup.ts` (priority named → page → default → only).
- Server actions (`src/actions/profile/`): `resume.ts` (`getResumeList` / `getResumeById` / `editResume` title-only / `deleteResumeById`), `defaultResume.ts` (`getDefaultResumeId` / `setDefaultResume`, gated by `hasMinResumeSections()` in `src/lib/resumeSections.ts`), `contactInfo.ts`, `summary.ts`, `experience.ts`, `education.ts`, `certification.ts`, `skills.ts` (skills store `Tag.label` as canonical text + `category`/`order`), `resumeCopy.ts`, `files.ts`.
- Detail UI: route `src/app/dashboard/profile/resume/[id]/page.tsx` → `src/components/profile/ResumeContainer.tsx` (splits `ResumeSections` by `SectionType`, cards `ContactInfoCard`, `SummarySectionCard`, `ExperienceCard`, `EducationCard`, `CertificationCard`, `SkillsSectionCard`, plus `Add*` dialogs).

### C. Editable resume layouts / templates

- Two `@react-pdf/renderer` layouts (export only — the on-screen editor is section cards, not WYSIWYG): `src/components/profile/resume-pdf/SimpleTemplate.tsx`, `src/components/profile/resume-pdf/ProfessionalTemplate.tsx`, styles in `src/components/profile/resume-pdf/styles/`, builder `src/components/profile/resume-pdf/generateResumePdf.tsx` (filename `{title} - {Simple|Professional}.pdf`).
- Settings model: `src/models/resumeExport.model.ts` (`template: simple|professional`, `font`, `fontSize`, `lineHeight`, `marginVertical/Horizontal`, `sectionSpacing`, `entrySpacing`, per-template defaults). Dialog: `src/components/profile/ExportPdfDialog.tsx` + `src/components/profile/export-pdf-dialog/ExportSettingsPanel.tsx` + shared shell `src/components/pdf-export/PdfExportDialog.tsx`; hooks `src/components/profile/resume-container/useResumeExportSettings.ts`, `useResumePdfPreview.ts`, `useResumePdfExport.ts`.
- Export gate: `canExportResume()` in `useResumePdfExport.ts` (needs a name **or** any non-empty section).

### D. Job-specific resume / letter variants

- Resume variants = **manual full copies**. `src/actions/profile/resumeCopy.ts` (`copyResume()` clones `ContactInfo` + all sections; `getResumeCopyTitleSuggestion()` / `src/lib/resumeCopyTitle.ts` proposes `{Title} (2)`-style names). Dialog: `src/components/profile/CopyResumeDialog.tsx`. There is **no automatic per-job tailoring** of resume content and no diff/link between a copy and its source.
- Letter variants = **manual + per-job AI generation**. `generateCoverLetterForJob()` in `src/actions/coverLetter.actions.ts` creates a `CoverLetter` (`title` via `src/lib/coverLetterTitle.ts` → `{JobTitle - Company}`) and links `Job.coverLetterId` in one transaction. Agent tool `src/lib/agent/tools/generateCoverLetter.ts` (`generate_cover_letter`) resolves the job (`src/lib/agent/jobLookup.ts`), blocks title-only jobs, picks the resume, and runs nested generation. Per-job tab: `src/components/myjobs/job-details/CoverLetterTab.tsx` (empty → Generate; else title + Regenerate + viewer). Header shortcut: `src/components/myjobs/job-details/JobDetailsHeader.tsx`.
- Job linkage: `prisma/schema.prisma` `Job{resumeId?, coverLetterId?}` — records **which** documents were used for an application, not a variant lineage.

### E. Exports

- Resume PDF (above) **also re-attaches**: `useResumePdfExport.ts` downloads the blob **and** `POST`s it back to `/api/profile/resume` (first export attaches; later exports ask replace vs download-only). This is the one existing source→output bridge.
- Cover-letter PDF: single business-letter layout `src/components/profile/cover-letter-pdf/CoverLetterTemplate.tsx`, builder `src/components/profile/cover-letter-pdf/generateCoverLetterPdf.tsx`, settings `src/models/coverLetterExport.model.ts` (font/size/lineHeight/margins/paragraph spacing), dialog `src/components/profile/CoverLetterExportDialog.tsx`, gate `src/components/profile/cover-letter-export-dialog/canExportCoverLetter.ts`.
- Jobs CSV: `src/app/api/jobs/export/route.ts` + `src/components/myjobs/jobs-container/downloadJobsCsv.ts` (job tracker rows, not documents) — a user data-management feature.
- Backup zip (user data-management: export/recovery, not product document export): `src/lib/backup/export.ts` / `import.ts` bundles DB rows + `files/resumes/*`.

### F. Previous applications and letters (history)

- Model: `Job` **is** the application (`prisma/schema.prisma`: `applied`, `appliedDate`, `dueDate`, `statusId→JobStatus`, `resumeId?`, `coverLetterId?`, `matchScore?`, `matchData?`, plus `discoveryStatus`). `CoverLetter{title,content}` with `Job[]` back-link (`_count.Job` blocks delete when in use — see `src/components/profile/ResumeTable.tsx`, `src/actions/coverLetter.actions.ts`).
- Status workflow: `src/lib/constants.ts` (`JOB_STATUSES`: new, draft, applied, interview, offer, offer-accepted, offer-declined, rejected, expired, archived; orthogonal `DISCOVERY_STATUSES`: new/accepted/dismissed). Transitions: `src/actions/job/status.ts` (`updateJobStatus`), `src/components/myjobs/AddJob.tsx` (`applied` switch bumps draft→applied). Display overrides: `src/components/myjobs/JobStatusBadge.tsx` (dismissed/past-due).
- Library UI: `src/app/dashboard/profile/page.tsx` → `src/components/profile/ProfileContainer.tsx` merges resumes + letters into one `ProfileDocument[]` table (`src/components/profile/ResumeTable.tsx`: Title/Type/Created/Updated/Jobs/Actions). Create/edit letter: `src/components/profile/CreateCoverLetter.tsx` (validates `src/models/coverLetterForm.schema.ts`: title ≤100, content ≥10 chars; inline Export-to-PDF of unsaved values).
- Tracker UI: `src/app/dashboard/myjobs/page.tsx` → `src/components/myjobs/JobsContainer.tsx` (`MyJobsTable` / `MyJobsGrid`, `JobsToolbar`, filters `useJobFilters`, paging `useJobsList`); detail `src/app/dashboard/myjobs/[id]/page.tsx` → `src/components/myjobs/JobDetails.tsx` (tabs description|match|letter|notes|contacts; `AddJob.tsx` dialog links `resume`/`coverLetter` selects). Server actions: `src/actions/job/queries.ts` (`getJobsList`, `getJobDetails`), `src/actions/job/mutations.ts` (`addJob`/`updateJob`/`deleteJobById` with `assertJobRefsOwned`), `src/actions/job/references.ts`.

### G. Career-assistant UI (chat + review/match)

- Docked non-modal panel available on every dashboard page: `src/app/dashboard/layout.tsx` mounts `AgentChatProvider` + `AgentChatPanel` (`src/components/agent/AgentChatPanel.tsx` — resizable `Sheet`, `modal={false}`, ignores outside clicks). State: `src/components/agent/AgentChatProvider.tsx`; empty state / messages / input: `AgentChatEmptyState.tsx`, `AgentChatMessages.tsx`, `AgentChatInput.tsx`; trigger: `src/components/AgentChatTrigger.tsx`.
- Five tools (`src/lib/agent/tools/index.ts`): `add_job`, `get_resume`, `review_resume`, `match_job`, `generate_cover_letter` (implementations under `src/lib/agent/tools/`; job/resume resolution `src/lib/agent/jobLookup.ts`, `src/lib/agent/resumeLookup.ts`; nested-generation guard `src/lib/agent/nestedGeneration.ts`). Entry: `POST /api/ai/chat` (`src/app/api/ai/chat/route.ts`, page-aware via `pageContext`). Result cards: the components under `src/components/agent/AgentResultCard/` (`ReviewResumeResult`, `MatchJobResult`, `CoverLetterResult`, `GetResumeResult`, `ResumeSelectionPrompt`, `NoResumesNotice`, `AddJobResult`).
- Review persistence: `Resume.reviewData` (JSON string; rendered by `src/components/profile/ReviewDetails.tsx`, launched from `ResumeContainer.tsx` via `Review {title}` chat message). Match persistence: `Job.matchScore`/`matchData` (`saveJobMatchResult()` in `src/actions/job/status.ts`).
- Providers: `src/models/ai.model.ts` (`AiProvider`: ollama/openai/deepseek/gemini/openrouter; **default is local Ollama**). The panel header shows provider/model preflight. **No voice input, no speech-to-text, no text-to-speech in the worktree** (no voice/speech/mic/whisper UI or route under `src/components/agent/`).

## 2. Conflated concepts (designer brief — what to untangle)

| # | Conflation | Where it shows | Recommendation |
|---|-----------|----------------|----------------|
| 1 | Original upload **is** the resume | `Resume` holds both `File.filePath` (bytes) and `ResumeSections` (structured facts); `ResumeHeader.tsx` swaps title ↔ download button; export re-attaches the PDF over the same `FileId` (`useResumePdfExport.ts`) | Name four layers everywhere: **Source file** (untouched upload) / **Profile** (corrected reusable facts) / **Layout** (Simple/Professional + settings) / **Job version** (copy or letter linked to a `Job`). Direction: never overwrite the source upload with an export. Association mechanism unresolved — see §3. |
| 2 | Library mixes **reusable profile** with **job outputs** | `ProfileContainer.tsx` + `ResumeTable.tsx` list base resumes, tailored copies, and cover letters in one `ProfileDocument[]` table distinguished only by a Type badge | Split or filter the library: “My profile” (default resume) vs “Job versions” (copies + letters grouped by `Job`), with the `Jobs` count column promoted to a link. |
| 3 | **Copy** vs **tailored version** are identical UI | `CopyResumeDialog.tsx` clones everything with a `(2)` title; nothing records source resume, target job, or what changed | A job version should record `sourceResumeId → jobId` and a one-line “what changed”; title pattern `{Company} — {Title}` instead of `(2)`. |
| 4 | **Default resume** vs **selected resume** vs **attached file** | `User.defaultResumeId` (generation default), `Job.resumeId` (which resume an application used), `Resume.FileId` (attached bytes); `AddJob.tsx` resume select requires `hasMinResumeSections()` while export needs only a name-or-section (`canExportResume`) | One picker everywhere with three labelled slots: default (profile), this-job (override), file (source). Unify the gating message. |
| 5 | **Review** (advice) vs **match** (score) vs **content** | `Resume.reviewData` advice renders inside `ResumeContainer`; `Job.matchScore/matchData` renders in `JobDetails` match tab; both launch from similar chat/agent buttons | Keep advice visually distinct from facts (existing `ReviewDetails.tsx` + `AgentReviewScoreCard.tsx` pattern) and never write AI wording back into sections except via the import-review accept/discard pattern (`ImportReviewBanner.tsx`). |
| 6 | **Developer apparatus** reads as product | MCP routes (`src/app/api/mcp/route.ts`), `SupportDialog.tsx` (points at public GitHub issues) | Keep developer routes behind an explicit Developer/Tester area per LeaseKit lesson; pilot feedback needs its **own** destination (missing — see §4). Backup zip and jobs CSV are user data-management features, not developer apparatus — keep them available; do not hide useful export/recovery. |

## 3. Limitations and smallest missing transitions (no rewrite)

| Gap | Status | Smallest transition reusing existing pieces |
|-----|--------|---------------------------------------------|
| Provenance: source vs profile vs layout vs job output indistinguishable | Missing — **unresolved** | Direction: stop overwriting uploads and surface the four layers in `ResumeHeader.tsx` + `ProfileContainer.tsx` labels. Mechanism is **undecided**: today `Resume.FileId` is a unique link (one file per resume), so keeping source and generated files side by side needs an explicit association decision plus an ownership-reviewed implementation. A `fileType` value or filename suffix alone is **not** asserted to preserve retrievable lineage. |
| Job-specific resume tailoring | Manual-copy only | Add optional `jobId` to the copy flow: from `JobDetails` “Tailor resume” → `copyResume()` → `updateJob({resumeId: copy.id})` (both actions exist). Record lineage in the copy title; diff view deferred. |
| Per-job letter exists but is chat-or-tab buried | Exists, undiscoverable | Promote the existing `CoverLetterTab.tsx` empty-state + `JobDetailsHeader.tsx` Regenerate button into a one-click “Generate → preview → attach” strip; reuse `generateCoverLetterForJob()` + `CoverLetterExportDialog.tsx`. |
| OpenAI voice + text from first hosted pilot | Text exists (provider enum), **voice missing entirely** | Voice is a **separate implementation dependency**, not deploy-config-only work. Required: OpenAI voice **input and spoken output** for the career assistant, wired into the existing `/api/ai/chat` + `AgentChatInput.tsx`/`AgentChatMessages.tsx` flow. Web Speech-only or transcription-only (no spoken output) is **insufficient**. OpenAI text = provider/model selection (`src/models/ai.model.ts`); voice = new implementation (input capture, spoken-output playback, supported OpenAI voice contract). |
| Invite-only private accounts | Not verified in this doc (auth owned separately; do not assume) | Treat as unresolved: confirm invite gate outside this file before pilot copy promises it. |
| Separate developer/tester feedback destination | Missing (Support points at `Gsync/jobsync#issues`) | Add a pilot-only feedback form/route writing to its own store or mailbox; keep `SupportDialog.tsx` for open-source support. Do not comingle. |
| Shell/empty/loading/error consistency (LeaseKit) | Shell exists (`src/app/dashboard/layout.tsx`: `Sidebar` + `Header` + `SidebarInset` + docked chat), empty states exist per surface (`AgentChatEmptyState`, `CoverLetterTab` empty, export `EMPTY_MESSAGE`) but vary | Standardise on the existing `PdfExportDialog` empty/error pattern and the `ImportReviewBanner` accept/discard pattern; no new component system. |

## 4. Pilot-requirements mapping

- **Invite-only private accounts:** unresolved here — auth is owned by the separate assessor; this doc makes no claim about signup/invite behaviour.
- **OpenAI voice + text from day one:** text path is provider-pluggable (`AiProvider.OPENAI`, models in `src/models/ai.model.ts`; chat via `POST /api/ai/chat`); voice UI does not exist and is the largest pilot gap (§3). The pilot requires OpenAI voice input **and** spoken output plus a separate feedback destination — a supported OpenAI voice contract is a standalone implementation dependency, not deploy-config-only work.
- **Separate feedback destination:** missing; `SupportDialog.tsx` targets the public tracker — add a distinct pilot channel.
- **Source vs profile vs layout vs outputs distinguishable:** data model already separates bytes (`File`), facts (`ResumeSections`), settings (`ResumeExportSettings`), and linkage (`Job.resumeId/coverLetterId`); the UI collapses them (§2 #1–#4). Direction is labelling + stop-overwrite, but the source/generated association decision is **unresolved** and needs an ownership-reviewed implementation (§3) — this doc asserts no mechanism.
- **LinkedIn as design reference:** not inspected here (owned by the research partner); no LinkedIn claims made.
- **LeaseKit lessons applied:** keep `Sidebar`/`Header`/docked-panel shell (`src/app/dashboard/layout.tsx`); reuse the clear empty/loading/error states (`ExportPdfDialog`, `CoverLetterTab`, `AgentChatEmptyState`); keep search focused (`JobsToolbar`, `SearchInput`); use progressive disclosure (tabs in `JobDetails`, settings panels); isolate developer routes (MCP) from the pilot document flow while keeping backup/CSV available as user data-management.

## 5. Recommended first document workflow (uses only existing pieces)

**“Upload once → correct profile → set default → tailor per job → export.”**

1. Upload source (`CreateResume.tsx` → `POST /api/profile/resume`) — keep bytes immutable.
2. Structure with AI (`StructureWithAiCard` → `/api/ai/resume/import` → accept/discard in `ImportReviewBanner`) or edit section cards manually; verify in `ResumeContainer`.
3. Set default (`setDefaultResume()`; gate `hasMinResumeSections()`).
4. Per job: `AddJob` (or agent `add_job`) → open `JobDetails` → Match (`match_job`, writes `matchScore/matchData`) → Tailor (copy resume via `CopyResumeDialog`, link `Job.resumeId`) → Cover letter (`CoverLetterTab` Generate via `generate_cover_letter`, writes `Job.coverLetterId`) → Review (`review_resume`, writes `Resume.reviewData`, advice-only).
5. Export resume PDF (`ExportPdfDialog`, Simple/Professional) + letter PDF (`CoverLetterExportDialog`); direction is download **and** keep the generated file alongside — not over — the source (association mechanism unresolved, see §3).
6. Track in `myjobs` statuses (`draft → applied → interview → offer…`) with the used documents linked.

### Acceptance checklist (pilot slice)

- [ ] Uploader accepts PDF/DOCX ≤ 5 MB, rejects with the existing messages; source file stays byte-identical after later exports (per the §3 association decision once made).
- [ ] AI structuring offers accept/discard per card; discarding leaves sections untouched.
- [ ] Default resume is visually badged in the library; job pickers default to it but allow override.
- [ ] From a job page, user can generate a letter, tailor (copy) a resume, and see both linked (`JobSummaryCard` / letter tab) without opening chat manually.
- [ ] Exports show live preview + settings (both templates for resumes); filenames identify layout.
- [ ] Review/match outputs render as advice/scores, never silently rewrite sections.
- [ ] Library distinguishes Source / Profile / Job version at a glance (labels, not just Type badge).
- [ ] Career assistant supports OpenAI voice input **and** spoken output on the hosted build (transcription-only or Web Speech-only does not satisfy); OpenAI text works; tester feedback goes to the pilot channel, not GitHub issues.

## 6. Existing test pointers (run before touching the flow)

Unit (`__tests__/`, vitest — Parent baseline: 237 files / 2870 tests):

- Resume/profile: `CreateResume.spec.tsx`, `AddContactInfo.spec.tsx`, `AddExperience.spec.tsx`, `AddEducation.spec.tsx`, `AddResumeSummary.spec.tsx`, `CopyResumeDialog.spec.tsx`, `ProfileContainer.spec.tsx`, `ResumeContainer.spec.tsx`, `ReviewDetails.spec.tsx`, `canExportResume.spec.ts`, `defaultResume.actions.spec.ts`.
- Letters: `coverLetter.actions.spec.ts`, `coverLetterForm.schema.spec.ts`, `coverLetterTitle.spec.ts`, `coverLetterPdf.spec.ts`, `coverLetterStyles.spec.ts`, `coverLetterExportSettings.spec.ts`, `CoverLetterSettingsPanel.spec.tsx`, `canExportCoverLetter.spec.ts`.
- Agent/match/import: `AgentChatEmptyState.spec.tsx`, `AgentChatInput.spec.tsx`, `AgentChatMessages.spec.tsx`, `AgentChatProvider.spec.tsx`, `AgentChatClosePaths.spec.tsx`, `AgentResultCard.spec.tsx`, `AgentReviewScoreCard.spec.tsx`, `agentGetResumeTool.spec.ts`, `agentReviewResumeTool.spec.ts`, `agentMatchJobTool.spec.ts`, `agentCoverLetterTool.spec.ts`, `agentResumeLookup.spec.ts`, `mcpReviewResume.spec.ts`, `matchGuidance.spec.ts`, `automationMatchPrompt.spec.ts`.
- Export/backup: `ExportSettingsPanel.spec.tsx`, `coverLetterExportSettings.spec.ts`, `backupExport.spec.ts`, `backupImportGuards.spec.ts`.

E2E (`e2e/`, playwright): `profile.spec.ts`, `agent-chat.spec.ts`, `add-job.spec.ts`, `backup.spec.ts`, `dashboard.spec.ts`, `mcp-add-job.spec.ts`.

## 7. Unresolved facts / not validated

- Invite-gate behaviour, the supported OpenAI voice contract (input + spoken output), the source/generated file association decision, and any hosted-storage (non-local-disk) path: not inspected or not decided here (auth/hosting out of scope; association needs an ownership-reviewed implementation) — unknown stays unknown.
- All routes, gates, and limits above are **source claims only**; no test suite, dev server, or export was executed for this note. Re-run §6 suites plus one manual upload→import→copy→letter→export pass before pilot sign-off.
