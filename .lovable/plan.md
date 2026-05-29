

# Create Large-Scale Demo Event with Seed Data

## Overview
Insert a fully populated demo event directly into the database with:
- 1 large event ("Global Tech Summit 2026")
- 12 speakers across various domains
- 30+ sessions across 4 parallel tracks with deliberate time overlaps (so attendees must choose)
- 3 meeting spots with 20 meeting slots spread throughout the day

## Event Details
- **Title**: Global Tech Summit 2026
- **Date**: March 15, 2026 (full day 9:00 AM - 6:00 PM)
- **Venue**: Dubai World Trade Centre
- **Status**: Published
- **Capacity**: 500

## Session Tracks (4 parallel tracks with overlapping times)
Each time slot will have 2-4 concurrent sessions so attendees must pick:

| Time | Track A (Main Stage) | Track B (Innovation Lab) | Track C (Workshop Room) | Track D (Networking Hall) |
|------|---------------------|-------------------------|------------------------|--------------------------|
| 9:00-9:45 | Opening Keynote | -- | -- | -- |
| 10:00-10:45 | AI in Enterprise | Cloud-Native Architecture | UX Design Workshop | Product Strategy |
| 11:00-11:45 | Future of LLMs | DevOps Best Practices | Data Viz Masterclass | Growth Hacking |
| 12:00-12:30 | Lunch Break Panel | -- | -- | -- |
| 13:00-13:45 | Cybersecurity Trends | API Design Patterns | Mobile Dev Workshop | Leadership Talk |
| 14:00-14:45 | Edge Computing | Serverless Deep Dive | Agile at Scale | Marketing Tech |
| 15:00-15:45 | Blockchain & Web3 | MLOps Pipeline | Design Systems | Investor Panel |
| 16:00-16:45 | Quantum Computing | Open Source Strategy | Testing Automation | Startup Pitch |
| 17:00-17:30 | Closing Keynote | -- | -- | -- |

Total: ~30 sessions with many conflicts for attendees to navigate.

## Speakers (12)
A diverse set of fictional speakers from tech companies.

## Meeting Spots and Slots (20 slots)
- 3 meeting spots: VIP Lounge, Networking Corner, Exhibitor Hall
- 20 meeting slots distributed from 10:00 AM to 5:00 PM in 30-minute intervals

## Technical Details

A single SQL migration will:
1. Insert the event
2. Insert 12 speakers
3. Insert ~30 sessions with track assignments and overlapping times
4. Link speakers to sessions via `session_speakers`
5. Insert 3 meeting spots
6. Insert 20 meeting slots across the spots

All done in one database migration using `WITH` CTEs to reference generated IDs.
