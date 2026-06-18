import { useEffect, useState, useCallback } from "react";
import rfmRepository from "../repository/rfmRepository.js";

const useRfmOffers = () => {
    const [state, setState] = useState({
        offers: null,
        loading: true,
        error: null,
    });

    const fetchOffers = useCallback(() => {
        setState((s) => ({ ...s, loading: true }));

        rfmRepository
            .getMyOffers()
            .then((res) => {
                setState({
                    offers: res.data,
                    loading: false,
                    error: null,
                });
            })
            .catch((err) => {
                setState({
                    offers: null,
                    loading: false,
                    error: err,
                });
            });
    }, []);

    useEffect(() => {
        let active = true;

        rfmRepository
            .getMyOffers()
            .then((res) => {
                if (active) {
                    setState({
                        offers: res.data,
                        loading: false,
                        error: null,
                    });
                }
            })
            .catch((err) => {
                if (active) {
                    setState({
                        offers: null,
                        loading: false,
                        error: err,
                    });
                }
            });

        return () => {
            active = false;
        };
    }, []);

    return { ...state, refresh: fetchOffers };
};

export default useRfmOffers;
