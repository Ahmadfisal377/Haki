import type { Situation } from "@/lib/types";

/**
 * Static situation helper — "What do I say?".
 * Doubles as the offline fallback for the Smart Reply engine.
 */
export const SITUATIONS: Situation[] = [
  {
    id: "upset",
    label: { en: "They seem upset", ar: "شكله زعلان/ة" },
    lines: [
      { en: "I can see something's off. Do you want to talk, or should I just stay with you?", ar: "شايف إن في حاجة مش مظبوطة. تحب نتكلم ولا أقعد جنبك بس؟" },
      { en: "I'm not going anywhere. Tell me when you're ready.", ar: "أنا مش رايح فين. قولي لما تكون جاهز/ة." },
      { en: "You matter more to me than whatever this is about.", ar: "إنت أهم عندي من أي حاجة حصلت." },
    ],
    tip: { en: "Pick a calm moment, not mid-task. Listen first and hold off on fixing.", ar: "اختار وقت هادي مش وهو مشغول. اسمع الأول وماتسرعش بالحلول." },
  },
  {
    id: "quiet",
    label: { en: "They've gone quiet", ar: "بقى ساكت" },
    lines: [
      { en: "You've been quieter than usual. No pressure, I just want you to know I'm here.", ar: "لاحظت إنك هادي عن العادة. من غير ضغط، بس عايزك تعرف إني موجود." },
      { en: "Want company, or want to be left alone for a bit?", ar: "عايز حد جنبك ولا تفضل لوحدك شوية؟" },
      { en: "I'm here whenever you feel like talking, even if it's later.", ar: "أنا موجود في أي وقت تحب تتكلم، حتى لو بعدين." },
    ],
    tip: { en: "Offer a choice. Silence is not always a problem.", ar: "اديله اختيار. السكوت مش دايماً مشكلة." },
  },
  {
    id: "fight",
    label: { en: "After an argument", ar: "بعد خناقة" },
    lines: [
      { en: "I don't want us to stay upset. Can we try again from the part I got wrong?", ar: "مش عايزنا نفضل زعلانين. ينفع نعيد الكلام من الحتة اللي غلطت فيها؟" },
      { en: "I'd like to understand how it felt for you.", ar: "عايز أفهم إنت حسيت بإيه." },
      { en: "I'm sorry it got heated. I care about us more than about being right.", ar: "آسف إن الكلام سخن. أنا مهتم بينا أكتر من إني أكسب." },
    ],
    tip: { en: "Wait until you're both calm. Start with your own part.", ar: "استنوا لحد ما الاتنين يهدوا. ابدأ بدورك إنت في الموضوع." },
  },
  {
    id: "nothing",
    label: { en: "I have nothing to say", ar: "مش لاقي كلام" },
    lines: [
      { en: "Tell me the best and the worst part of your day.", ar: "احكيلي أحسن حاجة وأسوأ حاجة في يومك." },
      { en: "What's been on your mind lately that we haven't talked about?", ar: "إيه اللي في دماغك الفترة دي ومتكلمناش فيه؟" },
      { en: "What's one thing you're looking forward to this week?", ar: "إيه حاجة مستنيها الأسبوع ده؟" },
    ],
    tip: { en: "Open the Talk tab and read one question aloud.", ar: "افتح تبويب الحوار واقرأ سؤال بصوت عالي." },
  },
  {
    id: "thanks",
    label: { en: "I want to say thank you", ar: "عايز أشكره" },
    lines: [
      { en: "Thank you for what you did. It meant more to me than I said at the time.", ar: "شكراً على اللي عملته. كان معناه عندي أكتر من اللي قلته وقتها." },
      { en: "I noticed, and I appreciate it.", ar: "أنا واخد بالي وبقدّر ده." },
      { en: "You make things easier for me, and I don't say it enough.", ar: "إنت بتسهّل عليا حاجات كتير، ومش بقولها كفاية." },
    ],
    tip: { en: "Be specific about what they did. It lands better than a general thanks.", ar: "حدد عمل إيه بالظبط. ده بيوصل أكتر من شكر عام." },
  },
  {
    id: "disagree",
    label: { en: "We disagree", ar: "مش متفقين" },
    lines: [
      { en: "I see it differently, but I want to understand how you see it first.", ar: "أنا شايف الموضوع بشكل مختلف، بس عايز أفهم إنت شايفه إزاي الأول." },
      { en: "What matters most to you in this?", ar: "إيه أهم حاجة بالنسبة لك في الموضوع ده؟" },
      { en: "Let's find something that works for both of us.", ar: "تعالى نلاقي حل يناسبنا إحنا الاتنين." },
    ],
    tip: { en: "Repeat their point back before you answer it.", ar: "كرر كلامه قبل ما ترد عليه." },
  },
  {
    id: "flirt",
    label: { en: "I want to flirt", ar: "عايز أغازل" },
    lines: [
      { en: "I was thinking about you today and it made my whole afternoon better.", ar: "كنت بفكر فيك النهارده وده حسّن يومي كله." },
      { en: "Save tonight for me. I have plans.", ar: "سيب الليلة دي ليا. عندي خطة." },
      { en: "You looked great today. I couldn't stop smiling about it.", ar: "كنت حلو النهارده. ما قدرتش أبطل ابتسم." },
    ],
    tip: { en: "Keep it light and playful, and match their mood.", ar: "خليك خفيف ومرح، وراعي مزاجه." },
  },
];
