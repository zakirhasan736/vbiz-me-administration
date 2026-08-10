'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import { ModalPortal } from '@/components/ModalPortal'
import { useAppSelector } from '@/hooks/redux'
import {
  AdminPermissionKey,
  AdminStaffRoleName,
  GRANTABLE_PERMISSIONS,
  STAFF_ROLE_PRESETS,
  defaultsForStaffRole,
} from '@/lib/admin/adminPermissions'
import { notify } from '@/lib/toast/toast'
import {
  useCreateAdminTeamMemberMutation,
  useGetAdminTeamQuery,
  useRemoveAdminTeamMemberMutation,
  useSetAdminTeamStatusMutation,
  useUpdateAdminTeamMemberMutation,
  type AdminTeamMemberRow,
} from '@/redux/features/adminTeam/adminTeam.api'
import { cn } from '@/utils/cn'
import { Edit2, Lock, Search, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react'
import { useMemo, useState } from 'react'

type FormState = {
  name: string
  email: string
  password: string
  staffRole: AdminStaffRoleName
  allowedModules: AdminPermissionKey[]
}

const emptyForm = (): FormState => ({
  name: '',
  email: '',
  password: '',
  staffRole: 'Co-Administrator',
  allowedModules: defaultsForStaffRole('Co-Administrator'),
})

function errorMessage(err: unknown, fallback: string) {
  return (err as { data?: { message?: string } })?.data?.message || fallback
}

export default function AdminTeam() {
  const currentUserId = useAppSelector((s) => s.user.user?.id)
  const { data: team = [], isLoading, isError, refetch } = useGetAdminTeamQuery()
  const [createMember, { isLoading: creating }] = useCreateAdminTeamMemberMutation()
  const [updateMember, { isLoading: updating }] = useUpdateAdminTeamMemberMutation()
  const [setStatus] = useSetAdminTeamStatusMutation()
  const [removeMember] = useRemoveAdminTeamMemberMutation()

  const [searchQuery, setSearchQuery] = useState('')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<AdminTeamMemberRow | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)

  const superAdminCount = useMemo(
    () => team.filter((m) => m.role === 'super-admin' && !m.accountStatus.includes('SUSPENDED')).length,
    [team]
  )

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return team.filter(
      (t) =>
        (t.name || '').toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.staffRole || t.role).toLowerCase().includes(q)
    )
  }, [team, searchQuery])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setModalMode('create')
  }

  const openEdit = (member: AdminTeamMemberRow) => {
    if (member.role === 'super-admin') {
      notify.error('Super admin access cannot be edited here')
      return
    }
    setEditing(member)
    setForm({
      name: member.name || '',
      email: member.email,
      password: '',
      staffRole: (member.staffRole as AdminStaffRoleName) || 'Moderator',
      allowedModules: (member.allowedModules || []) as AdminPermissionKey[],
    })
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditing(null)
  }

  const toggleModule = (key: AdminPermissionKey) => {
    setForm((f) => ({
      ...f,
      allowedModules: f.allowedModules.includes(key)
        ? f.allowedModules.filter((m) => m !== key)
        : [...f.allowedModules, key],
    }))
  }

  const handleStaffRoleChange = (role: AdminStaffRoleName) => {
    setForm((f) => ({
      ...f,
      staffRole: role,
      allowedModules: defaultsForStaffRole(role),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.allowedModules.length === 0) {
      notify.error('Select at least one module')
      return
    }

    try {
      if (modalMode === 'create') {
        await createMember({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          staffRole: form.staffRole,
          allowedModules: form.allowedModules,
        }).unwrap()
        notify.success('Admin created')
      } else if (editing) {
        await updateMember({
          id: editing.id,
          body: {
            name: form.name.trim(),
            staffRole: form.staffRole,
            allowedModules: form.allowedModules,
          },
        }).unwrap()
        notify.success('Admin access updated')
      }
      closeModal()
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to save admin'))
    }
  }

  const handleToggleStatus = (member: AdminTeamMemberRow) => {
    if (member.id === currentUserId && member.isActive) {
      notify.error('Cannot deactivate your own account')
      return
    }
    if (member.role === 'super-admin' && member.isActive && superAdminCount <= 1) {
      notify.error('Cannot deactivate the last super admin')
      return
    }

    void (async () => {
      try {
        await setStatus({ id: member.id, isActive: !member.isActive }).unwrap()
        notify.success(member.isActive ? 'Admin deactivated' : 'Admin activated')
      } catch (err) {
        notify.error(errorMessage(err, 'Failed to update status'))
      }
    })()
  }

  const handleRemove = (member: AdminTeamMemberRow) => {
    if (member.id === currentUserId) {
      notify.error('Cannot remove your own account')
      return
    }
    if (member.role === 'super-admin' && superAdminCount <= 1) {
      notify.error('Cannot delete the last super admin')
      return
    }

    setConfirmState({
      open: true,
      title: 'Remove admin?',
      description: `Remove ${member.name || member.email} from the admin team? They will lose access immediately.`,
      onConfirm: () => {
        void (async () => {
          try {
            await removeMember(member.id).unwrap()
            notify.success('Admin removed')
          } catch (err) {
            notify.error(errorMessage(err, 'Failed to remove admin'))
          } finally {
            setConfirmState(null)
          }
        })()
      },
    })
  }

  return (
    <div className="animate-in fade-in mx-auto max-w-6xl space-y-8 p-6 duration-500 md:p-10">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center dark:border-white/5">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            <ShieldCheck className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Admin Team & Access
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-400 md:text-sm">
            Role-based module access for the admin area — assign permissions per teammate.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-black tracking-wider text-white uppercase shadow-sm transition hover:bg-indigo-700 active:scale-95"
        >
          <UserPlus className="h-4 w-4" /> Create Admin
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, or role…"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pr-4 pl-11 text-sm font-semibold outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
        />
      </div>

      {isLoading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-[#0b0f19]">
          Loading team…
        </div>
      )}

      {isError && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-500/20 dark:bg-rose-500/10">
          <p className="text-sm font-bold text-rose-600">Failed to load admin team.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {filtered.map((member) => {
            const isSuper = member.role === 'super-admin'
            const isLastSuper = isSuper && superAdminCount <= 1
            return (
              <div
                key={member.id}
                className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                      {member.name || 'Unnamed'}
                    </p>
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[10px] font-black tracking-wider uppercase',
                        isSuper
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                      )}
                    >
                      {isSuper ? 'Super Admin' : member.staffRole || 'Admin'}
                    </span>
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[10px] font-black tracking-wider uppercase',
                        member.isActive
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
                      )}
                    >
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-400">{member.email}</p>
                  {!isSuper && (
                    <p className="mt-2 text-[11px] font-semibold text-slate-400">
                      Access: {(member.allowedModules || []).join(', ') || 'none'}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!isSuper && (
                    <button
                      type="button"
                      onClick={() => openEdit(member)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-black tracking-wider text-slate-600 uppercase hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit access
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(member)}
                    disabled={isLastSuper && member.isActive}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-black tracking-wider text-slate-600 uppercase hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                  >
                    {member.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(member)}
                    disabled={isLastSuper || member.id === currentUserId}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] font-black tracking-wider text-rose-600 uppercase hover:bg-rose-100 disabled:opacity-40"
                    title={isLastSuper ? 'Last super admin cannot be deleted' : 'Remove admin'}
                  >
                    {isLastSuper ? <Lock className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Remove
                  </button>
                </div>
              </div>
            )
          })}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm font-semibold text-slate-400">No admins found.</div>
          )}
        </div>
      </div>

      {modalMode && (
        <ModalPortal>
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {modalMode === 'create' ? 'Create Admin' : 'Edit Admin Access'}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Choose a role preset and the sidebar routes this admin can access.
                  </p>
                </div>
                <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {modalMode === 'create' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Email</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Password</label>
                      <input
                        type="password"
                        required
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                      />
                      <p className="text-[10px] font-semibold text-slate-400">
                        Min 8 chars with uppercase, number, and special character.
                      </p>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Admin role</label>
                  <select
                    value={form.staffRole}
                    onChange={(e) => handleStaffRoleChange(e.target.value as AdminStaffRoleName)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  >
                    {STAFF_ROLE_PRESETS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Route access</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {GRANTABLE_PERMISSIONS.map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-white/5 dark:text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={form.allowedModules.includes(perm.key)}
                          onChange={() => toggleModule(perm.key)}
                          className="rounded border-slate-300"
                        />
                        {perm.label}
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400">
                    Packages, Admin Team, and System Audits stay super-admin only.
                  </p>
                </div>

                <div className="flex gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-xl bg-slate-100 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || updating}
                    className="flex-1 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase disabled:opacity-60"
                  >
                    {creating || updating ? 'Saving…' : modalMode === 'create' ? 'Create Admin' : 'Save access'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {confirmState?.open && (
        <ConfirmModal
          open
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel="Remove"
          variant="danger"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  )
}
