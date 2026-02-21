import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

//handle logout and prevent infinite refresh loop
const handleLogout = () => {
    if(window.location.pathname !== '/login'){
        window.location.href = '/login';
    }
}

//handle adding a new access token to queued requests
const subscribeTokenRefresh = (cb: () => void) => {
    refreshSubscribers.push(cb);
}

//execute queued requests after refresh
const subscriberTokenRefresh = () => {
    refreshSubscribers.forEach((cb) => cb());
    refreshSubscribers = [];
}

//handle API requests with custom interceptors
axiosInstance.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error),
);

//handle expired tokens and refresh logic
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        //prevent infinite retry loop
        if(error.response.status === 401 && !originalRequest._retry){
            if(isRefreshing){
                return new Promise((resolve) => {
                    subscribeTokenRefresh(() => {
                        resolve(axiosInstance(originalRequest));
                    });
                });
            }
            originalRequest._retry = true;
            isRefreshing = true;
            try{
                await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/auth/api/v1/refresh-token`, {}, {withCredentials: true});
                isRefreshing = false;
                subscriberTokenRefresh();
                return axiosInstance(originalRequest);
            }catch(refreshError){
                isRefreshing = false;
                refreshSubscribers = [];
                handleLogout();
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
)

export default axiosInstance;