import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Heart, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { authApi } from '../../api';
import { useAuthStore } from '../../stores';
import { getErrorMessage } from '../../utils/errors';

const getLoginSchema = (t: (key: string, options?: any) => string) => z.object({
    email: z.string().min(1, t('validation.required')).email(t('validation.invalid_email')),
    password: z.string().min(1, t('validation.required')).min(6, t('validation.min_length', { min: 6 })),
});

type LoginForm = z.infer<ReturnType<typeof getLoginSchema>>;

export default function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginForm>({
        resolver: zodResolver(getLoginSchema(t)),
        defaultValues: { email: 'admin@dentalcrm.com', password: 'admin123' },
    });

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        try {
            const result = await authApi.login(data.email, data.password);
            login(result.user as any, result.accessToken, result.refreshToken);
            toast.success(`${t('auth.welcome_back_user', { name: result.user.firstName })}`);
            navigate('/dashboard');
        } catch (error: any) {
            const response = error.response?.data;
            if (response?.errors && typeof response.errors === 'object') {
                Object.entries(response.errors).forEach(([field, message]) => {
                    setError(field as keyof LoginForm, { message: message as string });
                });
            } else {
                toast.error(getErrorMessage(error, t('validation.invalid_credentials')));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left: Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex-col justify-center items-center p-12 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/5 rounded-full" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
                <div className="absolute top-1/3 right-12 w-48 h-48 bg-white/5 rounded-full" />

                <div className="relative z-10 text-center max-w-md">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <Heart className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
                        BrilliantSmile
                    </h1>
                    <p className="text-primary-100 text-lg leading-relaxed">
                        {t('auth.branding_subtitle')}
                    </p>

                    <div className="mt-12 grid grid-cols-3 gap-6 text-center">
                        {[
                            { value: '2,500+', label: t('common.patients') },
                            { value: '98%', label: t('auth.stat_satisfaction') },
                            { value: '10K+', label: t('common.appointments') },
                        ].map((s) => (
                            <div key={s.label}>
                                <p className="text-2xl font-bold text-white">{s.value}</p>
                                <p className="text-primary-200 text-xs mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
                <div className="w-full max-w-md animate-slide-up">
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                            <Heart className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BrilliantSmile</h1>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('auth.welcome_back')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">{t('auth.signin_subtitle')}</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="label">{t('auth.email_label')}</label>
                            <input {...register('email')} type="email" className="input-field" placeholder="you@clinic.com" />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="label">{t('auth.password_label')}</label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    className="input-field pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    {t('auth.signing_in')}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">{t('auth.signin_button')} <ArrowRight className="w-4 h-4" /></span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 p-4 rounded-xl bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900">
                        <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 mb-2">{t('auth.demo_credentials')}</p>
                        <div className="space-y-1 text-xs text-primary-600 dark:text-primary-300">
                            <p><strong>{t('auth.role_admin')}:</strong> admin@dentalcrm.com / admin123</p>
                            <p><strong>{t('auth.role_dentist')}:</strong> dr.smith@dentalcrm.com / dentist123</p>
                            <p><strong>{t('auth.role_reception')}:</strong> reception@dentalcrm.com / reception123</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
