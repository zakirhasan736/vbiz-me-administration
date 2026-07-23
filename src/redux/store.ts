import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { api } from './api/api'
import userReducer from './features/auth/user.slice'
import designSettingsReducer from './features/designSettings/designSettings.slice'
import vcardsReducer from './features/vcards/vcards.slice'

const userPersistConfig = { key: 'user', storage }
const vcardsPersistConfig = { key: 'vcards', storage }
const designPersistConfig = { key: 'designSettings', storage }

const persistAuthReducer = persistReducer(userPersistConfig, userReducer)
const persistVcardsReducer = persistReducer(vcardsPersistConfig, vcardsReducer)
const persistDesignReducer = persistReducer(designPersistConfig, designSettingsReducer)

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  user: persistAuthReducer,
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
    }).concat(api.middleware),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
