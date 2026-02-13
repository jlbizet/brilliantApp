import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileText, Upload, Trash2, Download, FileJson, FileImage, FileBox, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsApi } from '../../../api';
import type { Document, DocumentType } from '../../../types';

interface DocumentsTabProps {
    patientId: string;
}

const DOC_TYPE_ICONS: Record<string, any> = {
    XRAY: FileImage,
    SCAN: FileBox,
    CONSENT_FORM: FileText,
    PHOTO: FileImage,
    LAB_RESULT: FileJson,
    PRESCRIPTION: FileText,
    INSURANCE: FileText,
    OTHER: FileText,
};

export default function DocumentsTab({ patientId }: DocumentsTabProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [showUpload, setShowUpload] = useState(false);
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
            if (!uploadData.file) throw new Error(t('documents.error_no_file') || 'No file selected');
            return documentsApi.upload(patientId, uploadData.file, uploadData.type, uploadData.description);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents', patientId] });
            toast.success(t('documents.upload_success') || 'Document uploaded!');
            setShowUpload(false);
            setUploadData({ file: null, type: 'OTHER', description: '' });
        },
        onError: () => toast.error(t('documents.upload_error') || 'Upload failed'),
    });

    const deleteMutation = useMutation({
        mutationFn: documentsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents', patientId] });
            toast.success(t('documents.delete_success') || 'Document deleted');
        },
    });

    if (isLoading) return <div className="text-center py-12 text-gray-400">{t('documents.loading')}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('documents.title')}</h3>
                <button onClick={() => setShowUpload(true)} className="btn-primary">
                    <Upload className="w-4 h-4" /> {t('documents.upload_button')}
                </button>
            </div>

            {showUpload && (
                <div className="card animate-slide-up relative bg-primary-50/50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/20">
                    <button onClick={() => setShowUpload(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4">{t('documents.upload_new_file')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="label text-xs uppercase tracking-wider font-bold opacity-70">{t('documents.select_file')}</label>
                            <input
                                type="file"
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400"
                                onChange={e => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                            />
                        </div>
                        <div>
                            <label className="label text-xs uppercase tracking-wider font-bold opacity-70">{t('common.category')}</label>
                            <select
                                className="input-field"
                                value={uploadData.type}
                                onChange={e => setUploadData({ ...uploadData, type: e.target.value as DocumentType })}
                            >
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
                            <input
                                className="input-field"
                                placeholder={t('documents.description_placeholder')}
                                value={uploadData.description}
                                onChange={e => setUploadData({ ...uploadData, description: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2">
                            <button onClick={() => setShowUpload(false)} className="btn-secondary">{t('common.cancel')}</button>
                            <button
                                onClick={() => uploadMutation.mutate()}
                                disabled={uploadMutation.isPending || !uploadData.file}
                                className="btn-primary"
                            >
                                {uploadMutation.isPending ? t('common.uploading') : t('documents.confirm_upload')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {documents && documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc: Document) => {
                        const Icon = DOC_TYPE_ICONS[doc.type] || FileText;
                        return (
                            <div key={doc.id} className="group p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40 hover:border-primary-200 dark:hover:border-primary-800 transition-all">
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 dark:text-white truncate" title={doc.name}>{doc.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {t(`documents.type_${doc.type.toLowerCase()}`)} • {(doc.fileSize / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteMutation.mutate(doc.id)}
                                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-rose-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {doc.description && (
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">"{doc.description}"</p>
                                )}
                                <p className="mt-3 text-[10px] text-gray-400 uppercase tracking-tighter">
                                    {t('common.uploaded_on')} {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card text-center py-12">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500">{t('documents.no_documents')}</p>
                </div>
            )}
        </div>
    );
}
