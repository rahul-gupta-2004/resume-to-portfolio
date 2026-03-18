import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';

/**
 * AuthLayout — wraps all authenticated pages.
 */
export default function AuthLayout({ children }) {
    const location = useLocation();

    useEffect(() => {
        let title = "Profilr";
        let emoji = "🚀";

        if (location.pathname.includes('/portfolio')) {
            title = "My Portfolio | Profilr";
            emoji = "💼";
        } else if (location.pathname.includes('/tracker')) {
            title = "Placement Tracker | Profilr";
            emoji = "📋";
        } else if (location.pathname.includes('/analyzer')) {
            title = "ATS Analytics | Profilr";
            emoji = "📊";
        } else if (location.pathname.includes('/account')) {
            title = "My Account | Profilr";
            emoji = "⚙️";
        } else if (location.pathname.includes('/dashboard')) {
            title = "Dashboard | Profilr";
            emoji = "🏠";
        }

        document.title = title;

        // Dynamic favicon using emoji
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/png';
        link.rel = 'shortcut icon';
        const canvas = document.createElement('canvas');
        canvas.height = 32;
        canvas.width = 32;
        const ctx = canvas.getContext('2d');
        ctx.font = '28px serif';
        ctx.fillText(emoji, 0, 28);
        link.href = canvas.toDataURL();
        if (!document.querySelector("link[rel*='icon']")) {
            document.getElementsByTagName('head')[0].appendChild(link);
        }
    }, [location.pathname]);

    return (
        <>
            <Navbar />
            {children}
        </>
    );
}
