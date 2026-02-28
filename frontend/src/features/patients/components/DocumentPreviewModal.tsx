import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, FileText, FileImage, File, Loader2, AlertCircle, FileCode } from 'lucide-react';
import { documentsApi } from '../../../api';
import type { Document } from '../../../types';

interface DocumentPreviewModalProps {
    doc: Document;
    onClose: () => void;
}

type PreviewState = 'loading' | 'success' | 'error';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const PDF_TYPE = 'application/pdf';
const TEXT_TYPES = ['text/plain', 'text/csv', 'application/json', 'text/html'];
const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export default function DocumentPreviewModal({ doc, onClose }: DocumentPreviewModalProps) {
    const { t } = useTranslation();
    const [previewState, setPreviewState] = useState<PreviewState>('loading');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [textContent, setTextContent] = useState<string | null>(null);

    const isImage = IMAGE_TYPES.includes(doc.mimeType);
    const isPdf = doc.mimeType === PDF_TYPE;
    const isText = TEXT_TYPES.includes(doc.mimeType);
    const isDocx = doc.mimeType === DOCX_TYPE;

    useEffect(() => {
        loadPreview();

        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [doc.id]);

    const loadPreview = async () => {
        try {
            setPreviewState('loading');
            const blob = await documentsApi.getFile(doc.id);
            const url = URL.createObjectURL(blob);
            
            if (isText) {
                const text = await blob.text();
                setTextContent(text);
            }
            
            setPreviewUrl(url);
            setPreviewState('success');
        } catch (error) {
            console.error('Error loading preview:', error);
            setPreviewState('error');
        }
    };

    const handleDownload = async () => {
        try {
            const blob = await documentsApi.download(doc.id);
            const url = URL.createObjectURL(blob);
            const link = window.document.createElement('a');
            link.href = url;
            link.download = doc.name;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    const renderPreview = () => {
        if (previewState === 'loading') {
            return (
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">{t('documents.preview_loading')}</p>
                    </div>
                </div>
            );
        }

        if (previewState === 'error') {
            return (
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">{t('documents.preview_error')}</p>
                    </div>
                </div>
            );
        }

        if (isImage && previewUrl) {
            return (
                <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto">
                    <img 
                        src={previewUrl} 
                        alt={doc.name}
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            );
        }

        if (isPdf && previewUrl) {
            return (
                <div className="h-96 rounded-lg overflow-hidden">
                    <iframe
                        src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full border-0"
                        title={doc.name}
                    />
                </div>
            );
        }

        if (isText && textContent) {
            return (
                <div className="h-96 overflow-auto bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                        {textContent}
                    </pre>
                </div>
            );
        }

        if (isDocx) {
            return (
                <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-900 rounded-lg">
                    <div className="text-center">
                        <FileCode className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            {t('documents.docx_not_supported')}
                        </p>
                        <button 
                            onClick={handleDownload}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            {t('common.download')}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <div className="text-center">
                    <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {t('documents.preview_not_available')}
                    </p>
                    <button 
                        onClick={handleDownload}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        {t('common.download')}
                    </button>
                </div>
            </div>
        );
    };

    const getFileIcon = () => {
        if (isImage) return <FileImage className="w-8 h-8" />;
        if (isPdf) return <FileText className="w-8 h-8" />;
        if (isDocx) return <FileCode className="w-8 h-8" />;
        return <File className="w-8 h-8" />;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                            {getFileIcon()}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-white truncate">{doc.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {doc.mimeType} • {(doc.fileSize / 1024).toFixed(1)} KB
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                            title={t('common.download')}
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                <div className="p-4 max-h-[70vh] overflow-auto">
                    {renderPreview()}
                </div>

                {doc.description && (
                    <div className="px-4 pb-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                            "{doc.description}"
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
