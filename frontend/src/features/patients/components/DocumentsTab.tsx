import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileText, Upload, Trash2, Download, FileJson, FileImage, FileBox, Plus, X, FolderOpen, Image, FileSearch, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsApi } from '../../../api';
import type { Document, DocumentType } from '../../../types';
import DocumentPreviewModal from './DocumentPreviewModal';

interface DocumentsTabProps {
    patientId: string;
}

const DOC_TYPE_ICONS: Record<string, any> = {
    XRAY: FileImage,
    SCAN: FileBox,
    CONSENT_FORM: FileText,
    PHOTO: Image,
    LAB_RESULT: FileJson,
    PRESCRIPTION: FileText,
    INSURANCE: FileText,
    OTHER: FileText,
};

const DOC_TYPE_COLORS: Record<string, string> = {
    XRAY: 'from-blue-500 to-cyan-500',
    SCAN: 'from-purple-500 to-violet-500',
    CONSENT_FORM: 'from-emerald-500 to-teal-500',
    PHOTO: 'from-pink-500 to-rose-500',
    LAB_RESULT: 'from-amber-500 to-orange-500',
    PRESCRIPTION: 'from-primary-500 to-indigo-500',
    INSURANCE: 'from-gray-500 to-slate-500',
    OTHER: 'from-gray-400 to-gray-500',
};

const DOC_TYPE_BG: Record<string, string> = {
    XRAY: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    SCAN: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    CONSENT_FORM: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    PHOTO: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
    LAB_RESULT: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    PRESCRIPTION: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    INSURANCE: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    OTHER: 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
};

export default function DocumentsTab({ patientId }: DocumentsTabProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [showUpload, setShowUpload] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [uploadData, setUploadData] = useState({
        file: null as File | null,
        type: 'OTHER' as DocumentType,
        description: '',
    });

    const { data: documents, isLoading } = useQuery({
        queryKey: ['documents', patientId],
        queryFn: () => documentsApi.getByPatient(patientId),
    });

    const uploadMutation = useMutation({
        mutationFn: () => {
            if (!uploadData.file) throw new Error(t('documents.error_no_file'));
            return documentsApi.upload(patientId, uploadData.file, uploadData.type, uploadData.description);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents', patientId] });
            toast.success(t('documents.upload_success'));
            setShowUpload(false);
            setUploadData({ file: null, type: 'OTHER', description: '' });
        },
        onError: () => toast.error(t('documents.upload_error')),
    });

    const deleteMutation = useMutation({
        mutationFn: documentsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents', patientId] });
            toast.success(t('documents.delete_success'));
        },
    });

    const handleDownload = async (id: string, fileName: string) => {
        try {
            const blob = await documentsApi.download(id);
            const url = URL.createObjectURL(blob);
            const link = window.document.createElement('a');
            link.href = url;
            link.download = fileName;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            toast.error(t('documents.download_error'));
        }
    };

    if (isLoading) return (
        <div className="text-center py-12 text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <p>{t('documents.loading')}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30">
                        <FolderOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    {t('documents.title')}
                </h3>
                <button 
                    onClick={() => setShowUpload(true)} 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all"
                >
                    <Upload className="w-4 h-4" /> {t('documents.upload_button')}
                </button>
            </div>

            {showUpload && (
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-primary-200 dark:border-primary-800/50 p-6 animate-slide-up overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-primary-500" />
                    <button onClick={() => setShowUpload(false)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                        <FileSearch className="w-5 h-5 text-primary-500" />
                        {t('documents.upload_new_file')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="label text-xs uppercase tracking-wider font-bold opacity-70">{t('documents.select_file')}</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-primary-50 file:to-primary-100 file:text-primary-700 hover:file:from-primary-100 hover:file:to-primary-200 dark:file:from-primary-900/20 dark:file:to-primary-800/20 dark:file:text-primary-400 transition-all cursor-pointer"
                                    onChange={e => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                                />
                                {uploadData.file && (
                                    <div className="mt-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary-500" />
                                        <span className="text-sm text-primary-700 dark:text-primary-300 font-medium">{uploadData.file.name}</span>
                                        <span className="text-xs text-primary-500">({(uploadData.file.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="label text-xs uppercase tracking-wider font-bold opacity-70">{t('common.category')}</label>
                            <select className="input-field rounded-xl" value={uploadData.type} onChange={e => setUploadData({ ...uploadData, type: e.target.value as DocumentType })}>
                                <option value="XRAY">{t('documents.type_xray')}</option>
                                <option value="SCAN">{t('documents.type_scan')}</option>
                                <option value="CONSENT_FORM">{t('documents.type_consent_form')}</option>
                                <option value="LAB_RESULT">{t('documents.type_lab_result')}</option>
                                <option value="PHOTO">{t('documents.type_photo')}</option>
                                <option value="PRESCRIPTION">{t('documents.type_prescription')}</option>
                                <option value="INSURANCE">{t('documents.type_insurance')}</option>
                                <option value="OTHER">{t('documents.type_other')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="label text-xs uppercase tracking-wider font-bold opacity-70">{t('common.description')} ({t('common.optional')})</label>
                            <input className="input-field rounded-xl" placeholder={t('documents.description_placeholder')} value={uploadData.description} onChange={e => setUploadData({ ...uploadData, description: e.target.value })} />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                            <button onClick={() => setShowUpload(false)} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('common.cancel')}</button>
                            <button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !uploadData.file} className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {uploadMutation.isPending ? t('common.uploading') : t('documents.confirm_upload')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {documents && documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {documents.map((doc: Document) => {
                        const Icon = DOC_TYPE_ICONS[doc.type] || FileText;
                        const colorGradient = DOC_TYPE_COLORS[doc.type] || 'from-gray-400 to-gray-500';
                        const bgColor = DOC_TYPE_BG[doc.type] || 'bg-gray-50 dark:bg-gray-800';
                        
                        return (
                            <div key={doc.id} className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50 p-5 hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colorGradient}`} />
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${bgColor} shadow-sm`}>
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 dark:text-white truncate text-lg" title={doc.name}>{doc.name}</p>
                                        <p className="text-xs text-gray-500 mt-1 font-medium">
                                            {t(`documents.type_${doc.type.toLowerCase()}`)} • {(doc.fileSize / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setSelectedDoc(doc)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 hover:text-primary-600 transition-colors" title={t('common.preview')}>
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDownload(doc.id, doc.name)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 hover:text-primary-600 transition-colors" title={t('common.download')}>
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteMutation.mutate(doc.id)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl text-gray-500 hover:text-rose-500 transition-colors" title={t('common.delete')}>
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {doc.description && (
                                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">&quot;{doc.description}&quot;</p>
                                )}
                                <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${colorGradient}`} />
                                    {t('common.uploaded_on')} {new Date(doc.uploadedAt).toLocaleDateString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                        <FolderOpen className="w-10 h-10 text-primary-300 dark:text-primary-600" />
                    </div>
                    <p className="text-gray-500 font-medium text-lg">{t('documents.no_documents')}</p>
                    <p className="text-sm text-gray-400 mt-2">{t('documents.upload_hint')}</p>
                </div>
            )}
            
            {selectedDoc && (
                <DocumentPreviewModal 
                    doc={selectedDoc} 
                    onClose={() => setSelectedDoc(null)} 
                />
            )}
        </div>
    );
}
