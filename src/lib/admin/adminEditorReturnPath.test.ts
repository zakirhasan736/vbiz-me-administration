import { afterEach, describe, expect, it } from 'vitest'
import {
  ADMIN_MY_CARDS_PATH,
  ADMIN_VCARDS_PATH,
  readAdminEditorReturnPath,
  setAdminEditorReturnPath,
} from './adminEditorReturnPath'

describe('adminEditorReturnPath', () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it('stores the directory the admin opened the editor from', () => {
    setAdminEditorReturnPath(ADMIN_VCARDS_PATH)
    expect(readAdminEditorReturnPath()).toBe(ADMIN_VCARDS_PATH)
    setAdminEditorReturnPath(ADMIN_MY_CARDS_PATH)
    expect(readAdminEditorReturnPath()).toBe(ADMIN_MY_CARDS_PATH)
  })
})
