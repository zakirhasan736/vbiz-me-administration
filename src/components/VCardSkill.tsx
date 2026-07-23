'use client'

import { Plus, Star, Trash2, X } from 'lucide-react'
import React, { useState } from 'react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-sm'

export function TabSkill() {
  const [skillGroups, setSkillGroups] = useState([
    {
      id: 1,
      type: '',
      skills: [] as string[],
      inputValue: '',
    },
  ])

  const addSkillGroup = () => {
    setSkillGroups([
      ...skillGroups,
      {
        id: Date.now(),
        type: '',
        skills: [],
        inputValue: '',
      },
    ])
  }

  const removeSkillGroup = (id: number) => {
    setSkillGroups(skillGroups.filter((grp) => grp.id !== id))
  }

  const updateSkillGroupType = (id: number, type: string) => {
    setSkillGroups(skillGroups.map((grp) => (grp.id === id ? { ...grp, type } : grp)))
  }

  const handleKeyDown = (id: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const grp = skillGroups.find((g) => g.id === id)
      if (grp && grp.inputValue.trim() !== '') {
        addSkillToGroup(id, grp.inputValue.trim())
      }
    }
  }

  const updateInputValue = (id: number, value: string) => {
    setSkillGroups(skillGroups.map((grp) => (grp.id === id ? { ...grp, inputValue: value } : grp)))
  }

  const addSkillToGroup = (id: number, skillName: string) => {
    setSkillGroups(
      skillGroups.map((grp) => {
        if (grp.id === id) {
          if (!grp.skills.includes(skillName)) {
            return { ...grp, skills: [...grp.skills, skillName], inputValue: '' }
          }
          return { ...grp, inputValue: '' }
        }
        return grp
      })
    )
  }

  const removeSkillFromGroup = (groupId: number, skillName: string) => {
    setSkillGroups(
      skillGroups.map((grp) => {
        if (grp.id === groupId) {
          return { ...grp, skills: grp.skills.filter((s) => s !== skillName) }
        }
        return grp
      })
    )
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col pb-12 duration-500">
      <div className="mb-8 rounded-[24px] border border-purple-100 bg-purple-50/50 p-6 dark:border-purple-500/10 dark:bg-purple-500/2">
        <div className="mb-2 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-purple-100 bg-purple-50 dark:border-purple-500/20 dark:bg-purple-500/10">
            <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-black text-purple-600 dark:text-purple-400">Skills</h3>
        </div>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Highlight your top skills and expertise.
        </p>
      </div>

      <div className="space-y-8">
        {skillGroups.map((group, index) => (
          <section
            key={group.id}
            className="group/card overflow-hidden rounded-[32px] border border-slate-200/50 bg-slate-50/50 shadow-sm transition-all hover:border-slate-200/80 hover:bg-slate-50 dark:border-white/5 dark:bg-white/2"
          >
            <div className="flex items-center justify-between border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-purple-100 bg-purple-50 font-black text-purple-600 shadow-sm dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400">
                  {index + 1}
                </div>
                <h4 className="text-[16px] font-black text-slate-900 dark:text-white">
                  {group.type || 'New Skill Category'}
                </h4>
              </div>
              {skillGroups.length > 1 && (
                <button
                  onClick={() => removeSkillGroup(group.id)}
                  className="flex items-center gap-2 rounded-[12px] bg-red-50 px-4 py-2.5 font-bold text-red-500 opacity-0 transition-all group-hover/card:opacity-100 hover:bg-red-100 hover:text-red-600 focus:opacity-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                  title="Remove Entry"
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              )}
            </div>

            <div className="space-y-8 p-4 sm:p-8">
              <div className="group flex flex-col space-y-1.5">
                <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                  Skill Category
                </label>
                <input
                  type="text"
                  value={group.type}
                  onChange={(e) => updateSkillGroupType(group.id, e.target.value)}
                  placeholder="e.g. Frontend Development"
                  className={inputClasses}
                />
              </div>

              <div className="group flex flex-col space-y-1.5">
                <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                  Skills
                </label>
                <div className="flex min-h-[60px] w-full flex-col gap-3 rounded-[16px] border border-slate-200/80 bg-white px-5 py-4 shadow-sm transition-all focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 dark:border-white/10 dark:bg-[#0b0f19]">
                  {group.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2.5">
                      {group.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="flex items-center gap-2 rounded-[12px] border border-purple-100 bg-purple-50/50 px-4 py-2 text-[13px] font-bold text-purple-600 shadow-sm dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400"
                        >
                          {skill}
                          <button
                            onClick={() => removeSkillFromGroup(group.id, skill)}
                            className="ml-1 rounded-md p-0.5 transition-colors hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-500/20 dark:hover:text-purple-300"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    value={group.inputValue}
                    onChange={(e) => updateInputValue(group.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(group.id, e)}
                    placeholder="Type a skill and press Enter..."
                    className="mt-1 w-full bg-transparent py-1 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                  />
                </div>
              </div>
            </div>
          </section>
        ))}

        <div className="mt-8 flex flex-col items-center justify-between gap-4 pt-6 sm:flex-row">
          <button
            onClick={addSkillGroup}
            className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-black/5 bg-white px-6 py-4 text-[13px] font-bold text-purple-600 shadow-sm transition-all hover:border-purple-500/30 hover:bg-slate-200 active:scale-95 sm:w-auto dark:border-white/5 dark:bg-[#0b0f19] dark:text-purple-400"
          >
            <Plus className="h-4 w-4" /> Add New Skill Category
          </button>
        </div>
      </div>
    </div>
  )
}
