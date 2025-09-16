# AI Prompts for Missing Category Icons

## Design Guidelines

- **Size**: 32x32px (to display well at h-8 w-8 in containers)
- **Style**: Magical realism, mystical library aesthetic
- **Colors**: Soft lavender/purple (#B7A3CA family), warm golden/amber (#FDEEA3 family), creamy tones (#F8E9CA family)
- **Format**: PNG with transparency
- **Theme**: Enchanted library, whimsical yet sophisticated

---

## 1. Real Stories (combined-print-and-e-book-nonfiction)

**Current**: GlobeAltIcon  
**Mood**: Authentic  
**Description**: True tales that inspire and inform

**AI Prompt:**

```
Design a magical globe icon with floating book pages swirling around it, representing authentic real-world stories. Style: mystical library aesthetic, globe showing continents made of book pages and text, soft purple (#B7A3CA) globe base with golden (#FDEEA3) landmasses, floating cream-colored (#F8E9CA) book pages with visible text lines, gentle glow effect, 32x32px, transparent background, represents "true stories from around the world."
```

---

## 2. Knowledge Base (paperback-nonfiction)

**Current**: BeakerIcon  
**Mood**: Educational  
**Description**: Essential insights for curious minds

**AI Prompt:**

```
Create a magical laboratory beaker/flask icon filled with swirling knowledge essence and tiny floating books. Style: enchanted library aesthetic, glass beaker with soft purple (#B7A3CA) liquid inside, golden (#FDEEA3) vapor rising with miniature books floating in it, cream-colored (#F8E9CA) base and accents, subtle sparkle effects, magical bubbles, 32x32px, transparent background, represents "distilled knowledge and learning."
```

---

## 3. Success Stories (business-books)

**Current**: TrophyIcon  
**Mood**: Ambitious  
**Description**: Strategies and insights for achievers

**AI Prompt:**

```
Design a magical trophy icon with books forming the trophy cup and success elements swirling around it. Style: mystical library theme, trophy cup made of stacked golden (#FDEEA3) books, soft purple (#B7A3CA) trophy base, cream-colored (#F8E9CA) handles, tiny floating dollar signs and graphs made of book pages, gentle victory glow, 32x32px, transparent background, represents "achievement and business success."
```

---

## 4. Wonder & Discovery (science)

**Current**: SparklesIcon  
**Mood**: Curious  
**Description**: Explore the mysteries of our universe

**AI Prompt:**

```
Create a magical sparkle/star constellation icon with books transforming into stars and cosmic elements. Style: enchanted library aesthetic, central bright star surrounded by smaller sparkles, books with pages turning into stardust, soft purple (#B7A3CA) cosmic background elements, golden (#FDEEA3) main stars, cream-colored (#F8E9CA) book pages floating and becoming constellations, mystical glow, 32x32px, transparent background, represents "scientific wonder and cosmic discovery."
```

---

## 5. Visual Stories (graphic-books-and-manga)

**Current**: PuzzlePieceIcon  
**Mood**: Creative  
**Description**: Art and narrative beautifully combined

**AI Prompt:**

```
Design a magical puzzle piece icon with comic book panels and artistic elements. Style: mystical library theme, puzzle piece with comic book speech bubbles and art panels inside, soft purple (#B7A3CA) puzzle piece border, golden (#FDEEA3) panel dividers, cream-colored (#F8E9CA) speech bubbles with tiny book symbols, artistic brush strokes and paint splashes, gentle creative glow, 32x32px, transparent background, represents "visual storytelling and graphic narratives."
```

---

## 6. Quick Escapes (mass-market-monthly)

**Current**: BoltIcon  
**Mood**: Fast-paced  
**Description**: Perfect reads for busy schedules

**AI Prompt:**

```
Create a magical lightning bolt icon with books and speed lines showing rapid reading. Style: enchanted library aesthetic, dynamic lightning bolt made of flowing book pages, soft purple (#B7A3CA) bolt outline, golden (#FDEEA3) energy crackling effects, cream-colored (#F8E9CA) book pages streaming behind like speed trails, magical energy particles, motion blur effects, 32x32px, transparent background, represents "quick reads and fast-paced stories."
```

---

## File Naming Convention

Save the generated icons as:

- `real-stories.png`
- `knowledge-base.png`
- `success-stories.png`
- `wonder-discovery.png`
- `visual-stories.png`
- `quick-escapes.png`

Place them in: `public/library/icons/`

---

## Implementation Notes

Once generated, update the CURATED_LISTS in `app/library/page.tsx`:

```typescript
// Replace React icons with image paths:
icon: "/library/icons/real-stories.png",        // instead of GlobeAltIcon
icon: "/library/icons/knowledge-base.png",      // instead of BeakerIcon
icon: "/library/icons/success-stories.png",     // instead of TrophyIcon
icon: "/library/icons/wonder-discovery.png",    // instead of SparklesIcon
icon: "/library/icons/visual-stories.png",      // instead of PuzzlePieceIcon
icon: "/library/icons/quick-escapes.png",       // instead of BoltIcon
```

This will complete the magical library icon set with all 12 categories having custom imagery that matches the enchanted BookHaven aesthetic.

---

## 7. Central Library Building Icon

**Current**: Classical library building icon in the header arch  
**Purpose**: Main library symbol for "The Grand Library" header  
**Size**: 64x64px (larger for prominent header display)

**AI Prompt:**

```
Design a magical grand library building icon with enchanted architectural elements and mystical details. Style: whimsical yet sophisticated library architecture, classical building with columns and steps, soft purple (#B7A3CA) stone facade with golden (#FDEEA3) architectural details and window light, cream-colored (#F8E9CA) columns and trim, floating books around the building, gentle magical glow emanating from windows, tiny sparkles and magical dust particles, ornate entrance doors, dome or spires with mystical elements, warm inviting atmosphere, 64x64px, transparent background, represents "The Grand Library" - a sanctuary of stories and knowledge.
```

**Alternative Prompt (More Detailed):**

```
Create an enchanted grand library building icon featuring a majestic classical architecture with magical BookHaven elements. Design: imposing library with Greek/Roman columns, wide welcoming steps, arched windows glowing with warm golden (#FDEEA3) light from within, soft lavender/purple (#B7A3CA) stone walls with weathered magical texture, cream-colored (#F8E9CA) marble columns and decorative details, floating books and scrolls circling the building, gentle sparkles falling like snow, ornate double doors with mystical symbols, rooftop with small towers or dome elements, magical lanterns or torches, ethereal mist around the base, warm and inviting atmosphere that says "sanctuary of stories," 64x64px, transparent background, style consistent with magical realism library theme.
```

**File Name**: `grand-library-building.png`  
**Location**: `public/library/icons/`
