'use client'

import ChangePasswordForm from '@/components/settings/ChangePasswordForm'
import SetPasswordForm from '@/components/settings/SetPasswordForm'
import { useAppSelector } from '@/hooks/redux'
import {
  AdminThemeColor,
  AdminThemeConfig,
  getAdminThemeConfig,
  getThemeClasses,
  saveAdminThemeConfig,
} from '@/lib/admin/adminTheme'
import { appendAuditLog } from '@/lib/mockStore'
import { cn } from '@/utils/cn'
import { AlertTriangle, Check, Lock, Mail, Palette, Settings, Shield, Sparkles, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

type SubTab = 'branding' | 'security'

export default function AdminSettings() {
  const reduxUser = useAppSelector((state) => state.user.user)
  const hasPassword = reduxUser?.hasPassword !== false
  const [config, setConfig] = useState<AdminThemeConfig>(() => getAdminThemeConfig())
  const [isConfigSaved, setIsConfigSaved] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('branding')

  useEffect(() => {
    const handleThemeChange = () => setConfig(getAdminThemeConfig())
    window.addEventListener('admin_theme_change', handleThemeChange)
    return () => window.removeEventListener('admin_theme_change', handleThemeChange)
  }, [])

  const handleSaveConfig = (updatedConfig: AdminThemeConfig) => {
    saveAdminThemeConfig(updatedConfig)
    setConfig(updatedConfig)
    setIsConfigSaved(true)
    setTimeout(() => setIsConfigSaved(false), 2000)

    appendAuditLog({
      action: 'Admin settings updated',
      details: `Theme ${updatedConfig.accent}, quota ${updatedConfig.corporateCardQuota}, maintenance ${updatedConfig.maintenanceMode ? 'ON' : 'OFF'}`,
      type: 'settings',
      actor: 'Super Admin',
    })
  }

  const patch = (partial: Partial<AdminThemeConfig>) => handleSaveConfig({ ...config, ...partial })

  const themeClasses = getThemeClasses(config.accent)

  const colorsList: { name: string; value: AdminThemeColor; bg: string }[] = [
    { name: 'Royal Indigo', value: 'indigo', bg: 'bg-indigo-600' },
    { name: 'Aura Emerald', value: 'emerald', bg: 'bg-emerald-600' },
    { name: 'Sunset Amber', value: 'amber', bg: 'bg-amber-500' },
    { name: 'Classic Rose', value: 'rose', bg: 'bg-rose-500' },
    { name: 'Vibrant Violet', value: 'violet', bg: 'bg-violet-600' },
    { name: 'Ocean Sky', value: 'sky', bg: 'bg-sky-500' },
  ]

  const nav: { id: SubTab; label: string; icon: LucideIcon }[] = [
    { id: 'branding', label: 'Theme & Branding', icon: Palette },
    { id: 'security', label: 'Security & Access', icon: Lock },
  ]

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-8 p-6 duration-500 md:p-10">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center dark:border-white/5">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            <Settings className={cn('h-7 w-7', themeClasses.text)} /> Platform control board
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-400 md:text-sm">
            Branding and security controls for the admin portal.
          </p>
        </div>
        {config.maintenanceMode && (
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200/50 bg-amber-50 px-3 py-1.5 text-[11px] font-black text-amber-700 uppercase dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" /> Maintenance mode on
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="space-y-1.5 rounded-[28px] border border-slate-200/85 bg-white p-4 shadow-sm lg:col-span-3 dark:border-white/10 dark:bg-[#0b0f19]">
          <div className="px-3 py-2">
            <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Control sections
            </span>
          </div>
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSubTab(item.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-xs font-black tracking-wider uppercase transition-all',
                activeSubTab === item.id
                  ? cn(themeClasses.lightBg, themeClasses.lightText)
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex min-h-130 flex-col justify-between overflow-hidden rounded-4xl border border-slate-200/85 bg-white shadow-sm lg:col-span-9 dark:border-white/10 dark:bg-[#0b0f19]">
          <div className="space-y-6 p-6 sm:p-8">
            {activeSubTab === 'branding' && (
              <div className="animate-in fade-in space-y-6 duration-300">
                <div className="border-b border-slate-100 pb-4 dark:border-white/5">
                  <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                    <Sparkles className={cn('h-5 w-5', themeClasses.text)} /> Brand identity
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold text-slate-400">
                    Accent colors and labels shown across the admin portal.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Accent palette
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                    {colorsList.map((col) => {
                      const isSelected = config.accent === col.value
                      return (
                        <button
                          key={col.value}
                          type="button"
                          onClick={() => patch({ accent: col.value })}
                          className={cn(
                            'relative rounded-2xl border p-4 text-left transition-all',
                            isSelected
                              ? 'border-slate-800 bg-slate-50 dark:border-slate-200 dark:bg-slate-800/20'
                              : 'border-slate-150 hover:border-slate-300 dark:border-white/5'
                          )}
                        >
                          <span className={cn('block h-5 w-5 rounded-full shadow-md', col.bg)} />
                          <span className="mt-3 block text-xs font-black text-slate-800 dark:text-slate-100">
                            {col.name}
                          </span>
                          {isSelected && (
                            <div
                              className={cn(
                                'absolute top-3 right-3 flex h-4 w-4 items-center justify-center rounded-full text-white',
                                col.bg
                              )}
                            >
                              <Check className="h-2.5 w-2.5 stroke-[4px]" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">App title</label>
                    <input
                      type="text"
                      value={config.appName}
                      onChange={(e) => patch({ appName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Admin subtitle
                    </label>
                    <input
                      type="text"
                      value={config.subTitle}
                      onChange={(e) => patch({ subTitle: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'security' && (
              <div className="animate-in fade-in space-y-6 duration-300">
                <div className="border-b border-slate-100 pb-4 dark:border-white/5">
                  <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                    <Shield className={cn('h-5 w-5', themeClasses.text)} /> Security & access
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold text-slate-400">Update your admin account password.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Admin email
                    </label>
                    <div className="relative">
                      <Mail className="absolute top-3.5 left-4 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={reduxUser?.email ?? ''}
                        readOnly
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-4 pl-12 text-xs font-bold text-slate-500 outline-none dark:border-white/5 dark:bg-slate-800"
                      />
                    </div>
                  </div>
                  {hasPassword ? (
                    <ChangePasswordForm email={reduxUser?.email ?? null} />
                  ) : (
                    <SetPasswordForm email={reduxUser?.email ?? null} provider={reduxUser?.provider} />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-8 py-5 dark:border-white/5 dark:bg-[#090d16]">
            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              Changes save instantly
            </span>
            {isConfigSaved && (
              <span className="flex animate-pulse items-center gap-1 text-xs font-bold text-emerald-500">
                ✓ Config synchronized
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
