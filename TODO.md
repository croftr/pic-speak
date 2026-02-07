Critical
1. Add automated tests
There are zero unit, integration, or E2E tests. This is the single biggest risk. I'd recommend:

Jest + React Testing Library for unit/component tests
Playwright for E2E tests (especially the card creation and audio playback flows)
Start with the API routes in src/app/api/ — they're the most critical paths

2. Add new template pecs cards for 
Dog (in the category animals) 
Cat (in the category animals) 
Fish (in the category animals) 

Happy (in the category feelings) 
Sad (in the category feelings) 

High Priority
4. Refactor BoardClient.tsx
This is a very large component with many state variables and responsibilities (drag-drop, card CRUD, audio playback, settings). Breaking it into smaller composable pieces (e.g. useBoardCards hook, CardGrid component, BoardToolbar) would improve maintainability.

5. Remove any types
There are several any types and a @ts-ignore in the codebase (e.g. batch card creation, board update parsing, generate-image/route.ts). Replacing these with proper types catches bugs at compile time.

~~7. Improve public board queries~~ DONE
getPublicBoardsWithInteractions() refactored to use LEFT JOINs with GROUP BY instead of correlated subqueries. Starter board interaction queries consolidated from 3 separate queries into 1.

Medium Priority
8. Add environment variable validation at startup
If a required env var (Clerk keys, Google AI key, database URL) is missing, the app will fail at runtime with a cryptic error. A startup check (e.g. with zod or a simple validation function) gives a clear, immediate error message.

9. Validate file content, not just MIME type
The upload endpoint checks MIME type, but MIME types can be spoofed. Checking file magic bytes or using a library like file-type adds a real layer of safety.

10. Enable removeConsole for production builds
next.config.ts has removeConsole: false. The codebase has detailed console.log instrumentation throughout, which is great for debugging but should be stripped in production.

11. Add client-side request timeouts
There are no fetch timeouts on the client. If the TTS or image generation API hangs, the UI just spins indefinitely. Adding AbortController with a reasonable timeout (e.g. 30s) and showing a retry option would improve UX.

Low Priority / Nice-to-Have
12. Add offline/PWA support — Given the target audience (parents/caregivers of non-verbal children), the app should ideally work offline or in low-connectivity situations. Service workers + cached board data would be valuable.

13. Add analytics — No usage tracking exists. Even basic anonymous analytics (board creation count, card tap frequency) would help you understand how the app is actually used.

14. Multi-language TTS support — The TTS is currently hardcoded to English. For a communication tool, supporting other languages would significantly expand the user base.
