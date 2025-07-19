// src/app/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import projectReducer from "../features/projects/projectSlice"; // Importar reducer de proyectos
import userReducer from "../features/users/userSlice"; // Importar reducer de usuarios
import taskReducer from "../features/tasks/taskSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer, // Añadir reducer de proyectos
    users: userReducer, // Añadir reducer de usuarios
    tasks: taskReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
