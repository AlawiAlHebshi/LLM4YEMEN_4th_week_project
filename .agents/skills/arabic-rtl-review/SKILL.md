
---
name: arabic-rtl-review
description: Review Arabic RTL web interfaces for text direction, English LTR content, fonts, punctuation, responsive layouts, and mobile usability. Use when reviewing or testing the Opportunities Portal interface.
---

# Arabic RTL Review

Review the project's web interface using the following checklist.

## 1. Arabic Direction
- Verify that Arabic pages use `lang="ar"` and `dir="rtl"` on the root HTML element.
- Check the alignment and reading order of Arabic text.
- Verify that navigation, forms, and buttons display correctly in RTL.

## 2. English and Mixed Content
- Ensure English text and URLs display correctly in LTR.
- Check mixed Arabic-English sentences.
- Verify that numbers, dates, brackets, and punctuation appear in the correct order.
- Use appropriate direction isolation when needed.

## 3. Typography
- Verify that Arabic fonts are readable and consistent.
- Check font sizes, line spacing, and text wrapping.
- Ensure English text remains readable within Arabic layouts.

## 4. Responsive Design
- Test the interface at 360px width.
- Verify that no unwanted horizontal scrolling occurs.
- Check that buttons and form controls are usable on mobile.
- Verify layouts on tablet and desktop screen sizes.
- Check for overlapping or clipped content.

## 5. Review Results
- Report each detected issue with its location and explanation.
- Suggest a specific solution for each issue.
- Distinguish confirmed issues from potential issues.
- Do not modify files without explicit approval.
- If browser testing is unavailable, clearly report what could not be tested.
