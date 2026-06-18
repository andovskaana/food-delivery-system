import {useEffect, useState, useCallback} from "react";
import orderRepository from "../repository/orderRepository.js";

const useOrder = () => {
  const [state, set] = useState({order: null, loading: true, error: null});
  const refresh = useCallback(() => {
    set(s => ({...s, loading: true}));
    return orderRepository.getPending()
      .then(res => set({order: res.data, loading: false, error: null}))
      .catch(err => set({order: null, loading: false, error: err}));
  }, []);
  useEffect(() => { refresh() }, [refresh]);
  return {...state, refresh};
};
export default useOrder;
