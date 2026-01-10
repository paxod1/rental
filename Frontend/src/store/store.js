import { configureStore } from '@reduxjs/toolkit';
import toastReducer from './slices/toastSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
    reducer: {
        toast: toastReducer,
        ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['ui/openDeleteModal'],
                // Ignore these field paths in all actions
                ignoredActionPaths: ['payload.onConfirm'],
                // Ignore these paths in the state
                ignoredPaths: ['ui.deleteModal.onConfirm'],
            },
        }),
});
