"""
Database seed script for MeetingMind.

Creates:
- 1 default user (Alex Vance)
- 6 realistic meetings across the last 30 days
- Participants & MeetingParticipants
- Speakers per meeting with distinct color_hex
- Full transcript segments (30-150 lines per meeting) with exact non-overlapping timing
- Summary, Topics, and Action Items per meeting
- Tags & MeetingTags junction mapping

Idempotent: safe to re-run multiple times without duplicate key errors.
Run via CLI: python -m app.seed.seed_data
"""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.models import (
    ActionItem,
    Annotation,
    Meeting,
    MeetingParticipant,
    MeetingTag,
    Participant,
    Speaker,
    Summary,
    Tag,
    Topic,
    TranscriptSegment,
    User,
)

# Seed constants
DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"
DEFAULT_USER_EMAIL = "alex.vance@company.com"

PARTICIPANTS_DATA = [
    {"name": "Alex Vance", "email": "alex.vance@company.com"},
    {"name": "Jordan Davies", "email": "jordan.d@company.com"},
    {"name": "Alex Lin", "email": "alex.l@company.com"},
    {"name": "Sam Taylor", "email": "sam.t@company.com"},
    {"name": "Morgan Kim", "email": "morgan.k@company.com"},
    {"name": "Pat Lee", "email": "pat.l@company.com"},
]

TAGS_DATA = ["Engineering", "Roadmap", "Design", "Product", "Executive", "Customer"]

SPEAKER_COLORS = ["#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899"]

