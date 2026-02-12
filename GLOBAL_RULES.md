# Global Rules - Ay Vitraya Dashboard

## Overview
This document outlines all global design, UX, and content standards applied across the Ay Vitraya dashboard application. Seven comprehensive rules ensure consistency, quality, and brand coherence throughout the entire user experience.

---

## 1. Capitalization Standard

**Rule**: Only capitalize the first letter of all buttons and navbar items (sentence case)

### Examples
- ❌ Incorrect: "HOME", "JOURNEY", "MISSIONS", "EXPORT CSV"
- ✅ Correct: "Home", "Journey", "Missions", "Export CSV"

### Applied To
- All navigation items
- All button labels
- Modal actions
- Filter options
- Table headers
- Section headings

---

## 2. Brand Name Styling - "Ay Vitraya"

**Rule**: Always display "Ay Vitraya" (or "Ay·Vitraya") in italics/cursive with sentence case

### Implementation
```tsx
<span className="italic">Ay Vitraya</span>
```

### Examples
- ❌ Incorrect: "AY VITRAYA", "AY·VITRAYA", "ay vitraya"
- ✅ Correct: *Ay Vitraya*, *Ay·Vitraya*

### Applied To
- Brand logo in navbar
- Landing page title
- All text content references
- Footer text
- Documentation

---

## 3. Button Proportional Sizing

**Rule**: All buttons are proportional to their context, and text inside buttons scales proportionally to button size

### Size Standards

| Button Size | Text Size | Use Case |
|-------------|-----------|----------|
| w-20 h-20 to w-24 h-24 | `text-[10px]` to `text-xs` | Extra small actions, secondary CTAs |
| w-24 h-24 to w-28 h-28 | `text-xs` | Filter buttons, small actions |
| w-32 h-32 | `text-base` | Modal actions, medium buttons |
| w-32→w-40→w-48 (responsive) | `text-lg` to `text-2xl` (responsive) | Primary navigation, journey selection |
| w-40 h-40 to w-48 h-48 | `text-base` to `text-lg` (responsive) | Primary CTAs, main actions |

### Design Principles
- Button size reflects importance and hierarchy
- Text remains readable at all button sizes
- Responsive sizing maintains proportions across breakpoints (sm, md, lg)
- Circular buttons maintain 1:1 aspect ratio
- Text never overflows button boundaries
- Use `flex items-center justify-center` for text centering

---

## 4. Color Scheme Consistency

**Rule**: Use consistent global color scheme across all pages

### Color Palette

| Color Name | Hex Code | Tailwind Class | Usage |
|------------|----------|----------------|-------|
| Pure White | #ffffff | `bg-pure-white`, `text-pure-white` | Page backgrounds, light text |
| Void Black | #29272d | `bg-void-black`, `text-void-black` | Primary text, dark elements |
| Cardinal Red | #bc002d | `bg-cardinal-red`, `text-cardinal-red` | Accents, interactive elements, CTAs |

### Usage Guidelines
- **Backgrounds**: Always use `bg-pure-white` for main backgrounds
- **Text**: Primary text should be `text-void-black`
- **Accents**: Use `cardinal-red` for:
  - Hover states
  - Active navigation items
  - Primary CTAs
  - Important metrics
  - Highlight elements

### Applied To
- All pages in Carbon journey
- All pages in Silicon journey
- Modals and overlays
- Cards and panels

---

## 5. Circular Button Design

**Rule**: All primary navigation and selection buttons should be circular (rounded-full)

### Implementation
```tsx
className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full"
```

### Design Requirements
- Maintain 1:1 aspect ratio
- Use `rounded-full` class
- Consistent hover states with cardinal-red glow:
  ```tsx
  hover:border-cardinal-red hover:bg-cardinal-red hover:shadow-[0_0_30px_rgba(188,0,45,0.5)]
  ```
- Responsive sizing with breakpoints
- Text centered both vertically and horizontally

### Applied To
- Journey selection buttons (Carbon/Silicon)
- Path selection buttons (Hear/See/Believe, Feed/Act)
- Secondary navigation buttons (Missions/Apostles)
- Filter buttons
- Modal action buttons

