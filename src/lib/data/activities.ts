import type { Activity } from "@/lib/types";

/** Static activity catalog (from the Haki prototype). */
export const ACTIVITIES: Activity[] = [
  { id: "a1", cost: "free", energy: "calm", tags: ["growth"], text: { en: "Walk for 20 minutes with phones in pockets", ar: "نمشي ٢٠ دقيقة والموبايلات في الجيب" } },
  { id: "a2", cost: "low", energy: "calm", tags: ["food"], text: { en: "Cook a new recipe together", ar: "نطبخ وصفة جديدة سوا" } },
  { id: "a3", cost: "free", energy: "calm", tags: ["music"], text: { en: "Each pick 3 songs for a shared playlist and say why", ar: "كل واحد يختار ٣ أغاني لبلاي ليست مشتركة ويقول ليه" } },
  { id: "a4", cost: "free", energy: "calm", tags: ["growth"], text: { en: "Write 3 things you appreciate about each other, then swap", ar: "اكتبوا ٣ حاجات بتقدّروها في بعض وبدّلوا" } },
  { id: "a5", cost: "low", energy: "calm", tags: ["travel"], text: { en: "Watch the sunset by the water with tea", ar: "نشوف الغروب على الكورنيش مع شاي" } },
  { id: "a6", cost: "low", energy: "calm", tags: ["humor"], text: { en: "Play a card game at a café", ar: "نلعب كوتشينة أو لعبة في كافيه" } },
  { id: "a7", cost: "free", energy: "active", tags: ["fitness"], text: { en: "Work out or ride bikes together", ar: "نتمرن أو نركب عجل سوا" } },
  { id: "a8", cost: "mid", energy: "active", tags: ["travel"], text: { en: "Take a day trip somewhere new", ar: "رحلة يوم لمكان جديد" } },
  { id: "a9", cost: "low", energy: "calm", tags: ["movies"], text: { en: "Movie night where your partner chooses the film", ar: "ليلة فيلم وشريكك هو اللي يختار" } },
  { id: "a10", cost: "free", energy: "calm", tags: [], text: { en: "Ask each other 5 questions from the Talk tab over dinner", ar: "اسألوا بعض ٥ أسئلة من تبويب الحوار على العشا" } },
  { id: "a11", cost: "low", energy: "active", tags: ["food"], text: { en: "Try a new street food spot", ar: "نجرب مكان أكل شارع جديد" } },
  { id: "a12", cost: "free", energy: "calm", tags: ["family"], text: { en: "Look through old photos and tell the stories behind them", ar: "نتفرج على صور قديمة ونحكي القصص وراها" } },
  { id: "a13", cost: "mid", energy: "calm", tags: ["growth", "tech"], text: { en: "Sign up for a class together: pottery, painting or a language", ar: "نشترك في ورشة سوا: فخار أو رسم أو لغة" } },
  { id: "a14", cost: "low", energy: "active", tags: ["fashion"], text: { en: "Surprise each other with a small gift under an agreed budget", ar: "نفاجئ بعض بهدية صغيرة بميزانية متفقين عليها" } },
  { id: "a15", cost: "free", energy: "calm", tags: [], text: { en: "10-minute check-in: one win, one worry, one request each", ar: "١٠ دقايق مصارحة: إنجاز، قلق، وطلب من كل واحد" } },
  { id: "a16", cost: "low", energy: "calm", tags: ["growth"], text: { en: "Visit a bookstore and pick a book for each other", ar: "نزور مكتبة وكل واحد يختار كتاب للتاني" } },
];
