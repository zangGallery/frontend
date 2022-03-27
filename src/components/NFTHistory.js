import React, { useState } from "react";
import { useEffect } from "react";
import { useReadProvider } from "../common/provider";
import config from "../config";
import {
    blockToDateState,
    computeBalances,
    getBlockTime,
    getEvents,
} from "../common/history";
import Skeleton from "react-loading-skeleton";
import { shortenAddress } from "../common/utils";
import { useRecoilState } from "recoil";

import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en.json";

import Address from "./Address";

TimeAgo.addDefaultLocale(en);

const timeAgo = new TimeAgo("en-US");

export default function NFTHistory({ history }) {
    const [readProvider] = useReadProvider();
    const [blockToDate, setBlockToDate] = useRecoilState(blockToDateState);

    useEffect(() => {
        if (!history) {
            return;
        }

        for (const event of history) {
            if (!(event.blockNumber in blockToDate)) {
                getBlockTime(readProvider, event.blockNumber).then((date) => {
                    setBlockToDate((prev) => ({
                        ...prev,
                        [event.blockNumber]: date,
                    }));
                });
            }
        }
    }, [history]);

    console.log(history);

    return history ? (
        <div style={{ maxHeight: "25em", overflowY: "auto" }}>
            {[...history].reverse().map((event, index) => {
                return (
                    <div className="mb-4">
                        <div
                            key={index}
                            className="is-flex is-justify-content-space-between is-align-items-center"
                        >
                            <b className="is-size-6">
                                <tt>{event.type.toUpperCase()}</tt>
                            </b>
                            {blockToDate[event.blockNumber] ? (
                                <tt className="is-size-7 mr-2 mt-1">
                                    {timeAgo
                                        .format(blockToDate[event.blockNumber])
                                        .toUpperCase()}
                                </tt>
                            ) : (
                                <Skeleton width={100} />
                            )}
                        </div>
                        <p>
                            {event.from ? (
                                <tt className="is-size-7">
                                    FROM:{" "}
                                    <Address
                                        address={event.from}
                                        shorten
                                        nChar={8}
                                    />
                                </tt>
                            ) : (
                                <></>
                            )}
                        </p>
                        <p>
                            {event.to ? (
                                <tt className="is-size-7">
                                    TO: &nbsp;&nbsp;
                                    <Address
                                        address={event.to}
                                        shorten
                                        nChar={8}
                                    />
                                </tt>
                            ) : (
                                <></>
                            )}
                        </p>
                        <p>
                            {event.seller ? (
                                <tt className="is-size-7">
                                    SELLER:{" "}
                                    <Address
                                        address={event.seller}
                                        shorten
                                        nChar={8}
                                    />
                                </tt>
                            ) : (
                                <></>
                            )}
                        </p>
                        <p>
                            {event.buyer ? (
                                <tt className="is-size-7">
                                    BUYER: &nbsp;
                                    <Address
                                        address={event.buyer}
                                        shorten
                                        nChar={8}
                                    />
                                </tt>
                            ) : (
                                <></>
                            )}
                        </p>
                        <p>
                            {event.price ? (
                                <tt className="is-size-7">
                                    PRICE: &nbsp;{event.price} MATIC
                                </tt>
                            ) : (
                                <></>
                            )}
                        </p>
                        <p>
                            {event.amount ? (
                                <tt className="is-size-7">
                                    AMOUNT: {event.amount}
                                </tt>
                            ) : (
                                <></>
                            )}
                        </p>
                        <p className="is-size-7">
                            <a
                                target="_blank"
                                rel="noopener"
                                style={{ textDecoration: "underline" }}
                                href={
                                    config.blockExplorer.url +
                                    "/tx/" +
                                    event.transactionHash
                                }
                            >
                                <tt>[tx]</tt>
                            </a>
                        </p>
                        <hr />
                    </div>
                );
            })}
        </div>
    ) : (
        <Skeleton />
    );
}
