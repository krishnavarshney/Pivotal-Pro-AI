import React, { useState, useEffect, FC } from 'react';

export const AnimatedStars: FC<{isAuth?: boolean}> = ({isAuth = false}) => {
    const [stars, setStars] = useState<Array<{ top: string; left: string; size: string; delay: string }>>([]);

    useEffect(() => {
        const newStars = Array.from({ length: 150 }).map(() => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            size: `${Math.random() * 2 + 1}px`,
            delay: `${Math.random() * 10}s`,
        }));
        setStars(newStars);
    }, []);

    return (
        <div className="absolute inset-0 -z-10 overflow-hidden">
            {stars.map((star, i) => (
                <div
                    key={i}
                    className={isAuth ? 'auth-star' : 'star'}
                    style={{
                        top: star.top,
                        left: star.left,
                        width: star.size,
                        height: star.size,
                        animationDelay: star.delay,
                    }}
                />
            ))}
        </div>
    );
};
