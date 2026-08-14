'use client'

import { AdminUserListSkeleton } from '@/components/admin/AdminUserListSkeleton'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ModalPortal } from '@/components/ModalPortal'
import { StatNumber } from '@/components/ui/StatNumber'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { notify } from '@/lib/toast/toast'
import {
  useCreateAdminUserMutation,
  useDeleteAdminUserMutation,
  useGetAdminUserStatsQuery,
  useGetAdminUsersQuery,
  useSetAdminUserStatusMutation,
  useUpdateAdminUserMutation,
  type AdminUserAccountStatus,
  type AdminUserRow,
} from '@/redux/features/adminUsers/adminUsers.api'
import {
  appendUsers,
  replaceUsers,
  resetFilters,
  resetListToStart as resetListToStartAction,
  setDebouncedQ,
  setRoleFilter,
  setSearchQuery,
  setSkip,
  setStatusFilter,
  setTotal,
} from '@/redux/features/adminUsers/adminUsersList.slice'
import { cn } from '@/utils/cn'
import {
  Activity,
  Ban,
  Briefcase,
  Building,
  Edit2,
  Pause,
  Play,
  Search,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'

const PAGE_SIZE = 8

type OwnerRole = 'vcard-owner' | 'corporate-owner'

function roleLabel(role: string) {
  if (role === 'corporate-owner') return 'Corporate Card Owner'
  if (role === 'super-admin') return 'Super Admin'
  if (role === 'admin') return 'Admin'
  return 'Single Card Owner'
}

function isCorporateRole(role: string) {
  return role === 'corporate-owner'
}

function statusBadgeLabel(status: AdminUserAccountStatus) {
  if (status === 'SUSPENDED') return 'Suspended'
  if (status === 'PAUSED') return 'Paused'
  return 'Active'
}

function formatJoined(iso: string) {
  try {
    return new Date(iso).toISOString().split('T')[0]
  } catch {
    return iso
  }
}

function rtkErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { message?: string } }).data
    if (data?.message) return data.message
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export default function AdminUsers() {
  const dispatch = useAppDispatch()
  const searchQuery = useAppSelector((s) => s.adminUsersList.searchQuery)
  const debouncedQ = useAppSelector((s) => s.adminUsersList.debouncedQ)
  const roleFilter = useAppSelector((s) => s.adminUsersList.roleFilter)
  const statusFilter = useAppSelector((s) => s.adminUsersList.statusFilter)
  const skip = useAppSelector((s) => s.adminUsersList.skip)
  const users = useAppSelector((s) => s.adminUsersList.users)
  const total = useAppSelector((s) => s.adminUsersList.total)

  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null)
  const [editPassword, setEditPassword] = useState('')
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('')
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newRole, setNewRole] = useState<OwnerRole>('corporate-owner')

  const filterKey = `${debouncedQ}|${roleFilter}|${statusFilter}`
  const prevFilterKeyRef = useRef(filterKey)

  useEffect(() => {
    const t = window.setTimeout(() => dispatch(setDebouncedQ(searchQuery.trim())), 300)
    return () => window.clearTimeout(t)
  }, [dispatch, searchQuery])

  useEffect(() => {
    if (prevFilterKeyRef.current === filterKey) return
    prevFilterKeyRef.current = filterKey
    dispatch(resetListToStartAction())
  }, [dispatch, filterKey])

  const listQuery = useMemo(
    () => ({
      q: debouncedQ || undefined,
      role: roleFilter !== 'All' ? roleFilter : undefined,
      accountStatus: statusFilter !== 'All' ? statusFilter : undefined,
      skip,
      limit: PAGE_SIZE,
    }),
    [debouncedQ, roleFilter, statusFilter, skip]
  )

  const {
    data: listData,
    isLoading: isListLoading,
    isFetching: isListFetching,
    isError: isListError,
    refetch: refetchList,
  } = useGetAdminUsersQuery(listQuery)

  const { data: statsData, isLoading: isStatsLoading } = useGetAdminUserStatsQuery()

  const [createUser, { isLoading: isCreating }] = useCreateAdminUserMutation()
  const [updateUser, { isLoading: isUpdating }] = useUpdateAdminUserMutation()
  const [setUserStatus, { isLoading: isSettingStatus }] = useSetAdminUserStatusMutation()
  const [deleteUser, { isLoading: isDeleting }] = useDeleteAdminUserMutation()

  useEffect(() => {
    if (!listData) return
    dispatch(setTotal(listData.total))
    if (listData.skip === 0) {
      dispatch(replaceUsers(listData.items))
      return
    }
    if (listData.skip !== skip) return
    dispatch(appendUsers(listData.items))
  }, [dispatch, listData, skip])

  const hasMore = users.length < total
  const isLoadingMore = isListFetching && skip > 0
  const showListSkeletons = isListLoading && users.length === 0
  const isFilterRefetching = isListFetching && !isListLoading && skip === 0 && users.length === 0

  const resetListToStart = () => {
    if (skip === 0) return
    dispatch(resetListToStartAction())
  }

  const handleShowMore = () => {
    if (!hasMore || isListFetching) return
    dispatch(setSkip(users.length))
  }

  const handleSetStatus = async (id: string, accountStatus: AdminUserAccountStatus, name?: string | null) => {
    try {
      await setUserStatus({ id, body: { accountStatus } }).unwrap()
      const label = accountStatus === 'ACTIVE' ? 'activated' : accountStatus === 'PAUSED' ? 'paused' : 'suspended'
      const cardNote =
        accountStatus === 'PAUSED'
          ? ' All owned vCards were moved to draft.'
          : accountStatus === 'SUSPENDED'
            ? ' All owned vCards were disabled.'
            : ' Owned vCards were restored to their previous state.'
      notify.success(`Account for ${name || 'user'} has been ${label}.${cardNote}`)
      resetListToStart()
    } catch (err) {
      notify.error(rtkErrorMessage(err, 'Failed to update account status.'))
    }
  }

  const handleDeleteUser = (user: AdminUserRow) => {
    setConfirmState({
      open: true,
      title: 'Delete user permanently?',
      description: `Are you absolutely sure you want to permanently delete user account ${user.name || user.email}? All linked vCard profiles will be wiped.`,
      onConfirm: () => {
        void (async () => {
          try {
            await deleteUser(user.id).unwrap()
            if (editingUser?.id === user.id) setEditingUser(null)
            notify.success(`Deleted ${user.name || user.email}.`)
            resetListToStart()
          } catch (err) {
            notify.error(rtkErrorMessage(err, 'Failed to delete user.'))
          } finally {
            setConfirmState(null)
          }
        })()
      },
    })
  }

  const resetCreateForm = () => {
    setNewName('')
    setNewEmail('')
    setNewPassword('')
    setNewPasswordConfirm('')
    setNewCompany('')
    setNewRole('corporate-owner')
  }

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim() || !newPassword) return
    if (newPassword !== newPasswordConfirm) {
      notify.error('Passwords do not match.')
      return
    }

    try {
      await createUser({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
        companyName: newCompany.trim() || null,
      }).unwrap()
      setIsAddUserOpen(false)
      resetCreateForm()
      notify.success('User account provisioned.')
      resetListToStart()
    } catch (err) {
      notify.error(rtkErrorMessage(err, 'Failed to create user.'))
    }
  }

  const closeEditModal = () => {
    setEditingUser(null)
    setEditPassword('')
    setEditPasswordConfirm('')
  }

  const openEditModal = (user: AdminUserRow) => {
    setEditingUser({ ...user })
    setEditPassword('')
    setEditPasswordConfirm('')
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    if (editingUser.role === 'admin' || editingUser.role === 'super-admin') {
      notify.error('Admin accounts cannot be reconfigured here.')
      return
    }

    if (editPassword || editPasswordConfirm) {
      if (!editPassword) {
        notify.error('Enter a new password to reset it.')
        return
      }
      if (editPassword !== editPasswordConfirm) {
        notify.error('Passwords do not match.')
        return
      }
    }

    try {
      await updateUser({
        id: editingUser.id,
        body: {
          name: editingUser.name?.trim() || undefined,
          email: editingUser.email.trim(),
          role: editingUser.role as OwnerRole,
          companyName: editingUser.companyName?.trim() || null,
          ...(editPassword ? { password: editPassword } : {}),
        },
      }).unwrap()
      closeEditModal()
      notify.success(editPassword ? 'User updated and password reset.' : 'User updated.')
      resetListToStart()
    } catch (err) {
      notify.error(rtkErrorMessage(err, 'Failed to update user.'))
    }
  }

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-6 p-6 duration-500 md:p-10">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center dark:border-white/5">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            <Users className="h-7 w-7 text-indigo-600 dark:text-indigo-400" /> Users & Account Directory
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-400 md:text-sm">
            Displaying registered Single Card Owners, Corporate Accounts, and administrative staff members.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddUserOpen(true)}
          className="flex items-center gap-2 self-start rounded-2xl bg-indigo-600 px-6 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm shadow-indigo-600/10 transition-all hover:bg-indigo-700 active:scale-[0.98] md:self-auto"
        >
          <UserPlus className="h-4 w-4" /> Provision User Account
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f19]">
          <div>
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Total Users</span>
            <span className="mt-1 flex items-baseline gap-1.5 text-2xl font-black text-slate-950 dark:text-white">
              <StatNumber
                value={statsData?.total}
                loading={isStatsLoading}
                skeletonClassName="h-8 w-16"
                className="text-2xl font-black text-slate-950 dark:text-white"
              />
              {!isStatsLoading && <span>Accounts</span>}
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f19]">
          <div>
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Single Owners</span>
            <span className="mt-1 flex items-baseline gap-1.5 text-2xl font-black text-slate-950 dark:text-white">
              <StatNumber
                value={statsData?.singleOwners}
                loading={isStatsLoading}
                skeletonClassName="h-8 w-16"
                className="text-2xl font-black text-slate-950 dark:text-white"
              />
              {!isStatsLoading && <span>Accounts</span>}
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
            <User className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f19]">
          <div>
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Corporate Owners</span>
            <span className="mt-1 flex items-baseline gap-1.5 text-2xl font-black text-slate-950 dark:text-white">
              <StatNumber
                value={statsData?.corporateOwners}
                loading={isStatsLoading}
                skeletonClassName="h-8 w-16"
                className="text-2xl font-black text-slate-950 dark:text-white"
              />
              {!isStatsLoading && <span>Organizations</span>}
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f19]">
          <div>
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
              System Activity Status
            </span>
            <span className="mt-1 flex items-baseline gap-1.5 text-2xl font-black text-emerald-500 dark:text-emerald-400">
              <StatNumber
                value={statsData?.activeNow}
                loading={isStatsLoading}
                skeletonClassName="h-8 w-16"
                className="text-2xl font-black text-emerald-500 dark:text-emerald-400"
              />
              {!isStatsLoading && <span>Active Now</span>}
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 md:flex-row dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200/50 bg-slate-50 px-4 py-3 md:flex-1 dark:border-white/5 dark:bg-slate-800/50">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              dispatch(setSearchQuery(e.target.value))
            }}
            placeholder="Search owners by name, email domain, or company organization..."
            className="w-full bg-transparent text-sm font-semibold text-slate-700 placeholder-slate-400 outline-none dark:text-white"
          />
        </div>

        <div className="flex w-full items-center rounded-xl border border-slate-200/50 bg-slate-50 px-3 py-3 md:w-48 dark:border-white/5 dark:bg-slate-800/50">
          <select
            value={roleFilter}
            onChange={(e) => {
              dispatch(setRoleFilter(e.target.value as 'All' | OwnerRole))
            }}
            className="w-full cursor-pointer bg-transparent text-xs font-black text-slate-500 uppercase outline-none dark:text-slate-300"
          >
            <option value="All">All Roles</option>
            <option value="vcard-owner">Single Card Owners</option>
            <option value="corporate-owner">Corporate Card Owners</option>
          </select>
        </div>

        <div className="flex w-full items-center rounded-xl border border-slate-200/50 bg-slate-50 px-3 py-3 md:w-44 dark:border-white/5 dark:bg-slate-800/50">
          <select
            value={statusFilter}
            onChange={(e) => {
              dispatch(setStatusFilter(e.target.value as 'All' | AdminUserAccountStatus))
            }}
            className="w-full cursor-pointer bg-transparent text-xs font-black text-slate-500 uppercase outline-none dark:text-slate-300"
          >
            <option value="All">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            dispatch(resetFilters())
            prevFilterKeyRef.current = '|All|All'
          }}
          className="w-full rounded-xl border border-slate-200 px-5 py-3 text-xs font-black text-slate-500 uppercase transition-all hover:bg-slate-100 md:w-auto dark:border-white/5 dark:hover:bg-white/5"
        >
          Reset Search
        </button>
      </div>

      {isListError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          Failed to load users.{' '}
          <button type="button" className="underline" onClick={() => void refetchList()}>
            Retry
          </button>
        </div>
      )}

      {showListSkeletons ? (
        <AdminUserListSkeleton cardCount={PAGE_SIZE} />
      ) : (
        <div
          className={cn(
            'grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
            isFilterRefetching && 'opacity-70 transition-opacity'
          )}
        >
          {users.map((u) => {
            const corporate = isCorporateRole(u.role)
            const active = u.accountStatus === 'ACTIVE'
            const displayName = u.name || u.email
            return (
              <div
                key={u.id}
                className={cn(
                  'group relative flex h-auto flex-col rounded-2xl border bg-white transition-all duration-300 hover:shadow-xl dark:bg-[#0b0f19]',
                  active
                    ? 'border-slate-200/60 hover:border-slate-400 dark:border-white/5 dark:hover:border-white/20'
                    : 'border-rose-500/20 hover:border-rose-400/40'
                )}
              >
                <div className="flex flex-1 flex-col gap-2 p-3.5 pb-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase',
                          corporate
                            ? 'border-indigo-500/15 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                            : 'border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-300'
                        )}
                      >
                        {corporate ? <Building className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                        {corporate
                          ? 'Corporate'
                          : u.role === 'super-admin'
                            ? 'Super Admin'
                            : u.role === 'admin'
                              ? 'Admin'
                              : 'Single'}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase',
                          active
                            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : u.accountStatus === 'SUSPENDED'
                              ? 'border-rose-500/20 bg-rose-500/5 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                              : 'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            active ? 'bg-emerald-500' : u.accountStatus === 'SUSPENDED' ? 'bg-rose-500' : 'bg-amber-500'
                          )}
                        />
                        {statusBadgeLabel(u.accountStatus)}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-50 text-base font-black text-indigo-600 shadow-inner dark:border-white/5 dark:bg-slate-900 dark:text-indigo-400">
                        {(displayName[0] || '?').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3
                          className="truncate text-sm leading-snug font-extrabold text-slate-900 dark:text-white"
                          title={displayName}
                        >
                          {displayName}
                        </h3>
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">{roleLabel(u.role)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-2 dark:border-white/10 dark:bg-slate-900">
                    {[
                      { label: 'Email', value: u.email },
                      { label: 'Company', value: u.companyName || '—' },
                      { label: 'Cards', value: `${u.registeredCards} active` },
                      { label: 'Joined', value: formatJoined(u.createdAt) },
                    ].map((row) => (
                      <div key={row.label} className="grid grid-cols-[56px_1fr] items-center gap-2 text-[10px]">
                        <span className="font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
                          {row.label}
                        </span>
                        <span
                          className="truncate text-right font-bold text-slate-900 tabular-nums dark:text-white"
                          title={row.value}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto space-y-1.5 border-t border-slate-100 pt-2 dark:border-white/5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        disabled={u.role === 'admin' || u.role === 'super-admin'}
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 py-1.5 text-[10px] font-black tracking-wider text-white uppercase hover:bg-indigo-700 disabled:opacity-40"
                        title="Configure user"
                      >
                        <Edit2 className="h-3 w-3" /> Config
                      </button>
                      <button
                        type="button"
                        disabled={isSettingStatus}
                        onClick={() => void handleSetStatus(u.id, active ? 'PAUSED' : 'ACTIVE', u.name)}
                        className={cn(
                          'inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-black tracking-wider uppercase disabled:opacity-50',
                          active
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/25'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25'
                        )}
                        title={active ? 'Pause account' : 'Activate account'}
                      >
                        {active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        {active ? 'Pause' : 'Activate'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        disabled={isSettingStatus || u.accountStatus === 'SUSPENDED'}
                        onClick={() => void handleSetStatus(u.id, 'SUSPENDED', u.name)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-rose-50 py-1.5 text-[10px] font-black tracking-wider text-rose-700 uppercase hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
                        title="Suspend account access"
                      >
                        <Ban className="h-3 w-3" /> Suspend
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDeleteUser(u)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200/80 bg-white py-1.5 text-[10px] font-black tracking-wider text-rose-600 uppercase transition-colors hover:border-rose-500 hover:bg-rose-500 hover:text-white disabled:opacity-50 dark:border-rose-500/30 dark:bg-slate-800 dark:text-rose-300"
                        title="Delete user permanently"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!showListSkeletons && !isListError && users.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center dark:border-white/10">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No users match these filters.</p>
        </div>
      )}

      <div className="flex flex-col items-center justify-center gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
        {!showListSkeletons && !isListError && total > 0 && (
          <span className="text-xs font-semibold text-slate-500">
            Showing {users.length} of {total}
          </span>
        )}
        {hasMore && !isListError && (
          <button
            type="button"
            disabled={isListFetching}
            onClick={handleShowMore}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-black tracking-wider text-slate-600 uppercase hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            {isLoadingMore ? 'Loading…' : 'Show more'}
          </button>
        )}
      </div>

      {editingUser && (
        <ModalPortal>
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeEditModal} />

            <div className="animate-in zoom-in-95 relative max-h-[90vh] w-full max-w-lg overflow-hidden overflow-y-auto rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl duration-200 dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                    <Edit2 className="h-5 w-5 shrink-0 text-indigo-600" /> Configure User Parameters
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Modify credentials and organization link assigned to {editingUser.name || editingUser.email}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="shrink-0 rounded-xl bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="mt-6 space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Account Type</label>
                  <select
                    value={editingUser.role === 'corporate-owner' ? 'corporate-owner' : 'vcard-owner'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as OwnerRole })}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="vcard-owner">Single Card Owner</option>
                    <option value="corporate-owner">Corporate Card Owner</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Full Username
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Linked Company / Organization
                  </label>
                  <input
                    type="text"
                    value={editingUser.companyName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, companyName: e.target.value })}
                    placeholder="e.g. NextGen Solution Experts"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-4 border-t border-slate-100 pt-2 dark:border-white/5">
                  <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Reset Password (optional)
                  </p>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={editPasswordConfirm}
                      onChange={(e) => setEditPasswordConfirm(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 rounded-xl bg-slate-100 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving…' : 'Save Modifications'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {isAddUserOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => {
                setIsAddUserOpen(false)
                resetCreateForm()
              }}
            />

            <div className="animate-in zoom-in-95 relative max-h-[90vh] w-full max-w-lg overflow-hidden overflow-y-auto rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl duration-200 dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                    <UserPlus className="h-5 w-5 text-indigo-600" /> Provision Customer Account
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Create and configure a new credential profile for digital card owners.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddUserOpen(false)
                    resetCreateForm()
                  }}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-white/5"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddUserSubmit} className="mt-6 space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Account Role Class
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as OwnerRole)}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="vcard-owner">Single Card Owner</option>
                    <option value="corporate-owner">Corporate Card Owner</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Full Client Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Richard Hendricks"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Client Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. richard@hooli.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars, upper, number, special"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    autoComplete="new-password"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    autoComplete="new-password"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Organization Company
                  </label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Pied Piper Inc"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddUserOpen(false)
                      resetCreateForm()
                    }}
                    className="flex-1 rounded-xl bg-slate-100 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                  >
                    {isCreating ? 'Creating…' : 'Create & Active Account'}
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
          confirmLabel="Delete"
          variant="danger"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  )
}
