import { useEffect, useState } from "react";
import productRepository from "../repository/productRepository.js";

const useProductDetails = (id) => {
    const [state, setState] = useState({ item: null, loading: true, error: null });

    useEffect(() => {
        if (!id) return;

        let active = true;

        setState({ item: null, loading: true, error: null }); // reset state on id change

        productRepository.findDetails(id)
            .then(res => {
                if (active) setState({ item: res.data, loading: false, error: null });
            })
            .catch(err => {
                if (active) setState({ item: null, loading: false, error: err });
            });

        return () => { active = false; };
    }, [id]);

    return state;
};

export default useProductDetails;
