import {
  Middleware,
  ReducersMapObject,
  combineReducers,
  configureStore,
} from "@reduxjs/toolkit";
import { slices } from "./slice";
import { apis } from "./api";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

export type RootState = ReturnType<typeof rootReducer>;

const rootReducer = combineReducers({
  ...slices,
  ...apis.reduce((acc, api) => {
    acc[api.reducerPath] = api.reducer;
    return acc;
  }, {} as ReducersMapObject),
});

export function makeStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: (gDM) =>
      gDM().concat(...apis.map((a) => a.middleware as Middleware)),
  });
}

export const store = makeStore();
export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();
