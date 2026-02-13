import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatWidget from '../Chat/ChatWidget';
import { useUIStore } from '../../stores';

export default function MainLayout({ children }: { children: ReactNode }) {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
            <Sidebar />
            <div
                className="transition-all duration-300"
                style={{ marginLeft: sidebarOpen ? '260px' : '72px' }}
            >
                <Header />
                <main className="p-6 animate-fade-in">
                    {children}
                </main>
            </div>
            <ChatWidget />
        </div>
    );
}
