import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5289/api', // Địa chỉ Backend của bạn
});

// Bộ chặn (Interceptor) cho request: Tự động đính kèm Token nếu có
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
