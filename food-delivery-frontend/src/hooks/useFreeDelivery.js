import { useEffect, useState, useCallback } from "react";
import rfmRepository from "../repository/rfmRepository.js";

const useFreeDelivery = (cartTotal = 0) => {
    const [state, setState] = useState({
        deliveryInfo: null,
        loading: true,
        error: null,
    });

    const fetchInfo = useCallback(
        (total) => {
            setState((s) => ({ ...s, loading: true }));

            rfmRepository
                .getFreeDeliveryInfo(total)
                .then((res) => {
                    setState({
                        deliveryInfo: res.data,
                        loading: false,
                        error: null,
                    });
                })
                .catch((err) => {
                    setState({
                        deliveryInfo: null,
                        loading: false,
                        error: err,
                    });
                });
        },
        []
    );

    useEffect(() => {
        let active = true;

        rfmRepository
            .getFreeDeliveryInfo(cartTotal)
            .then((res) => {
                if (active) {
                    setState({
                        deliveryInfo: res.data,
                        loading: false,
                        error: null,
                    });
                }
            })
            .catch((err) => {
                if (active) {
                    setState({
                        deliveryInfo: null,
                        loading: false,
                        error: err,
                    });
                }
            });

        return () => {
            active = false;
        };
    }, [cartTotal]);

    return { ...state, refresh: fetchInfo };
};

export default useFreeDelivery;
