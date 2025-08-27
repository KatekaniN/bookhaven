# Improved Onboarding Algorithm

## Current Issues:

1. Book scoring doesn't prioritize quality/ratings
2. Limited genre coverage (only 3 genres)
3. Static author lists
4. No diversity considerations
5. No balance between classic and contemporary works

## Proposed Improvements:

### Enhanced Book Selection Algorithm:

```typescript
interface BookScore {
  popularityScore: number; // edition_count × want_to_read_count
  qualityScore: number; // ratings_average × ratings_count
  recencyScore: number; // publication recency
  diversityScore: number; // author/geographic diversity
  finalScore: number;
}

const calculateBookScore = (book: OpenLibraryBook): BookScore => {
  // Popularity (30% weight)
  const popularityScore =
    Math.log((book.edition_count || 1) * (book.want_to_read_count || 1)) * 0.3;

  // Quality (40% weight)
  const qualityScore =
    (book.ratings_average || 3) * Math.log(book.ratings_count || 1) * 0.4;

  // Recency balance (20% weight)
  // Favor books from 1980-2020 range, with slight preference for newer
  const year = book.first_publish_year || 2000;
  const recencyScore =
    year >= 1980 && year <= 2020 ? ((year - 1980) / 40) * 0.2 : 0.1;

  // Diversity bonus (10% weight)
  // Could be enhanced with author nationality, gender, etc.
  const diversityScore = 0.1;

  return {
    popularityScore,
    qualityScore,
    recencyScore,
    diversityScore,
    finalScore: popularityScore + qualityScore + recencyScore + diversityScore,
  };
};
```

### Enhanced Author Selection:

```typescript
interface AuthorSelection {
  classics: string[]; // Pre-1980 influential authors
  contemporary: string[]; // Post-1980 popular authors
  diverse: string[]; // International/diverse voices
  emerging: string[]; // Recent breakout authors
}

const getBalancedAuthors = (genre: string): string[] => {
  const selection = authorsByGenre[genre];
  return [
    ...selection.classics.slice(0, 2),
    ...selection.contemporary.slice(0, 3),
    ...selection.diverse.slice(0, 2),
    ...selection.emerging.slice(0, 1),
  ];
};
```

### Multi-source Book Discovery:

1. **OpenLibrary API** (current)
2. **Goodreads lists** (if available)
3. **NYT Bestsellers API**
4. **Literary awards databases**
5. **Curated lists by librarians/critics**

### Improved Filtering:

```typescript
const advancedFiltering = {
  // Quality thresholds
  minRating: 3.5,
  minRatingCount: 100,

  // Diversity requirements
  maxBooksPerAuthor: 2,
  requireMultipleCountries: true,

  // Content appropriateness
  flagContentWarnings: true,

  // Availability
  preferInPrint: true,
  preferWithCovers: true,
};
```

### Balanced Representation:

- 30% classic/influential works
- 50% contemporary popular books
- 20% diverse voices/international
- Equal gender representation where possible
- Geographic diversity considerations

## Implementation Priority:

1. **Phase 1**: Improve scoring algorithm
2. **Phase 2**: Add curated backup lists
3. **Phase 3**: Implement author diversity
4. **Phase 4**: Add multiple data sources
5. **Phase 5**: Machine learning recommendations
