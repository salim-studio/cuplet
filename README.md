# ⚡ Cuplet — محرر فيديو React خفيف وسريع (بديل twick)

برنامج عملي متكامل: **Timeline + معاينة Canvas + ترجمة AI + تصدير فيديو** — في حزمة واحدة بدون تعقيد twick.

## لماذا Cuplet أسرع من twick؟

| twick | cuplet |
|---|---|
| مونوريبو ضخم (turbo + pnpm + عشرات الحزم) | حزمة واحدة Vite + React |
| fabric.js ثقيل للكانفس | Canvas2D مباشر + cache للوسائط |
| ffmpeg.wasm (~30MB تحميل) إجباري | تصدير MediaRecorder فوري، بدون تحميل wasm |
| تصدير المتصفح Chromium فقط (WebCodecs) | يعمل في **كل المتصفحات** (VP9/VP8/H264 تلقائي) |
| فلاتر WebGL مخصصة | فلاتر CSS مُسرّعة بالـGPU |
| ترجمة تتطلب Google Vertex | إملاء مجاني Web Speech + SRT/VTT + Whisper اختياري |

## التشغيل

```bash
cd cuplet
npm install
npm run dev      # → http://localhost:5199
npm run build    # بناء الإنتاج
npm run server   # سيرفر التصدير الاختياري (port 3099)
```

## المزايا

- 🎬 **Timeline**: سحب وإفلات بين المسارات، تقسيم ✂، تمديد، حذف، تراجع/إعادة (50 خطوة)
- 👁 **معاينة حية**: Canvas2D + rAF + مزامنة صوت، دبل كلك لتحرير النص
- 💬 **ترجمة AI**: توليد تلقائي من نص، استيراد/تصدير SRT/VTT، إملاء مباشر، Whisper endpoint
- ✨ **فلاتر GPU**: سينمائي، دافئ، بارد، فينتاج، زاهي...
- ⬇ **تصدير سريع**: WebM/MP4 حسب دعم المتصفح، حفظ/فتح مشروع JSON، مقاسات 9:16 / 16:9 / 1:1
- 🖥 **سيرفر اختياري**: `server/render-server.js` (Node بدون puppeteer)

## الاستخدام كـ SDK

```tsx
import { CupletStudio } from './src/components/Studio';
<CupletStudio />
```

انظر `examples/basic-usage.tsx`.

## هيكل المجلد

```
src/core/      types, timeline (move/trim/split), store (undo/redo)
src/captions/  engine (SRT/VTT/Whisper/WebSpeech)
src/render/    compositor (Canvas2D cache) + exporter (MediaRecorder)
src/effects/   filters (CSS GPU)
src/components/ Toolbar, Preview, Timeline, MediaPanel, CaptionPanel, Studio
server/        render-server.js
```

## الخطوات التالية المقترحة

- تثبيت `mp4-muxer` لتصدير MP4 دون اتصال، أو ربط السيرفر بـ ffmpeg حقيقي.
- إضافة مفاتيح Pexels/Unsplash في MediaPanel للأصول العامة (مثل twick).
