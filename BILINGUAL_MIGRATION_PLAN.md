# Yamaha Bilingual Update Plan

## Objective

This project is currently stable.

Primary rule for the bilingual update:
- Do not disturb the existing generation logic
- Do not send Bangla into AI prompts
- Do not let Bangla content accidentally flow into bike selection or image generation logic
- Use Bangla only where the user reads content in the UI

Target result:
- User can read the app in Bangla
- Existing English logic remains the source of truth
- Prompt pipeline stays English-only
- Bangla fields in database are used only for display

---

## Core Principle

This project should not be converted into a fully language-dependent logic system.

Instead:
- Logic stays English-based
- Prompt stays English-based
- Database identifiers stay logic-safe
- Bangla is added as a presentation layer

This is the safest approach for the current stable version.

---

## What Must Stay English

These areas should remain English internally:

- AI image prompt generation
- Gemini text prompt instructions
- Bike selection logic
- Persona JSON payload structure
- Destination metadata used for prompt scene
- Aspiration metadata used for color matching
- Internal option IDs
- Query logic and rule logic

Important:
- Even if the user sees Bangla on screen, backend prompt-related values should still use English source values
- No Bangla should be passed into `generatePersonaCopy()` prompt unless you explicitly decide later to generate Bangla copy
- No Bangla should be passed into `buildImagePrompt()`

For now, safest path:
- Keep all prompt-facing content English-only

---

## What Can Become Bangla

These areas can safely be shown in Bangla:

- Form labels
- Placeholder text
- Validation messages
- Buttons
- Loading text
- Retry messages
- Quiz question text shown to the user
- Quiz option title/description shown to the user
- Result page labels
- Share button labels
- Admin helper labels if needed later

Safe rule:
- User-visible text can be Bangla
- Logic-facing text stays English

---

## Recommended Architecture

Use a split model:

### 1. Static UI text
Use translation dictionaries in code.

Examples:
- `Continue`
- `Back`
- `Loading`
- `Verify Identity`
- `Upload Photo`
- `Share Persona`

This should not come from the database.

### 2. Database-driven user content
Keep English fields as the original logic source.
Add parallel Bangla display fields.

Examples:
- Quiz questions
- Quiz option text
- Quiz option description
- Optional bike description

### 3. AI and backend logic fields
Always use English fields only.

---

## Recommended Language Model For This Project

Recommended languages:
- `en`
- `bn`

Recommended storage for selected language:
- `localStorage` for quick stability
- optionally mirror into cookie later if API needs it

Recommended first UX:
- Public pages only get language switch support
- Admin panel can remain English-only in phase 1

Why:
- Public flow is the user-facing priority
- Admin translation adds work but not core business value right now

---

## Database Plan

### Short answer
Yes, database should have Bangla fields for quiz content.

But:
- those Bangla fields are for display only
- English fields remain the only backend logic source

This is the safest design.

### Why DB Bangla fields are needed

Quiz data currently comes from backend.

That means if you want the quiz itself in Bangla, frontend alone is not enough.

Because the current API returns:
- question text
- option title
- option description

Those values currently come from database columns.

So if user must read the quiz properly in Bangla, DB needs Bangla display fields.

### Why Bangla should not replace English fields

If you replace current English text with Bangla:
- prompt-related metadata can get polluted
- admin logic becomes harder to maintain
- future prompt mistakes become more likely
- stable behavior becomes risky

So do not replace existing fields.
Add parallel Bangla fields.

---

## Recommended Database Schema Strategy

Do not redesign the whole schema.

Add only extra Bangla columns where needed.

### `quiz_questions`
Current important field:
- `question_text`

Add:
- `question_text_bn`

Meaning:
- `question_text` = English source
- `question_text_bn` = Bangla display text

### `quiz_options`
Current important fields:
- `option_text`
- `option_desc`
- `metadata`

Add:
- `option_text_bn`
- `option_desc_bn`

Meaning:
- `option_text` = English source
- `option_desc` = English source
- `option_text_bn` = Bangla display title
- `option_desc_bn` = Bangla display description
- `metadata` remains English-oriented for prompt and logic use

### Optional for bikes
Current:
- `description`

Optional add:
- `description_bn`

Only needed if users or admin must read Bangla bike description somewhere.

### Do not duplicate these in Bangla
Do not create Bangla variants of prompt metadata fields unless there is a very specific display need:
- destination `metadata.scene`
- destination `metadata.personality`
- aspiration `metadata.color`

Those should remain English because they support logic/prompt behavior.

If you ever need Bangla display versions for admin readability, keep them in separate keys and never use them in prompts.

Example:

