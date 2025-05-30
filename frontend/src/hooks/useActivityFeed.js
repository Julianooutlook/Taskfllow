import { useState, useEffect, useRef } from 'react';

export function useActivityFeed() {
    const [activities, setActivities] = useState([]);
    const wsRef = useRef(null);
    const retryTimeoutRef = useRef(null);

    useEffect(() => {
        function connect() {
            retryTimeoutRef.current = setTimeout(() => {
                const ws = new WebSocket('ws://localhost:4000');
                wsRef.current = ws;

                ws.onopen = () => {
                    if (process.env.NODE_ENV !== 'production') {
                        console.log('✅ WebSocket conectado');
                    }
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);

                        if (data.type === 'activity') {
                            setActivities((prev) => [data.payload, ...prev.slice(0, 4)]);
                        }

                    } catch (error) {
                        console.error('Erro ao parsear mensagem:', error);
                    }
                };

                ws.onerror = (error) => {
                    console.error('Erro WebSocket:', error);
                };

                ws.onclose = () => {
                    console.warn('⚠️ WebSocket fechado. Tentando reconectar em 1s...');
                    retryTimeoutRef.current = setTimeout(connect, 1000);
                };
            }, 500);
        }

        connect();

        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return activities;
}
