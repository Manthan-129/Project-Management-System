import axios from 'axios'
import {BASE_URL} from './apiPaths.js'

const normalizeBaseUrl = (value) => {
    if (!value || typeof value !== 'string') {
        return 'http://localhost:5000';
    }

    return value.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '') || 'http://localhost:5000';
};

const backendBaseUrl = normalizeBaseUrl(BASE_URL);

const axiosInstance = axios.create({
    baseURL: `${backendBaseUrl}/api`,
    timeout: 80000,
    headers: {
        'Content-Type' : 'application/json',
        Accept: 'application/json'
    },
})

// Request Interceptor
axiosInstance.interceptors.request.use(
    (config) =>{
        return config;
    },
    (error)=> {
        return Promise.reject(error);
    }
)

// Response Interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if(error.response) {
            if(error.response.status === 401) {
                console.log('Unauthorized access - perhaps redirect to login?');
            }
            else if(error.response.status === 500){
                console.log('Server error - please try again later.');
            }
        } else if(error.code === 'ECONNABORTED'){
            console.log('Request timeout. Please try again.');
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;