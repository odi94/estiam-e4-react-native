import axios from 'axios';
import config from '@/constants/config';

/**
 * Base API client to avoid circular dependencies
 * between services/api.ts and services/auth.ts
 */
const api = axios.create({
    baseURL: config.API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

export default api;
