import { useDispatch, useSelector } from 'react-redux'
import { extraArgument, store, type RootState } from './store'
import { createAsyncThunk, type ThunkAction, type UnknownAction } from '@reduxjs/toolkit'

export type TAppDispatch = typeof store.dispatch
export type TAppSelector = typeof store.getState
export type TExtraArgument = typeof extraArgument
export type AppThunk<R = void> = ThunkAction<R, RootState, typeof extraArgument, UnknownAction>

export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppDispatch = useDispatch.withTypes<TAppDispatch>()
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState
  dispatch: TAppDispatch
  extra: TExtraArgument
}>()
