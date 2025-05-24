import axios from "axios";

const axiosInstance=axios.create()

axiosInstance.defaults.baseURL=""
axiosInstance.defaults.withCredentials=true

export default axiosInstance