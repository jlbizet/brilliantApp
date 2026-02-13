import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useUIStore } from '../../stores';
import {
    LayoutDashboard, Users, Calendar, Stethoscope, Receipt,
    Package, Settings, LogOut, ChevronLeft, ChevronRight, Heart,
    FileText,
} from 'lucide-react';

const navItems = [
    { path: '/dashboard', labelKey: 'common.dashboard', icon: LayoutDashboard },
    { path: '/patients', labelKey: 'common.patients', icon: Users },
    { path: '/appointments', labelKey: 'common.appointments', icon: Calendar },
    { path: '/treatments', labelKey: 'common.treatments', icon: Stethoscope },
    { path: '/prescriptions', labelKey: 'common.prescriptions', icon: FileText },
    { path: '/billing', labelKey: 'common.billing', icon: Receipt },
    { path: '/inventory', labelKey: 'common.inventory', icon: Package },
    { path: '/settings', labelKey: 'common.settings', icon: Settings },
];

export default function Sidebar() {
    const { sidebarOpen, toggleSidebar } = useUIStore();
    const { logout, user } = useAuthStore();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside
            className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        flex flex-col transition-all duration-300 z-30 ${sidebarOpen ? 'w-[260px]' : 'w-[72px]'}`}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 dark:border-gray-800">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
                    <Heart className="w-5 h-5 text-white" />
                </div>
                {sidebarOpen && (
                    <div className="animate-fade-in">
                        <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">BrilliantSmile</h1>
                        <p className="text-[10px] text-primary-600 font-semibold tracking-widest uppercase">Dental CRM</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map(({ path, labelKey, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                                ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                            }`
                        }
                    >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span className="animate-fade-in">{t(labelKey)}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* User info & collapse */}
            <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-2">
                {sidebarOpen && user && (
                    <div className="px-3 py-2 animate-fade-in">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.role}</p>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
            text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span>{t('auth.logout')}</span>}
                </button>

                <button
                    onClick={toggleSidebar}
                    className="flex items-center justify-center w-full py-2 rounded-xl text-gray-400
            hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                >
                    {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
            </div>
        </aside>
    );
}
