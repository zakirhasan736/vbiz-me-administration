import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { api } from './api/api'
import { publicApi } from './api/publicApi'
import adminUsersListReducer from './features/adminUsers/adminUsersList.slice'
import adminVCardsListReducer from './features/adminVCardsList/adminVCardsList.slice'
import userReducer from './features/auth/user.slice'
import designSettingsReducer from './features/designSettings/designSettings.slice'
import myCardReducer from './features/myCard/myCard.slice'
import vcardsReducer from './features/vcards/vcards.slice'

/** Registers all RTK Query endpoints (auth + public profile + admin profiles). */
import './api/index'

const userPersistConfig = {
  key: 'user',
  storage,
  // Never persist loading — after OAuth redirect we must re-bootstrap from cookies
  // before RequireAuth decides the user is logged out.
  whitelist: ['user', 'token'],
}
const vcardsPersistConfig = { key: 'vcards', storage }
const designPersistConfig = { key: 'designSettings', storage }

const persistAuthReducer = persistReducer(userPersistConfig, userReducer)
const persistVcardsReducer = persistReducer(vcardsPersistConfig, vcardsReducer)
const persistDesignReducer = persistReducer(designPersistConfig, designSettingsReducer)

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  [publicApi.reducerPath]: publicApi.reducer,
  user: persistAuthReducer,
  myCard: myCardReducer,
  adminUsersList: adminUsersListReducer,
  adminVCardsList: adminVCardsListReducer,
  vcards: persistVcardsReducer,
  designSettings: persistDesignReducer,
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
      .concat(api.middleware)
      .concat(publicApi.middleware),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
