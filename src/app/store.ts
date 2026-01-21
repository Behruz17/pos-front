import { baseApi } from '@/shared/request/baseApi'
import { configureStore } from '@reduxjs/toolkit'
import { router } from './routers'

export const extraArgument = {
  router,
}

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: { extraArgument } }).concat(baseApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
