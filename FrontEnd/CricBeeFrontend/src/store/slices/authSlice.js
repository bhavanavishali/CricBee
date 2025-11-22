// src/store/slices/authSlice.js
import { createSlice } from "@reduxjs/toolkit";


const initialState = {
  user: null, 
  isAuthenticated: false,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    resetAuthState: () => initialState,
  },
});

export const { setUser, clearUser, setLoading, updateUser,resetAuthState } = authSlice.actions;


export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectUserName = (state) => state.auth.user?.full_name;
export const selectLoading = (state) => state.auth.loading;

export default authSlice.reducer;