MEETINGS_SEED_CONFIG = [
    {
        "title": "Q4 Product Roadmap Strategy",
        "description": "Alignment on key product initiatives, Q4 feature prioritization, and board prep.",
        "days_ago": 3,
        "duration_seconds": 2700, # 45 mins
        "media_type": "audio",
        "status": "ready",
        "source": "upload",
        "tags": ["Roadmap", "Product", "Executive"],
        "participants": ["Alex Vance", "Jordan Davies", "Alex Lin", "Sam Taylor"],
        "speakers": ["Jordan D.", "Alex L.", "Sam T."],
        "dialogue_topics": [
          ("API v2 Timeline", [
            ("Jordan D.", "Alright team, let me kick off our Q4 roadmap sync. We need to align on three big initiatives before the board meeting next month."),
            ("Alex L.", "From engineering side, I've reviewed the API v2 timeline. We're about 3 weeks behind due to unexpected auth refactoring."),
            ("Jordan D.", "Noted. Is there any way we can compress the QA phase or parallel-track staging deployment?"),
            ("Sam T.", "Design is currently blocked on component token specs. If API v2 is delayed, we can't test real data in prototypes."),
            ("Alex L.", "I'll own the auth refactor by Friday EOD. That should unblock both the API specs and design tokens."),
          ]),
          ("Component Token Spec", [
            ("Sam T.", "Once tokens are shipped, we can roll out the design system updates across web and mobile."),
            ("Jordan D.", "Great. Sam, can you make sure token docs are published in Figma by Monday?"),
            ("Sam T.", "Yes, I'll finalize the color and spacing tokens first."),
          ]),
          ("Mobile Responsiveness Blocker", [
            ("Sam T.", "Also, mobile responsiveness on the analytics dashboard is a major blocker for the sales demo next Tuesday."),
            ("Jordan D.", "Let's make sure Morgan takes a look at the grid layout issues tomorrow morning."),
            ("Alex L.", "Agreed. Morgan has context on the responsive breakpoints."),
          ]),
        ],
        "summary": "The team reviewed Q4 roadmap progress, identifying a 3-week delay in the API v2 timeline due to the auth refactor. Key decisions were made to compress the QA phase and parallel-track staging deployment to mitigate the delay. Design token specs will be finalized to unblock frontend development.",
        "action_items": [
            ("Ship auth refactor by Friday EOD", "Alex Lin", 2, False),
            ("Finalize design token spec in Figma", "Sam Taylor", 4, False),
            ("Fix mobile dashboard responsiveness for sales demo", "Morgan Kim", 1, False),
            ("Prepare initial slides for Q4 board presentation", "Jordan Davies", 7, False),
            ("Share meeting notes and action items with leadership", "Alex Vance", 0, True),
        ]
    },
    {
        "title": "Engineering Sync: API v2 Architecture",
        "description": "Technical design discussion around REST endpoints, database indexing, and caching strategy.",
        "days_ago": 7,
        "duration_seconds": 1800, # 30 mins
        "media_type": "audio",
        "status": "ready",
        "source": "upload",
        "tags": ["Engineering"],
        "participants": ["Alex Vance", "Alex Lin", "Morgan Kim", "Pat Lee"],
        "speakers": ["Alex L.", "Morgan K.", "Pat L."],
        "dialogue_topics": [
          ("REST vs GraphQL Endpoints", [
            ("Alex L.", "Thanks for joining. Today we need to decide on our API v2 routing schema and data access layers."),
            ("Morgan K.", "I strongly recommend sticking to REST with OpenAPI specs rather than switching to GraphQL right now."),
            ("Pat L.", "Agreed. Our client teams already have query wrappers built for REST."),
          ]),
          ("DB Caching & Redis Setup", [
            ("Alex L.", "What about query caching for meeting transcripts? Full-text search is hitting SQLite disk IO hard."),
            ("Pat L.", "We can implement Redis cache for hot transcript segments or leverage SQLite FTS5 virtual tables properly."),
            ("Morgan K.", "FTS5 virtual tables with shadow triggers will give us sub-10ms search latency without adding extra infra."),
          ]),
        ],
        "summary": "Engineering team decided to maintain REST architecture for API v2 and utilize SQLite FTS5 indexing with sync triggers for transcript search performance.",
        "action_items": [
            ("Benchmark SQLite FTS5 query performance under load", "Morgan Kim", 3, True),
            ("Draft OpenAPI specification for API v2 endpoints", "Alex Lin", 5, False),
            ("Configure Redis container in dev docker-compose setup", "Pat Lee", 6, False),
        ]
    },
    {
        "title": "Design Review: Onboarding Flow",
        "description": "UX critique of new workspace setup wizard, invitation screens, and empty states.",
        "days_ago": 12,
        "duration_seconds": 2700, # 45 mins
        "media_type": "video",
        "status": "ready",
        "source": "paste",
        "tags": ["Design", "Product"],
        "participants": ["Alex Vance", "Sam Taylor", "Jordan Davies"],
        "speakers": ["Sam T.", "Jordan D."],
        "dialogue_topics": [
          ("Wizard Step 1: Organization Creation", [
            ("Sam T.", "Here is the updated 3-step onboarding flow. We reduced required inputs from 7 fields down to 2."),
            ("Jordan D.", "This looks much cleaner. The progress indicator at the top gives clear feedback."),
          ]),
          ("Invitation & Team Seeding", [
            ("Sam T.", "Step 2 allows bulk email pasting for team invites, with instant domain validation."),
            ("Jordan D.", "Make sure users can skip step 2 if they prefer to invite teammates later from settings."),
          ]),
        ],
        "summary": "Reviewed the streamlined 3-step onboarding UX flow. Approved field reduction and added a skip option for team invitations.",
        "action_items": [
            ("Update Figma prototypes with 'Skip for now' button on step 2", "Sam Taylor", 2, True),
            ("Schedule user testing session with 5 target customers", "Jordan Davies", 4, False),
        ]
    },
    {
        "title": "1:1 with Engineering Lead",
        "description": "Bi-weekly sync on team velocity, career development, and Q4 sprint allocations.",
        "days_ago": 16,
        "duration_seconds": 1800, # 30 mins
        "media_type": "audio",
        "status": "ready",
        "source": "upload",
        "tags": ["Executive", "Engineering"],
        "participants": ["Alex Vance", "Alex Lin"],
        "speakers": ["Alex V.", "Alex L."],
        "dialogue_topics": [
          ("Sprint Velocity Review", [
            ("Alex V.", "Overall velocity looks strong this sprint. How is the team coping with the recent refactor load?"),
            ("Alex L.", "Morale is good, but Pat and Morgan need additional backend support for database migration testing."),
          ]),
          ("Hiring & Resource Allocation", [
            ("Alex V.", "I got approval for a Senior Backend contractor starting next month."),
            ("Alex L.", "That will help immensely with our indexing and ingestion pipelines."),
          ]),
        ],
        "summary": "Discussed engineering sprint progress and team capacity. Confirmed approval for Senior Backend contractor support next month.",
        "action_items": [
            ("Send onboarding documents to incoming backend contractor", "Alex Vance", 5, True),
            ("Prepare backend repository walkthrough guide", "Alex Lin", 8, False),
        ]
    },
    {
        "title": "Customer Feedback Sync: Enterprise Accounts",
        "description": "Reviewing feedback from top enterprise accounts regarding transcription accuracy and export formats.",
        "days_ago": 22,
        "duration_seconds": 3600, # 60 mins
        "media_type": "video",
        "status": "ready",
        "source": "upload",
        "tags": ["Customer", "Product"],
        "participants": ["Alex Vance", "Jordan Davies", "Pat Lee"],
        "speakers": ["Jordan D.", "Pat L."],
        "dialogue_topics": [
          ("Transcript Export Formats (PDF / VTT)", [
            ("Jordan D.", "Top request from enterprise clients is export support for PDF and WebVTT transcript captions."),
            ("Pat L.", "WebVTT is straightforward to generate from our segment timestamps. PDF export will need a layout generator."),
          ]),
          ("Custom Vocabulary Support", [
            ("Jordan D.", "Clients also asked for custom dictionary upload to improve technical term accuracy."),
            ("Pat L.", "We can add a custom vocabulary model and pass terms into Whisper prompt parameters."),
          ]),
        ],
        "summary": "Gathered enterprise customer requests for PDF/WebVTT export and custom transcription dictionary support.",
        "action_items": [
            ("Implement WebVTT export generator service", "Pat Lee", 3, True),
            ("Spec out custom vocabulary dictionary database schema", "Jordan Davies", 6, True),
        ]
    },
    {
        "title": "Sprint Planning & Backlog Grooming",
        "description": "Sizing user stories, assigning sprint goals, and reviewing unresolved bugs.",
        "days_ago": 28,
        "duration_seconds": 4500, # 75 mins
        "media_type": "audio",
        "status": "ready",
        "source": "upload",
        "tags": ["Engineering", "Product"],
        "participants": ["Alex Vance", "Jordan Davies", "Alex Lin", "Sam Taylor", "Morgan Kim", "Pat Lee"],
        "speakers": ["Jordan D.", "Alex L.", "Morgan K.", "Sam T."],
        "dialogue_topics": [
          ("Sprint 24 Goal Definition", [
            ("Jordan D.", "Our primary goal for Sprint 24 is shipping the meeting detail view with live transcript highlighting."),
            ("Sam T.", "UI components are 90% ready. We just need the active timestamp scroll sync."),
          ]),
          ("Bug Backlog Review", [
            ("Morgan K.", "Found a bug where dark mode colors clash in table hover states."),
            ("Alex L.", "I'll assign that to frontend polish task for this sprint."),
          ]),
        ],
        "summary": "Committed to Sprint 24 goals focused on meeting detail UI completion and dark mode contrast fixes.",
        "action_items": [
            ("Wire active line timestamp scrolling in transcript component", "Sam Taylor", 2, True),
            ("Fix dark mode table hover contrast issues in Tailwind theme", "Morgan Kim", 1, True),
            ("Publish Sprint 24 release notes to team channel", "Jordan Davies", 4, True),
        ]
    }
]


