import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

interface Step {
  icon: string
  title: string
  desc: string
  tip?: string
  link?: { label: string; url: string }
}

const GUIDES: Record<string, { name: string; color: string; emoji: string; steps: Step[] }> = {
  facebook: {
    name: 'פייסבוק',
    color: '#1877F2',
    emoji: '📘',
    steps: [
      {
        icon: '🌐',
        title: 'כנס לדף הפרסום שלך',
        desc: 'הכנס לפייסבוק וודא שאתה מחובר לחשבון שמנהל את דף העסק שלך.',
      },
      {
        icon: '🔗',
        title: 'לחץ "התחבר לפייסבוק"',
        desc: 'לחץ על הכפתור הכחול. ייפתח חלון חדש עם עמוד ההרשאות של פייסבוק.',
      },
      {
        icon: '✅',
        title: 'אשר את ההרשאות',
        desc: 'לחץ "המשך" ואחר כך "שמור" כדי לאפשר ל-Smarketing לנהל מודעות בשמך.',
        tip: 'ודא שאתה מחובר לחשבון הנכון לפני האישור',
      },
      {
        icon: '🎉',
        title: 'הכל מוכן!',
        desc: 'חשבון הפרסום שלך מחובר. קמפיינים חדשים יעלו אוטומטית לפייסבוק.',
      },
    ],
  },
  instagram: {
    name: 'אינסטגרם',
    color: '#E4405F',
    emoji: '📸',
    steps: [
      {
        icon: '🏢',
        title: 'ודא שיש לך חשבון עסקי',
        desc: 'אינסטגרם מחייב חשבון Business או Creator. ניתן לשנות בהגדרות האפליקציה.',
        tip: 'הגדרות → חשבון → עבור לחשבון מקצועי',
      },
      {
        icon: '🔗',
        title: 'לחץ "התחבר לאינסטגרם"',
        desc: 'הכפתור פותח את דף ההרשאות של פייסבוק (אינסטגרם מנוהל דרך פייסבוק).',
      },
      {
        icon: '📲',
        title: 'בחר את חשבון האינסטגרם',
        desc: 'בחר את דף העסק בפייסבוק שמקושר לאינסטגרם שלך, ואשר את ההרשאות.',
      },
      {
        icon: '🎉',
        title: 'הכל מוכן!',
        desc: 'פוסטים ומודעות יפורסמו ישירות לאינסטגרם העסקי שלך.',
      },
    ],
  },
  google: {
    name: 'גוגל',
    color: '#4285F4',
    emoji: '🔍',
    steps: [
      {
        icon: '📧',
        title: 'היכנס עם חשבון גוגל',
        desc: 'ודא שאתה מחובר לחשבון הגוגל שמנהל את חשבון Google Ads שלך.',
      },
      {
        icon: '🔗',
        title: 'לחץ "התחבר לגוגל"',
        desc: 'ייפתח דף ההרשאות של גוגל. בחר את החשבון הרצוי.',
      },
      {
        icon: '✅',
        title: 'אשר גישה ל-Google Ads',
        desc: 'לחץ "אפשר" כדי לתת ל-Smarketing גישה לניהול קמפיינים בגוגל.',
        tip: 'נדרש חשבון Google Ads פעיל עם אמצעי תשלום',
        link: { label: 'פתח חשבון Google Ads', url: 'https://ads.google.com' },
      },
      {
        icon: '🎉',
        title: 'הכל מוכן!',
        desc: 'קמפיינים יועברו לגוגל אדס ויופעלו אוטומטית.',
      },
    ],
  },
  tiktok: {
    name: 'טיקטוק',
    color: '#010101',
    emoji: '🎵',
    steps: [
      {
        icon: '💼',
        title: 'ודא שיש לך TikTok Business',
        desc: 'נדרש חשבון TikTok for Business. ניתן להירשם בחינם.',
        link: { label: 'TikTok for Business', url: 'https://www.tiktok.com/business/en' },
      },
      {
        icon: '🔗',
        title: 'לחץ "התחבר לטיקטוק"',
        desc: 'ייפתח דף ההרשאות הרשמי של טיקטוק. היכנס עם פרטי חשבון הביזנס שלך.',
      },
      {
        icon: '✅',
        title: 'אשר הרשאות',
        desc: 'לחץ "Authorize" כדי לחבר את חשבון הפרסום שלך ל-Smarketing.',
        tip: 'ודא שאתה מאשר את חשבון ה-Ads Manager, לא חשבון אישי',
      },
      {
        icon: '🎉',
        title: 'הכל מוכן!',
        desc: 'קמפיינים ייצרו אוטומטית בטיקטוק Ads Manager שלך.',
      },
    ],
  },
}

interface Props {
  platform: string
  onClose: () => void
  onConnect: () => void
}

export default function PlatformGuideModal({ platform, onClose, onConnect }: Props) {
  const [step, setStep] = useState(0)
  const guide = GUIDES[platform]
  if (!guide) return null

  const currentStep = guide.steps[step]
  const isLast = step === guide.steps.length - 1
  const isFirst = step === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4" style={{ background: guide.color + '15' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                style={{ background: guide.color + '25' }}>
                {guide.emoji}
              </div>
              <div>
                <p className="font-bold text-gray-900">{guide.name}</p>
                <p className="text-xs text-gray-400">מדריך חיבור מהיר</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shadow-sm">
              <X size={15} />
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 justify-center">
            {guide.steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  background: i <= step ? guide.color : '#E5E7EB',
                }}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-5">
          <div className="text-center mb-5">
            <div className="text-5xl mb-4">{currentStep.icon}</div>
            <div className="w-6 h-6 rounded-full mx-auto mb-3 flex items-center justify-center text-xs font-bold text-white"
              style={{ background: guide.color }}>
              {step + 1}
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">{currentStep.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{currentStep.desc}</p>
          </div>

          {currentStep.tip && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 text-center mb-3">
              💡 {currentStep.tip}
            </div>
          )}

          {currentStep.link && (
            <a
              href={currentStep.link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs font-semibold mb-3"
              style={{ color: guide.color }}
            >
              <ExternalLink size={12} />
              {currentStep.link.label}
            </a>
          )}
        </div>

        {/* Footer navigation */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={isFirst}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>

          {isLast ? (
            <button
              onClick={() => { onClose(); onConnect() }}
              className="flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: guide.color }}
            >
              התחבר עכשיו ←
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: guide.color + '15', color: guide.color }}
            >
              הבא <span className="text-xs opacity-60">({step + 1}/{guide.steps.length})</span>
            </button>
          )}

          <button
            onClick={() => setStep(s => s + 1)}
            disabled={isLast}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
