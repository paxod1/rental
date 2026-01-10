import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    deleteModal: {
        isOpen: false,
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete this item?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        loading: false,
        onConfirm: null,
    },
    isGlobalLoading: false,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        openDeleteModal: (state, action) => {
            state.deleteModal = {
                isOpen: true,
                title: action.payload.title || 'Confirm Delete',
                message: action.payload.message || 'Are you sure you want to delete this item?',
                confirmText: action.payload.confirmText || 'Delete',
                cancelText: action.payload.cancelText || 'Cancel',
                loading: false,
                onConfirm: action.payload.onConfirm,
            };
        },
        closeDeleteModal: (state) => {
            state.deleteModal = {
                ...initialState.deleteModal,
                isOpen: false,
            };
        },
        setDeleteModalLoading: (state, action) => {
            state.deleteModal.loading = action.payload;
        },
        setGlobalLoading: (state, action) => {
            state.isGlobalLoading = action.payload;
        },
    },
});

export const { openDeleteModal, closeDeleteModal, setDeleteModalLoading, setGlobalLoading } = uiSlice.actions;
export default uiSlice.reducer;
