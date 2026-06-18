import { useEffect, useState } from "react";
import recommendationRepository from "../repository/recommendationRepository.js";

const usePopularRecommendations = () => {
    const [state, setState] = useState({
        recommendations: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        let active = true;

        recommendationRepository
            .getPopularRecommendations()
            .then((res) => {
                if (active) {
                    setState({
                        recommendations: res.data,
                        loading: false,
                        error: null,
                    });
                }
            })
            .catch((err) => {
                if (active) {
                    setState({
                        recommendations: [],
                        loading: false,
                        error: err,
                    });
                }
            });

        return () => {
            active = false;
        };
    }, []);

    return state;
};

export default usePopularRecommendations;