```json
{
  "scene": "Cinematic hill road at sunrise",
  "scene_bn": "সূর্যোদয়ের সময় পাহাড়ি রাস্তা",
  "personality": "Calm and adventurous",
  "personality_bn": "শান্ত ও অভিযাত্রীসুলভ"
}
```

But safest phase-1 recommendation:
- do not add Bangla into metadata yet
- keep metadata fully English-only

---

## Safe Data Contract

This is the key rule for stability.

### English fields are the logic contract

Use English fields for:
- bike selection
- persona creation payload
- color resolution
- prompt generation
- AI copy prompt construction

### Bangla fields are the presentation contract

Use Bangla fields for:
- what the user reads
- quiz rendering
- labels if needed

This separation should be maintained consistently everywhere.

---

## File-Level Update Plan

Below is the safest order and what each file should do after the bilingual update.

### 1. Translation setup files

Recommended new structure:

```text
src/lib/i18n/
  translations.ts
  get-language.ts
  language-store.ts
  types.ts
```

Purpose:
- keep fixed UI strings in code
- keep selected language handling isolated
- avoid spreading translation logic across pages

### 2. `src/app/page.tsx`

Update purpose:
- translate lead form labels and OTP view UI
- keep submitted payload structure unchanged

Important:
- API body can optionally include `lang`
- user-facing labels/messages become localized
- name/phone/dob/gender/division values remain structurally the same

### 3. `src/app/quiz/page.tsx`

Update purpose:
- display Bangla question/option text if selected language is `bn`

Important:
- selected option ID remains unchanged
- logic still submits option IDs only
- no Bangla text is required in submit payload

### 4. `src/app/upload/page.tsx`

Update purpose:
- translate loading messages and retry/error messages

Important:
- `persona` submitted to backend should remain the same English-based JSON payload
- no Bangla should be inserted into prompt-related data

### 5. `src/app/result/[id]/page.tsx`

Update purpose:
- translate headings, badges, labels around result UI

Important:
- `traits_summary` handling depends on future decision
- safest phase-1: keep AI summary in English if generated by backend
- or show localized fixed labels around an English AI summary

### 6. `src/app/result/[id]/ResultActions.tsx`

Update purpose:
- localize action labels
- localize clipboard/share alerts

Important:
- share URLs remain unchanged

### 7. `src/app/layout.tsx`

Update purpose:
- provide global language context
- load selected language safely

### 8. `src/app/api/quiz/questions/route.ts`

Update purpose:
- return localized display fields based on selected language

Important:
- route should still keep the original English source available internally if needed
- frontend should receive localized presentation values only

Suggested response behavior:
- if `lang=bn` and Bangla field exists -> return Bangla text
- else fallback to English

### 9. `src/app/api/quiz/submit/route.ts`

Update purpose:
- mostly unchanged logic

Important:
- this route should continue using option IDs
- when it reads metadata from DB, it should read English logic fields only
- no Bangla dependency here

### 10. `src/lib/server/ride-persona.ts`

Update purpose:
- ideally no business logic change

Important:
- prompt builder must only use English metadata
- bike color matching must only use English values

### 11. `src/lib/server/gemini.ts`

Update purpose:
- keep prompt text English-only

Important:
- image prompt must remain English
- text generation prompt must remain English unless you intentionally change copy output later

### 12. Admin quiz manager files

Files:
- `src/app/admin/quiz/page.tsx`
- `src/app/api/admin/quiz/questions/route.ts`
- `src/app/api/admin/quiz/options/route.ts`

Update purpose:
- admin should be able to input both English and Bangla quiz text

Important:
- English fields remain required
- Bangla fields can be optional during rollout

This is the cleanest way to gradually fill Bangla content without breaking the live quiz.

---

## API Language Handling Recommendation

For stability, do not make every API depend deeply on language immediately.

Recommended approach:

### Phase 1
- frontend keeps selected language in `localStorage`
- quiz question fetch includes `lang`
- only display-oriented APIs care about `lang`

### Phase 2
- if needed, mirror `lang` to cookie
- use cookie for server-rendered result metadata or future SSR behavior

Display-oriented APIs:
- `/api/quiz/questions`
- possibly result-related display helpers later

Logic-oriented APIs should stay language-agnostic:
- `/api/quiz/submit`
- `/api/generate`

Even if `lang` is sent to `/api/generate`, it should not affect prompt language in your current safe version.

---

## Prompt Safety Rules

This section is critical.

### Rule 1
Never build the image prompt from Bangla text.

### Rule 2
Never replace `metadata.scene`, `metadata.personality`, or `metadata.color` with Bangla values inside prompt logic.

