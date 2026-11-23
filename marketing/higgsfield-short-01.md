# Higgsfield short 01 — "then the conversation dies"

Format: 9:16 vertical, 10-12 s, motion graphics only. Audio will be added separately in Higgsfield.

## Dialogue for audio (record/generate in Higgsfield)

- Girl: "You're so funny."
- Boy: "Glad you said so."
- Beat: silence.

## Arabic-first on-screen captions

1. `قولتِ له: «أنت مضحك جدًا»`
2. `قال: «فرحان إنك قلتي كده»`
3. `وبعدين… صمت.`
4. `حكي بيساعدك تلاقي الكلمات.`
5. `haki-one-weld.vercel.app`

## Shot list / timing (11 s)

| Time | Visual |
|---|---|
| 0.0-0.8 | Warm cream-to-peach gradient background. Empty. Small centered Haki heart mark fades in. |
| 0.8-3.0 | First glass speech bubble enters from right, soft pop, text `أنت مضحك جدًا`. |
| 3.0-5.2 | Second glass bubble enters from left, text `فرحان إنك قلتي كده`. Bubbles gently float. |
| 5.2-7.4 | Both bubbles hold; one tiny pulse each, like a conversation waiting. |
| 7.4-9.0 | Bubbles slowly fade and dissolve. Three-dot typing indicator blinks twice, then fades. Background cools very slightly. Text `وبعدين… صمت.` appears. |
| 9.0-11.0 | Haki Community Heart logo centers, line `حكي بيساعدك تلاقي الكلمات.` and small URL. Hold. |

## Higgsfield prompt (paste into Video / Shorts Studio)

```
9:16 vertical motion-graphics short, 11 seconds, no people, no stock footage, no emojis.
Background: warm cream-to-peach-orange gradient with subtle soft glass glow, premium minimal
Islamic-inspired elegance. Arabic RTL typography, crisp and readable.

Timeline:
0-1s: tiny centered Haki heart mark fades in on empty warm gradient.
1-3s: a soft translucent glass speech bubble slides in from the right with Arabic text
"أنت مضحك جدًا", gentle pop and float.
3-5s: a second glass speech bubble slides in from the left with Arabic text
"فرحان إنك قلتي كده", both bubbles hover softly.
5-7s: both bubbles hold with a subtle pulse, like a pause in a chat.
7-9s: both bubbles slowly fade and dissolve into empty space; a small three-dot typing
indicator blinks twice then fades; Arabic line "وبعدين… صمت." appears.
9-11s: Haki Community Heart logo centers; Arabic line "حكي بيساعدك تلاقي الكلمات." and
small URL "haki-one-weld.vercel.app" fade in and hold.

Style: clean glassmorphism, cream #FFF6E9, peach #FDE0BD, orange #E8762A, dark brown
text #5B2F13. Smooth easing, 24fps, elegant, calm, premium. No audio in this render.
```

## How the website actually works (product truth)

- Entry: the root URL sends logged-in users to `/dashboard` and everyone else to `/login`.
  Sign-up and sign-in are email/password through Supabase Auth.
- Setup: the user sets a display name and a partner profile (name and interests). Those
  interests personalise the daily question and activity shown on the dashboard.
- Dashboard: a time-aware greeting, one daily connection question, one daily activity, the
  next few open to-dos, and the latest confirmed memories.
- Chat: a streaming AI conversation. It reads recent conversation history, suggests words
  when the user is stuck, and extracts memories from what the user says. Memories are stored
  and can be confirmed/edited later.
- Talk / Activities: libraries of conversation topics (light, medium, deep) and small shared
  activities, filtered by the partner's interests.
- Memory / To-do: a dedicated memory list and shared tasks with due dates.
- Languages: English LTR and Arabic RTL, switchable in settings, with full Arabic copy.
- Free limits (per local day, counted in `usage_events`): 20 chat messages, 10 suggestions,
  5 insights. Premium bypasses all caps.
- Premium: a one-time PayPal payment of $4.99 for one month, no auto-renewal. The server
  creates the order, verifies the amount, captures it, and only the service-role server path
  writes `subscription_plan` and `premium_until`. When the date passes, the account reads as
  free again.

### Customer-facing version (Arabic)

`بتسجّل دخولك، بتحكي لحكي عن شريكك، وبتسأله في الشات. هو بيقترح لك كلمات، وبيفتكر التفاصيل الصغيرة. كل يوم هتلاقي سؤال ونشاط، ومعاك ذكريات ومهام في مكان واحد. المجاني ٢٠ محادثة في اليوم، والبريميوم ٤٫٩٩ دولار لشهر كامل من غير تجديد.`

### One-line CTA for video

`حكي بيساعدك تلاقي الكلمات — جرّبه مجانًا.`

## Notes

- Keep all important text inside the central 80% safe area for Reels/TikTok.
- Use the supplied `haki-community-heart-logo-original.png` as the logo reference.
- Do not use emojis or clinical/therapy claims.
- Final export should be a silent MP4; audio will be layered in Higgsfield by the user.

## Free-plan status (verified)

The free Higgsfield account cannot render this brief:

- Cinema Studio 4.0 at 9:16 / 11 s / audio off costs **176 credits**; the free account had 10.
- Grok Imagine 1.5 Lite at 9:16 / 10 s costs 10 credits but is **paywalled** (Plus or higher).
- Cinema Studio 2.5 free render produced a 600 x 600, 5.04 s abstract clip at 8 credits — wrong
  format, wrong duration, no Arabic text; not usable.
- Genjutsu motion transfer accepted the reference video and image but then required a plan
  upgrade ("Upgrade Plan to buy credits"): it costs 28 credits, with only 2 left.

No payment or plan upgrade was made. This file is the ready-to-use brief for whenever a
rendering path with sufficient credits is available.