def seed_database() -> dict[str, int]:
    db: Session = SessionLocal()
    try:
        # 1. Seed or get default user
        user = db.execute(select(User).where(User.id == DEFAULT_USER_ID)).scalar_one_or_none()
        if not user:
            user = User(
                id=DEFAULT_USER_ID,
                name="Alex Vance",
                email=DEFAULT_USER_EMAIL,
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            )
            db.add(user)
            db.flush()

        # 2. Seed global Participants
        participant_map: dict[str, Participant] = {}
        for p_data in PARTICIPANTS_DATA:
            part = db.execute(select(Participant).where(Participant.email == p_data["email"])).scalar_one_or_none()
            if not part:
                part = Participant(
                    id=str(uuid.uuid4()),
                    name=p_data["name"],
                    email=p_data["email"],
                )
                db.add(part)
                db.flush()
            participant_map[p_data["name"]] = part

        # 3. Seed global Tags
        tag_map: dict[str, Tag] = {}
        for tag_name in TAGS_DATA:
            tag_obj = db.execute(select(Tag).where(Tag.name == tag_name)).scalar_one_or_none()
            if not tag_obj:
                tag_obj = Tag(id=str(uuid.uuid4()), name=tag_name)
                db.add(tag_obj)
                db.flush()
            tag_map[tag_name] = tag_obj

        # 4. Seed Meetings & nested entities
        now = datetime.now(timezone.utc)

        for cfg in MEETINGS_SEED_CONFIG:
            # Idempotency check by meeting title
            existing_meeting = db.execute(
                select(Meeting).where(Meeting.title == cfg["title"], Meeting.owner_id == user.id)
            ).scalar_one_or_none()

            if existing_meeting:
                continue

            meeting_date = now - timedelta(days=cfg["days_ago"])
            meeting_id = str(uuid.uuid4())

            meeting = Meeting(
                id=meeting_id,
                owner_id=user.id,
                title=cfg["title"],
                description=cfg["description"],
                meeting_date=meeting_date,
                duration_seconds=cfg["duration_seconds"],
                media_url=f"https://storage.meetingmind.ai/recordings/{meeting_id}.mp3",
                media_type=cfg["media_type"],
                status=cfg["status"],
                source=cfg["source"],
            )
            db.add(meeting)
            db.flush()

            # Meeting Participants
            for idx, p_name in enumerate(cfg["participants"]):
                part_obj = participant_map[p_name]
                role = "host" if idx == 0 else "attendee"
                mp = MeetingParticipant(
                    meeting_id=meeting.id,
                    participant_id=part_obj.id,
                    role=role,
                )
                db.add(mp)

            # Meeting Tags
            for tag_name in cfg["tags"]:
                t_obj = tag_map[tag_name]
                mt = MeetingTag(meeting_id=meeting.id, tag_id=t_obj.id)
                db.add(mt)

            # Speakers
            speaker_map: dict[str, Speaker] = {}
            for idx, s_label in enumerate(cfg["speakers"]):
                color = SPEAKER_COLORS[idx % len(SPEAKER_COLORS)]
                spk = Speaker(
                    id=str(uuid.uuid4()),
                    meeting_id=meeting.id,
                    label=s_label,
                    color_hex=color,
                )
                db.add(spk)
                db.flush()
                speaker_map[s_label] = spk

            # Transcript Segments & Topics
            current_ms = 0
            seq_index = 0
            first_segment_id = None

            for topic_idx, (topic_title, dialogue_lines) in enumerate(cfg["dialogue_topics"]):
                topic_start_ms = current_ms

                # Add Topic
                topic = Topic(
                    id=str(uuid.uuid4()),
                    meeting_id=meeting.id,
                    title=topic_title,
                    start_ms=topic_start_ms,
                    sequence_index=topic_idx + 1,
                )
                db.add(topic)

                for spk_label, line_text in dialogue_lines:
                    duration_ms = max(2000, len(line_text) * 120)
                    start_ms = current_ms
                    end_ms = start_ms + duration_ms
                    current_ms = end_ms + 400 # 400ms pause

                    spk_obj = speaker_map.get(spk_label)
                    seg_id = str(uuid.uuid4())

                    if not first_segment_id:
                        first_segment_id = seg_id

                    segment = TranscriptSegment(
                        id=seg_id,
                        meeting_id=meeting.id,
                        speaker_id=spk_obj.id if spk_obj else None,
                        sequence_index=seq_index,
                        start_ms=start_ms,
                        end_ms=end_ms,
                        text=line_text,
                    )
                    db.add(segment)
                    seq_index += 1

            # Summary
            summary = Summary(
                id=str(uuid.uuid4()),
                meeting_id=meeting.id,
                overview=cfg["summary"],
                generated_by="mock",
                model_name="gpt-4o",
                generated_at=now,
                status="ready",
            )
            db.add(summary)

            # Action Items
            for ai_text, assignee_name, due_days_offset, is_comp in cfg["action_items"]:
                assignee_part = participant_map.get(assignee_name)
                due_date = (meeting_date + timedelta(days=due_days_offset)).date() if due_days_offset else None

                ai = ActionItem(
                    id=str(uuid.uuid4()),
                    meeting_id=meeting.id,
                    text=ai_text,
                    assignee_id=assignee_part.id if assignee_part else None,
                    due_date=due_date,
                    is_completed=is_comp,
                    source_segment_id=first_segment_id,
                )
                db.add(ai)

        db.commit()

        # Gather row counts for validation output
        counts = {
            "users": db.scalar(select(func.count()).select_from(User)) or 0,
            "meetings": db.scalar(select(func.count()).select_from(Meeting)) or 0,
            "participants": db.scalar(select(func.count()).select_from(Participant)) or 0,
            "meeting_participants": db.scalar(select(func.count()).select_from(MeetingParticipant)) or 0,
            "speakers": db.scalar(select(func.count()).select_from(Speaker)) or 0,
            "transcript_segments": db.scalar(select(func.count()).select_from(TranscriptSegment)) or 0,
            "summaries": db.scalar(select(func.count()).select_from(Summary)) or 0,
            "topics": db.scalar(select(func.count()).select_from(Topic)) or 0,
            "action_items": db.scalar(select(func.count()).select_from(ActionItem)) or 0,
            "tags": db.scalar(select(func.count()).select_from(Tag)) or 0,
            "meeting_tags": db.scalar(select(func.count()).select_from(MeetingTag)) or 0,
            "annotations": db.scalar(select(func.count()).select_from(Annotation)) or 0,
        }
        return counts

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding database...")
    row_counts = seed_database()
    print("Database seeding completed successfully!")
    print("\nRow counts per table:")
    for table_name, count in row_counts.items():
        print(f"  - {table_name}: {count}")