### Rule 3
Never use Bangla quiz labels as prompt source.

### Rule 4
If Bangla display fields exist in DB, prompt code must ignore them.

### Rule 5
If language is `bn`, only the visible UI changes unless you intentionally expand copy generation later.

---

## How Quiz Data Should Work After Update

### What user sees in Bangla mode
- Bangla question title
- Bangla option title
- Bangla option description

### What backend uses
- same question ID
- same option ID
- same English metadata
- same English mapping logic

So the user reads Bangla, but backend still reasons from English-linked DB rows and IDs.

This is exactly what you want for stability.

---

## Result Page Strategy

There are 2 safe options.

### Option A: Keep AI summary English for now

Pros:
- zero prompt risk
- no AI language change
- safest

Cons:
- Bangla user sees one English paragraph on result page

### Option B: Translate only the visible shell first, keep AI-generated summary English

Pros:
- still safe
- result page mostly understandable in Bangla

Cons:
- mixed language remains in the summary

### Option C: Later generate Bangla summary separately

Only do this if you want full Bangla output later.
If done, keep image prompt English and only adjust the summary text request.

Current recommendation:
- do not touch prompt language now
- if needed later, add separate Bangla copy generation carefully

---

## Admin Update Recommendation

Admin panel does not need full Bangla support in phase 1.

But admin quiz forms should support Bangla content entry.

Recommended admin behavior:
- English fields required
- Bangla fields optional
- admin can save partial Bangla content
- frontend falls back to English when Bangla field is empty

This allows gradual content migration without breaking the quiz.

---

## Fallback Rules

Every Bangla display field should have fallback to English.

Examples:
- if `question_text_bn` is empty -> show `question_text`
- if `option_text_bn` is empty -> show `option_text`
- if `option_desc_bn` is empty -> show `option_desc`

This is important because:
- content can be added gradually
- rollout becomes safer
- no page becomes blank due to missing translation

---

## Recommended Rollout Phases

### Phase 1: Foundation
- add i18n helper structure
- add language toggle
- translate fixed static UI text only

### Phase 2: Database display fields
- add Bangla columns
- populate Bangla values for quiz questions and options
- keep all logic fields unchanged

### Phase 3: Quiz localization
- make `/api/quiz/questions` return localized display text
- keep `/api/quiz/submit` unchanged logically

### Phase 4: Upload/result localization
- localize upload messages
- localize result shell labels
- keep prompt path English-only

### Phase 5: Admin content entry
- allow editing Bangla quiz text in admin

### Phase 6: Optional copy localization later
- only if you decide to support Bangla-generated summary text

---

## Database Migration Recommendation

Recommended DB changes:

### Add columns
- `quiz_questions.question_text_bn TEXT NULL`
- `quiz_options.option_text_bn VARCHAR(255) NULL`
- `quiz_options.option_desc_bn TEXT NULL`
- optionally `bikes.description_bn TEXT NULL`

### Do not change
- `quiz_questions.question_text`
- `quiz_options.option_text`
- `quiz_options.option_desc`
- `quiz_options.metadata`
- `option_bike_mappings`
- `generations` logic columns

### Content population approach
- keep current English values untouched
- manually add Bangla content into new fields
- test frontend fallback behavior before filling all rows

---

## What Not To Do

Avoid these mistakes:

- Do not overwrite English quiz fields with Bangla
- Do not store Bangla in prompt-facing metadata as the only value
- Do not make bike selection depend on translated strings
- Do not derive prompt language from UI language
- Do not refactor the whole routing structure just for language support right now
- Do not move to heavy localization framework if current simple approach is enough

---

## Safest Final Shape

After the update, the system should behave like this:

### Public UI
- user chooses Bangla or English
- static labels come from code translations
- quiz text is shown in localized display fields

### Backend logic
- still uses IDs and English logic data
- unchanged bike mapping behavior
- unchanged color resolution behavior

### AI
- image prompt stays English
- generation pipeline stays stable

### Database
- English = source of truth for logic
- Bangla = source of truth for display

---

## Final Recommendation

For your project, the best stable bilingual strategy is:

1. Add Bangla only as presentation
2. Keep all logic and prompts English
3. Add Bangla DB fields only for quiz display content
4. Keep metadata English-only for now
5. Let frontend choose Bangla fields when user language is `bn`
6. Always fall back to English if Bangla field is missing

This preserves the stable version while making the user experience readable in Bangla.

---

## Next Useful Document

After this plan, the next practical file should be:

`BILINGUAL_IMPLEMENTATION_CHECKLIST.md`

That should contain:
- exact file-by-file changes
- exact DB migration SQL
- exact API behavior rules
- testing checklist before release