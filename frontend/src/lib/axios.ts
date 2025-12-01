import axios, { AxiosInstance } from "axios";


const api:AxiosInstance=axios.create({
    baseURL:process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
});


//Global Axios error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API Error:", err.response?.data || err.message);
    return Promise.reject(err);
  }
);
api.interceptors.request.use((config)=>{
    const token=localStorage.getItem("accessToken");
    if(typeof window!=='undefined'){
    if(token && config.headers){
        config.headers.set("Authorization",`Bearer ${token}`);

    }}
    return config;

});

export default api;
