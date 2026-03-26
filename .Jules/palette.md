## 2025-05-14 - [Accessibility audit of a legacy-style vanilla JS application]
**Learning:** In projects using older web patterns (like vanilla JS and manual HTML generation), common accessibility features like label associations (`for` attributes) and ARIA roles for dynamic content are often overlooked.
**Action:** When working with such codebases, prioritize an accessibility sweep that includes:
1. Linking all labels to inputs via `for`/`id`.
2. Hiding decorative icons from the accessibility tree using `aria-hidden="true"`.
3. Adding descriptive `aria-label`s to icon-only buttons.
4. Using `role="status"` and `aria-live` for toast notifications or other dynamic UI updates.
5. Ensuring visible focus states for keyboard users.
>>>>>>> REPLACE
