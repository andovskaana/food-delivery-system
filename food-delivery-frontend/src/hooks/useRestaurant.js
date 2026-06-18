import {useEffect, useState} from "react";
import restaurantRepository from "../repository/restaurantRepository.js";
const useRestaurant = (id) => {
  const [state, set] = useState({item: null, loading: true, error: null});
  useEffect(() => {
    if (!id) return;
    let active = true;
    restaurantRepository.findById(id)
      .then(res => active && set({item: res.data, loading: false, error: null}))
      .catch(err => active && set({item: null, loading: false, error: err}));
    return () => { active = false };
  }, [id]);
  return state;
};
export default useRestaurant;
