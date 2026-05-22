import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL
  || import.meta.env.REACT_APP_API_URL
  || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
