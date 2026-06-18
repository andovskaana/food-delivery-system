import {useEffect, useState} from "react";
import userRepository from "../repository/userRepository.js";
const useAuthUser = () => {
  const [state, set] = useState({me: null, loading: true, error: null});
  useEffect(() => {
    userRepository.me().then(res => set({me: res.data, loading: false, error: null}))
      .catch(err => set({me: null, loading: false, error: err}));
  }, []);
  return state;
};
export default useAuthUser;
