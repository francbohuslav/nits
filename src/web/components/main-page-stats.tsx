import { Box, LinearProgress, Typography } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import dateUtils from "../../common/date-utils";
import { IUserStats } from "../../common/interfaces";
import { useAjax } from "../ajax";

export const MainPageStats = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<IUserStats>(null);
    const ajax = useAjax();

    const loadData = async () => {
        setIsLoading(true);
        const res = await ajax.get<IUserStats>("/server/user-stats/get");
        if (res.isOk) {
            setStats(res.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div style={{ minHeight: "44px" }}>
            {isLoading ? (
                <Box pt={2}>
                    <LinearProgress />
                </Box>
            ) : (
                <Typography align="center">
                    {stats?.lastSynchronization ? (
                        <>
                            Poslední synchronizace proběhla <strong>{dateUtils.formatDateTime(stats.lastSynchronization)}</strong>. <br />
                            Za tento měsíc bylo synchronizováno <strong>{dateUtils.formatHours(stats.wtmHours)}</strong> hodin.
                        </>
                    ) : (
                        "Zatím nesynchronizováno"
                    )}
                </Typography>
            )}
        </div>
    );
};
