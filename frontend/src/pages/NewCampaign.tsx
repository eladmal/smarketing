import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { campaignsApi } from '../api'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'

const GOALS = [
  { value: 'awareness', label: 'מודעות', desc: 'הכר את המותג לקהל חדש' },
  { value: 'leads', label: 'לידים', desc: 'אנשים ישאירו פרטים ליצירת קשר' },
  { value: 'sales', label: 'מכירות', desc: 'מכירה ישירה של מוצר/שירות' },
  { value: 'traffic', label: 'תנועה לאתר', desc: 'הובל גולשים לאתר שלך' },
  { value: 'engagement', label: 'מעורבות', desc: 'לייקים, שיתופים, תגובות' },
]

const PLATFORMS = [
  { value: 'facebook', label: 'פייסבוק', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: 'instagram', label: 'אינסטגרם', color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { value: 'google', label: 'גוגל', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { value: 'tiktok', label: 'טיקטוק', color: 'bg-gray-900 border-gray-700 text-white' },
]

const STEPS = ['פרטי הקמפיין', 'מטרה ופלטפורמות', 'קהל יעד ושפה']

export default function NewCampaign() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    product_name: '',
    product_description: '',
    goal: '',
    platforms: ['facebook', 'instagram'],
    target_audience: '',
    budget: '',
    language: 'he',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const togglePlatform = (p: string) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p]
    }))
  }

  const canNext = () => {
    if (step === 0) return form.name && form.product_name && form.product_description
    if (step === 1) return form.goal && form.platforms.length > 0
    return form.target_audience
  }

  const submit = async () => {
    setLoading(true)
    try {
      const res = await campaignsApi.create(form)
      toast.success('קמפיין נוצר בהצלחה!')
      navigate(`/campaigns/${res.data.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'שגיאה ביצירת קמפיין')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">קמפיין חדש</h1>
        <p className="text-gray-500 mt-1">AI יכין לך קופי, קהלים וגרפיקה</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
              i < step ? 'bg-green-500 text-white' :
              i === step ? 'bg-brand-600 text-white' :
              'bg-gray-100 text-gray-400'
            }`}>
              {i < step ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-green-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="card p-6">
        {/* Step 0 */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="font-bold text-gray-900 text-lg">פרטי הקמפיין</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">שם הקמפיין</label>
              <input type="text" value={form.name} onChange={set('name')} className="input" placeholder='קמפיין קיץ 2025' />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">שם המוצר / שירות</label>
              <input type="text" value={form.product_name} onChange={set('product_name')} className="input" placeholder='קורס מדיה חברתית' />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">תיאור המוצר / שירות</label>
              <textarea
                value={form.product_description}
                onChange={set('product_description')}
                className="input min-h-[100px] resize-y"
                placeholder='תאר את המוצר, הייחודיות שלו, ולמה כדאי לקנות אותו...'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">תקציב משוער (אופציונלי)</label>
              <input type="text" value={form.budget} onChange={set('budget')} className="input" placeholder='₪500 לחודש' />
            </div>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-bold text-gray-900 text-lg">מטרה ופלטפורמות</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">מה מטרת הקמפיין?</label>
              <div className="grid grid-cols-1 gap-2">
                {GOALS.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, goal: g.value }))}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-right transition-all ${
                      form.goal === g.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                      form.goal === g.value ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
                    }`}>
                      {form.goal === g.value && <div className="w-full h-full rounded-full bg-white scale-50" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{g.label}</p>
                      <p className="text-xs text-gray-400">{g.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">פלטפורמות</label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePlatform(p.value)}
                    className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                      form.platforms.includes(p.value)
                        ? p.color + ' border-current'
                        : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    {p.label}
                    {form.platforms.includes(p.value) && ' ✓'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-bold text-gray-900 text-lg">קהל יעד ושפה</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">תאר את קהל היעד</label>
              <textarea
                value={form.target_audience}
                onChange={set('target_audience')}
                className="input min-h-[100px] resize-y"
                placeholder='לדוגמה: נשים בגילאי 25-45, עסקות בתחום האופנה, גרות בישראל, מתעניינות בקורסים דיגיטליים...'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">שפת הקופי</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'he', label: 'עברית' },
                  { value: 'en', label: 'אנגלית' },
                  { value: 'both', label: 'שתיהן' },
                ].map(l => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, language: l.value }))}
                    className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                      form.language === l.value
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
          <button
            type="button"
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/dashboard')}
            className="btn-secondary flex items-center gap-2"
          >
            <ChevronRight size={16} /> {step === 0 ? 'ביטול' : 'חזרה'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="btn-primary flex items-center gap-2"
            >
              הבא <ChevronLeft size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!canNext() || loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? 'יוצר...' : 'צור קמפיין'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