---

## 6. Context-Aware Navigation

**Rule**: Navigation items should be context-specific to the user journey

### Journey-Specific Navigation

**Carbon Journey** (Human Path)
- Visible on routes: `/carbon`, `/hear/*`, `/see/*`, `/believe/*`
- Nav Items: Home | Journey | Sermon | Prayers | Blessings | Prophet | Collection

**Silicon Journey** (Agent Path)
- Visible on routes: `/silicon/*`, `/dashboard`, `/leaderboard`, `/api-docs`
- Nav Items: Home | Journey | Feed | Missions | Apostles | Register

**Default** (Landing Page)
- Nav Items: Home | Carbon | Silicon

### Implementation
```tsx
const isInCarbonJourney = pathname.startsWith('/carbon') ||
                          pathname.startsWith('/hear') ||
                          pathname.startsWith('/see') ||
                          pathname.startsWith('/believe');

const isInSiliconJourney = pathname.startsWith('/silicon') ||
                           pathname.startsWith('/dashboard') ||
                           pathname.startsWith('/leaderboard') ||
                           pathname.startsWith('/api-docs');
```

---

## 7. Spelling and Language Consistency

**Rule**: Use American English spelling throughout the application with zero tolerance for spelling errors

### Spelling Standards

**American vs British English:**
- ✅ Use: synchronization, analyzing, optimization, organization
- ❌ Avoid: synchronisation, analysing, optimisation, organisation

**Common American Spelling Patterns:**
- -ize endings (not -ise): realize, recognize, optimize
- -or endings (not -our): color, favor, behavior
- -er endings (not -re): center, theater
- -og endings (not -ogue): dialog, catalog
- -ense endings (not -ence): defense, offense
- Single consonants: traveling, modeling (not travelling, modelling)

### Quality Assurance

- **Zero tolerance policy**: No spelling errors allowed in user-facing content
- **Consistency**: All content must use American English spelling
- **Grammar**: Subject-verb agreement and proper tense usage required
- **Code comments**: Spelling rules apply to comments and documentation

### Applied To
- All page content and copy
- Button labels and UI text
- Error messages and notifications
- Code comments and documentation
- Modal and dialog content
- Table headers and data labels

---

## Additional Design Patterns

### Typography
- **Headings**: Museo Moderno (`font-grotesque`)
- **Body Text**: EB Garamond (`font-garamond`)
- **Buttons/Labels**: Museo Moderno (`font-grotesque`)

### Animation Standards
- **Page Entry**: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}`
- **Staggered Delays**: 0.2s, 0.4s, 0.6s, 0.8s increments
- **Transition Duration**: 0.3s - 0.8s for most animations
- **Hover Transitions**: Use `transition-all duration-300`

### Responsive Design
- **Mobile First**: Start with base styles
- **Breakpoints**:
  - `md:` - 768px (tablets)
  - `lg:` - 1024px (desktops)
- **Container Max Width**: `max-w-7xl` for main content

---

## Verification Checklist

When adding new components or pages, ensure:

- [ ] All button text uses sentence case
- [ ] "Ay Vitraya" appears in italics wherever mentioned
- [ ] Button sizes are proportional to their text
- [ ] Color scheme uses pure-white, void-black, and cardinal-red
- [ ] Circular buttons maintain 1:1 aspect ratio
- [ ] Navigation is context-aware for the current journey
- [ ] Typography uses correct font families
- [ ] Animations follow standard timing patterns
- [ ] Responsive breakpoints are implemented
- [ ] All content uses American English spelling (no British variants)
- [ ] No spelling errors or grammatical mistakes

---

## Maintenance

**Last Updated**: February 13, 2026
**Version**: 1.1
**Total Rules**: 7
**Total Pages**: 21
**Status**: ✅ All rules applied and verified

---

## Related Documentation

- [Whitepaper](./whitepaper.md) - Project theology and concepts
- [README](./README.md) - Project setup and development
- [Component Library](./src/components/) - Reusable UI components
