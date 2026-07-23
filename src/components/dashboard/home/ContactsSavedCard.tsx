import { Save, Users } from 'lucide-react'

export function ContactsSavedCard() {
  return (
    <div className="from-primary-600 to-primary-800 group relative flex flex-1 flex-col justify-between overflow-hidden rounded-[32px] bg-linear-to-br p-8 text-white shadow-[0_20px_40px_-10px_rgba(var(--primary-600),0.3)] transition-transform duration-300 hover:-translate-y-1">
      <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/2 rounded-full bg-white/10 blur-3xl transition-transform duration-1000 ease-out group-hover:scale-125"></div>

      <div>
        <div className="relative z-10 mb-4 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/10 bg-white/20 shadow-sm backdrop-blur-md">
            <Save className="h-5 w-5 text-white" />
          </span>
          <h2 className="text-primary-100 pl-1 text-[13px] font-bold tracking-widest uppercase">Contacts Saved</h2>
        </div>
        <div className="relative z-10 mt-2 flex items-baseline gap-3">
          <span className="text-6xl font-black tracking-tighter sm:text-7xl">24</span>
        </div>
      </div>

      <div className="relative z-10 mt-8 rounded-[24px] border border-white/10 bg-black/20 p-5 shadow-inner backdrop-blur-md transition-colors group-hover:bg-black/30">
        <div className="mobile:flex-row flex flex-col gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-white/5 bg-white/10 shadow-sm">
            <Users className="text-primary-200 h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="mb-0.5 text-[15px] font-bold text-white">High Conversion</p>
            <p className="text-primary-200 text-[12px] leading-relaxed font-medium">
              Your profile is performing well! People are saving your contact details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
