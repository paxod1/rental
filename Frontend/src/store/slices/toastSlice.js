import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    message: '',
    type: '', // 'success' | 'error' | 'warning' | 'info'
    timestamp: null,
};

const toastSlice = createSlice({
    name: 'toast',
    initialState,
    reducers: {
        showToast: (state, action) => {
            state.message = action.payload.message;
            state.type = action.payload.type;
            state.timestamp = Date.now();
        },
        clearToast: (state) => {
            state.message = '';
            state.type = '';
            state.timestamp = null;
        },
    },
});

export const { showToast, clearToast } = toastSlice.actions;
export default toastSlice.reducer;
