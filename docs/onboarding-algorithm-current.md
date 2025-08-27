# BookHaven Onboarding Algorithm - Current Implementation

## Overview

The onboarding system shows users books and authors to rate, helping us understand their reading preferences. Here's how we determine what to show:

## Book Selection Algorithm

### 1. **Data Source**: OpenLibrary API

- Uses `searchByGenre()` to find books by subject
- Fetches 20 books per genre (up from 15)
- Processes up to 5 genres (up from 3) from user's selected preferences

### 2. **Filtering Criteria**

Books must have:

- ✅ Title and author
- ✅ Cover image
- ✅ Published after 1950
- ✅ Title length 3-100 characters
- ✅ At least 10 ratings/reviews
- ❌ No volume/part indicators
- ❌ No metadata issues

### 3. **Enhanced Scoring Algorithm**

**Previous (Basic)**:

```typescript
score = (edition_count × want_to_read_count) + (recency × 0.1)
```

**New (Multi-factor)**:

```typescript
score = (popularity × 0.3) + (quality × 0.4) + (recency × 0.2) + (availability × 0.1)

where:
- popularity = log(edition_count × want_to_read_count) × 0.3
- quality = ratings_average × log(ratings_count) × 0.4
- recency = balanced score favoring 1980-2020 books × 0.2
- availability = (has_cover + has_reviews) × 0.1
```

### 4. **Selection Strategy**

- Top 10 books per genre (up from 8)
- Maximum 24 total books (up from 18)
- Remove duplicates
- Shuffle for variety
- Fallback curated lists for API failures

## Author Selection Algorithm

### 1. **Curated Lists by Category**

Each genre has 4 types of authors:

- **Classics** (2 selected): Pre-1980 influential authors
- **Contemporary** (3 selected): Modern popular authors
- **Diverse** (2 selected): International/underrepresented voices
- **Emerging** (1 selected): Recent breakout authors

### 2. **Selection Strategy**

- 8 authors per genre (2+3+2+1)
- Maximum 20 total authors (up from 15)
- Ensures representation across time periods and demographics
- Shuffle for variety

## Sample Algorithm Results

**For Fantasy Genre**:

- **Classics**: J.R.R. Tolkien, Ursula K. Le Guin
- **Contemporary**: Brandon Sanderson, Neil Gaiman, Terry Pratchett
- **Diverse**: N.K. Jemisin, Nnedi Okorafor, Liu Cixin
- **Emerging**: Rebecca Roanhorse, Silvia Moreno-Garcia

**For Books** (Fantasy example):

1. High-quality books like "The Way of Kings" (high ratings + edition count)
2. Popular classics like "The Hobbit" (balanced recency + popularity)
3. Award winners like "The Fifth Season" (quality + diversity)
4. Recent hits like "The Name of the Wind" (recency + popularity)

## Key Improvements Made

### ✅ **Better Quality Focus**

- 40% weight on ratings_average × ratings_count
- Filters for books with actual reviews
- Balanced approach to classic vs modern

### ✅ **Increased Diversity**

- Structured author selection by category
- International and underrepresented voices
- Gender and geographic balance considerations

### ✅ **More Comprehensive Coverage**

- 5 genres processed (vs 3)
- 24 books total (vs 18)
- 20 authors total (vs 15)
- Better filtering eliminates low-quality entries

### ✅ **Fallback Protection**

- Curated book lists for API failures
- Structured author data prevents gaps
- Error handling maintains user experience

## Algorithm Strengths

1. **Multi-dimensional scoring** considers quality, popularity, and recency
2. **Balanced representation** across time periods and demographics
3. **Scalable approach** can easily add new data sources
4. **Quality filters** eliminate metadata issues and low-quality entries
5. **Diversity focus** ensures varied perspectives in recommendations

## Potential Future Enhancements

1. **Machine Learning**: Train on user rating patterns
2. **Multiple APIs**: NYT Bestsellers, Goodreads, literary awards
3. **Real-time popularity**: Social media trends, current events
4. **User context**: Reading level, content preferences, age
5. **Geographic relevance**: Local bestsellers, cultural preferences

## Performance Considerations

- **API Rate Limits**: Limited to 5 genres to avoid timeouts
- **Response Size**: 20 books × 5 genres = 100 API book records
- **Processing Time**: ~3-5 seconds for full algorithm
- **Fallback Speed**: Instant with curated lists
- **Cache Strategy**: Could cache popular books by genre

This algorithm balances quality, diversity, and performance to give users a representative sample of books and authors for accurate preference profiling.
