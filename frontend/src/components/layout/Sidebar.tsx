import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserRole } from '../../types';
import { useAuthStore, useUIStore } from '../../stores';
import {
    LayoutDashboard, Users, Calendar, Stethoscope, Receipt,
    Package, Settings, LogOut, ChevronLeft, ChevronRight, Heart,
    FileText, Shield, Sparkles,
} from 'lucide-react';

const navItems: { path: string; labelKey: string; icon: any; roles?: UserRole[] }[] = [
    { path: '/dashboard', labelKey: 'common.dashboard', icon: LayoutDashboard },
    { path: '/patients', labelKey: 'common.patients', icon: Users },
    { path: '/staff', labelKey: 'common.staff', icon: Shield, roles: ['ADMIN'] },
    { path: '/appointments', labelKey: 'common.appointments', icon: Calendar },
    { path: '/treatments', labelKey: 'common.treatments', icon: Stethoscope },
    { path: '/prescriptions', labelKey: 'common.prescriptions', icon: FileText },
    { path: '/billing', labelKey: 'common.billing', icon: Receipt, roles: ['ADMIN', 'DENTIST', 'RECEPTIONIST'] },
    { path: '/inventory', labelKey: 'common.inventory', icon: Package, roles: ['ADMIN', 'DENTIST', 'HYGIENIST', 'RECEPTIONIST'] },
    { path: '/settings', labelKey: 'common.settings', icon: Settings },
];

export default function Sidebar() {
    const { sidebarOpen, toggleSidebar } = useUIStore();
    const { logout, user } = useAuthStore();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside
            className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800/50
        flex flex-col transition-all duration-300 z-30 ${sidebarOpen ? 'w-[260px]' : 'w-[72px]'}`}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-800/50">
                <div className="relative w-10 h-10 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 flex-shrink-0 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Heart className="w-5 h-5 text-white relative z-10" />
                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 opacity-60" />
                </div>
                {sidebarOpen && (
                    <div className="animate-fade-in overflow-hidden">
                        <h1 className="text-base font-bold text-white leading-tight">BrilliantSmile</h1>
                        <p className="text-[10px] text-primary-400 font-semibold tracking-widest uppercase">Dental CRM</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
                {navItems
                    .filter(item => !item.roles || (user?.role && item.roles.includes(user.role as UserRole)))
                    .map(({ path, labelKey, icon: Icon }) => {
                        const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
                        return (
                            <NavLink
                                key={path}
                                to={path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden group
                                ${isActive
                                    ? 'bg-gradient-to-r from-primary-600/20 to-primary-500/10 text-primary-400 border border-primary-500/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full" />
                                )}
                                
                                <div className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0
                                    ${isActive 
                                        ? 'bg-primary-500/20 text-primary-400' 
                                        : 'bg-gray-800/50 text-gray-400 group-hover:bg-gray-700/50 group-hover:text-white'
                                    }`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                
                                {sidebarOpen && (
                                    <span className="truncate animate-fade-in">{t(labelKey)}</span>
                                )}
                            </NavLink>
                        );
                    })}
            </nav>

            {/* User info & collapse */}
            <div className="border-t border-gray-800/50 p-3 space-y-2">
                {sidebarOpen && user && (
                    <div className="px-3 py-2 animate-fade-in bg-gray-800/30 rounded-xl mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-sm">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold text-white truncate">
                                    {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-gray-500 truncate uppercase tracking-wider">{user.role}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!sidebarOpen && user && (
                    <div className="flex justify-center mb-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-sm">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
                    text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 border border-transparent hover:border-red-500/20"
                >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <LogOut className="w-4 h-4" />
                    </div>
                    {sidebarOpen && <span>{t('auth.logout')}</span>}
                </button>

                <button
                    onClick={toggleSidebar}
                    className="flex items-center justify-center w-full py-2.5 rounded-xl text-gray-500
                    hover:bg-white/5 hover:text-white transition-all duration-200 border border-gray-800/50 hover:border-gray-700"
                >
                    {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
            </div>
        </aside>
    );
}
