// Pre-typed versions of the standard react-redux hooks. Use these throughout
// the app instead of the plain `useDispatch` / `useSelector` so components get
// the full RootState / AppDispatch types without having to repeat the cast.
//
// Pattern documented at:
// https://redux.js.org/usage/usage-with-typescript#define-typed-hooks

import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch, RootState } from './store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
