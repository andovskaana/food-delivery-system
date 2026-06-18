import {useEffect, useState} from "react";
import productRepository from "../repository/productRepository.js";
const useProducts = () => {
  const [state, set] = useState({items: [], loading: true, error: null});
  useEffect(() => {
    let active = true;
    productRepository.findAll()
      .then(res => active && set({items: res.data, loading: false, error: null}))
      .catch(err => active && set({items: [], loading: false, error: err}));
    return () => { active = false; };
  }, []);
  return state;
};
export default useProducts;
