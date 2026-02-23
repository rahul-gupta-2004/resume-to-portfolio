import ChatBot from '../components/ChatBot';

/**
 * AuthLayout — wraps all authenticated pages.
 * Renders children + the global floating ChatBot widget.
 * The ChatBot is position:fixed so it sits above any page layout.
 */
export default function AuthLayout({ children }) {
    return (
        <>
            {children}
            <ChatBot />
        </>
    );
}
