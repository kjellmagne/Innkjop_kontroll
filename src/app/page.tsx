"use client";

import { useState, useCallback, useEffect } from 'react';
import styles from './page.module.css';
import { UploadCloud, FileText, X, ChevronRight, Settings, Loader2, CheckCircle, AlertTriangle, XCircle, Info, Globe } from 'lucide-react';
import { LLMProvider, ComparisonResult, DocumentData } from '@/types';
import { dict, Language } from '@/locales/dict';

// ... (Dropzone component remains same)
function Dropzone({
  label,
  onFilesAdded,
  files,
  onRemove,
  t
}: {
  label: string;
  onFilesAdded: (files: File[]) => void;
  files: File[];
  onRemove: (idx: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t?: any;
}) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  }, [onFilesAdded]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFilesAdded(Array.from(e.target.files));
    }
  };

  return (
    <div className={styles.uploadContainer}>
      <h3 style={{ marginBottom: 16 }}>{label}</h3>

      {files.length === 0 ? (
        <div
          className={`${styles.uploadArea} ${isDragActive ? styles.active : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById(`file-upload-${label}`)?.click()}
        >
          <UploadCloud className={styles.uploadIcon} />
          <div>
            <p style={{ fontWeight: 500, marginBottom: 4 }}>{t ? t.drag : 'Drag & drop'}</p>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>{t ? t.or : 'or'} {t ? t.browse : 'click to browse'}</p>
          </div>
          <input
            id={`file-upload-${label}`}
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleChange}
            style={{ display: "none" }}
          />
        </div>
      ) : (
        <div className={styles.fileList}>
          {files.map((file, idx) => (
            <div key={idx} className={styles.fileItem}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FileText size={20} className="text-muted" />
                <span style={{ fontSize: '0.9rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
              </div>
              <button className={styles.removeBtn} onClick={() => onRemove(idx)} aria-label="Remove">
                <X size={18} />
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '6px 12px' }}
              onClick={() => document.getElementById(`file-upload-${label}`)?.click()}
            >
              {t ? t.addAnother : 'Add another'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Language>('no');
  const t = dict[lang];

  const [agreementFiles, setAgreementFiles] = useState<File[]>([]);
  const [invoiceFiles, setInvoiceFiles] = useState<File[]>([]);

  const [provider, setProvider] = useState<LLMProvider>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('http://localhost:8000/v1');
  const [model, setModel] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem('ai_provider');
    const savedApiKey = localStorage.getItem('ai_api_key');
    const savedBaseUrl = localStorage.getItem('ai_base_url');
    const savedModel = localStorage.getItem('ai_model');

    if (savedProvider) setProvider(savedProvider as LLMProvider);
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedBaseUrl) setBaseUrl(savedBaseUrl);
    if (savedModel) setModel(savedModel);
  }, []);

  // Save settings on change
  useEffect(() => {
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('ai_api_key', apiKey);
    localStorage.setItem('ai_base_url', baseUrl);
    localStorage.setItem('ai_model', model);
  }, [provider, apiKey, baseUrl, model]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [results, setResults] = useState<ComparisonResult[] | null>(null);

  // Fetch models whenever provider, key, or baseUrl changes (debounced)
  useEffect(() => {
    let active = true;

    const fetchModels = async () => {
      // Basic validation
      if (provider === 'gemini' && !apiKey) return;
      if (provider === 'openai' && !baseUrl && !apiKey) return; // Need at least one for OpenAI format
      if (provider === 'vllm' && !baseUrl) return;

      setIsFetchingModels(true);
      try {
        const res = await fetch('/api/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, apiKey, baseUrl })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Fetch failed');
        }

        if (active && data.models) {
          setAvailableModels(data.models);
          if (!data.models.includes(model) && data.models.length > 0) {
            setModel(data.models[0]);
          }
        }
      } catch (err) {
        console.warn("Could not fetch models:", err);
        if (active) setAvailableModels([]); // Fallback to allowing manual typing
      } finally {
        if (active) setIsFetchingModels(false);
      }
    };

    const timer = setTimeout(fetchModels, 500); // debounce
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [provider, apiKey, baseUrl, model]);

  const extractDocuments = async (files: File[], type: 'agreement' | 'invoice'): Promise<DocumentData> => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('type', type);
    formData.append('provider', provider);
    if (model) formData.append('model', model);
    if (apiKey) formData.append('apiKey', apiKey);
    if (baseUrl && provider === 'vllm') formData.append('baseUrl', baseUrl);

    const res = await fetch('/api/extract', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to extract document');
    return data.data;
  };

  const handleStartComparison = async () => {
    setIsProcessing(true);
    setErrorMsg('');
    setResults(null);

    try {
      // Extract from both in parallel
      const [agreementData, invoiceData] = await Promise.all([
        extractDocuments(agreementFiles, 'agreement'),
        extractDocuments(invoiceFiles, 'invoice')
      ]);

      // Run comparison
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreementData, invoiceData })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to compare documents');

      setResults(data.results);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStatusBadge = (status: ComparisonResult['status']) => {
    switch (status) {
      case 'MATCH': return <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={16} /> {t.status.match}</span>;
      case 'OVERCHARGED': return <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 6 }}><XCircle size={16} /> {t.status.overcharged}</span>;
      case 'UNDERCHARGED': return <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={16} /> {t.status.undercharged}</span>;
      case 'NOT_IN_AGREEMENT': return <span style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}><Info size={16} /> {t.status.notInAgreement}</span>;
      case 'MISSING_IN_INVOICE': return <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><Info size={16} /> {t.status.missingInInvoice}</span>;
      default: return null;
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <span className="gradient-text">{t.title.pro}</span>{t.title.control}
          </h1>
          <p className={styles.subtitle}>{t.subtitle}</p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className={styles.settingsBtn}
            onClick={() => setLang(lang === 'no' ? 'en' : 'no')}
          >
            <Globe size={18} />
            {t.languageBtn}
          </button>
          <button
            className={styles.settingsBtn}
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={18} />
            {t.settingsBtn}
          </button>
        </div>
      </header>

      {isSettingsOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsSettingsOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{t.settingsModal.title}</h2>
              <button
                className={styles.removeBtn}
                onClick={() => setIsSettingsOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="input-label">{t.settingsModal.formatLabel}</label>
                  <select
                    className={styles.providerSelect}
                    style={{ width: '100%', marginTop: 4 }}
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as LLMProvider)}
                  >
                    <option value="openai">{t.settingsModal.openaiProxy}</option>
                    <option value="vllm">{t.settingsModal.vllm}</option>
                    <option value="gemini">{t.settingsModal.gemini}</option>
                  </select>
                </div>

                {provider === 'vllm' && (
                  <div>
                    <label className="input-label">{t.settingsModal.baseUrlVllmLabel}</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ marginTop: 4 }}
                      placeholder="http://localhost:8000/v1"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                    />
                  </div>
                )}

                {provider === 'openai' && (
                  <div>
                    <label className="input-label">{t.settingsModal.baseUrlOptional}</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ marginTop: 4 }}
                      placeholder="https://api.openai.com/v1"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="input-label">{provider === 'gemini' ? t.settingsModal.apiKeyLabelGemini : t.settingsModal.apiKeyLabelOther}</label>
                  <input
                    type="password"
                    className="input-field"
                    style={{ marginTop: 4 }}
                    placeholder={provider === 'vllm' || (provider === 'openai' && baseUrl) ? t.settingsModal.optionalLocal : t.settingsModal.enterKey}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label">{provider === 'gemini' ? t.settingsModal.modelLabelGemini : t.settingsModal.modelLabelOther}</label>
                    {isFetchingModels && <Loader2 size={12} className="animate-spin text-muted" />}
                  </div>

                  {availableModels.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      <select
                        className={styles.providerSelect}
                        value={availableModels.includes(model) ? model : 'custom'}
                        onChange={(e) => {
                          if (e.target.value !== 'custom') setModel(e.target.value);
                          else setModel('');
                        }}
                      >
                        {availableModels.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                        <option value="custom">{t.settingsModal.customModel}</option>
                      </select>

                      {!availableModels.includes(model) && (
                        <input
                          type="text"
                          className="input-field"
                          placeholder={t.settingsModal.typeModel}
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                        />
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="input-field"
                      style={{ marginTop: 4 }}
                      placeholder={provider === 'gemini' ? 'gemini-2.5-flash' : provider === 'openai' ? 'gpt-4o-mini' : t.settingsModal.typeModel}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    />
                  )}
                  {availableModels.length === 0 && !isFetchingModels && (
                    <p style={{ fontSize: '0.75rem', marginTop: 4 }} className="text-muted">
                      {provider === 'openai' && !baseUrl ? t.settingsModal.plessEnterValidGemini : t.settingsModal.plessEnterValidOther}
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-primary" onClick={() => setIsSettingsOpen(false)}>
                  {t.settingsModal.done}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!results && (
        <main className="glass-panel animate-fade-in" style={{ padding: '32px' }}>
          <div className={styles.grid}>
            <Dropzone
              label={t.agreementBox.title}
              files={agreementFiles}
              onFilesAdded={(files) => setAgreementFiles(prev => [...prev, ...files])}
              onRemove={(idx) => setAgreementFiles(prev => prev.filter((_, i) => i !== idx))}
              t={{ ...t.agreementBox, addAnother: t.addAnother }}
            />
            <Dropzone
              label={t.invoiceBox.title}
              files={invoiceFiles}
              onFilesAdded={(files) => setInvoiceFiles(prev => [...prev, ...files])}
              onRemove={(idx) => setInvoiceFiles(prev => prev.filter((_, i) => i !== idx))}
              t={{ ...t.invoiceBox, addAnother: t.addAnother }}
            />
          </div>

          <div className={styles.actionArea}>
            <button
              className={`btn btn-primary ${agreementFiles.length === 0 || invoiceFiles.length === 0 || isProcessing ? 'btn-disabled' : ''}`}
              style={{ padding: '14px 32px', fontSize: '1.05rem', marginTop: 24 }}
              onClick={handleStartComparison}
              disabled={agreementFiles.length === 0 || invoiceFiles.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {t.processing}
                </>
              ) : (
                <>
                  {t.compareBtn}
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
          {errorMsg && (
            <div style={{ marginTop: 24, padding: 16, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: 8, color: 'var(--error)' }}>
              <strong>Error:</strong> {errorMsg}
            </div>
          )}
        </main>
      )}

      {results && (
        <div className="glass-panel animate-fade-in" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{t.resultsTitle}</h2>
            <button className="btn btn-secondary" onClick={() => setResults(null)}>
              {t.newAnalysis}
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t.table.itemCol}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t.table.agreementPriceCol}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t.table.invoicePriceCol}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t.table.varianceCol}</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t.table.statusCol}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((res, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', ...(!res.isMatch ? { background: 'rgba(239, 68, 68, 0.03)' } : {}) }}>
                    <td style={{ padding: '16px' }}>{res.description}</td>
                    <td style={{ padding: '16px', fontFamily: 'monospace' }}>
                      {res.agreementPrice !== null ? `$${res.agreementPrice.toFixed(2)}` : '-'}
                    </td>
                    <td style={{ padding: '16px', fontFamily: 'monospace' }}>
                      {res.invoicePrice !== null ? `$${res.invoicePrice.toFixed(2)}` : '-'}
                    </td>
                    <td style={{ padding: '16px', fontFamily: 'monospace', color: res.variance && res.variance > 0 ? 'var(--error)' : (res.variance && res.variance < 0 ? 'var(--warning)' : 'inherit') }}>
                      {res.variance !== null ? `${res.variance > 0 ? '+' : ''}${res.variance.toFixed(2)}` : '-'}
                    </td>
                    <td style={{ padding: '16px' }}>{renderStatusBadge(res.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        {t.developedBy}
      </footer>
    </div>
  );
}
