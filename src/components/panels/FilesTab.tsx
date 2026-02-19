'use client';

import { useState, useEffect } from 'react';
import { Agent, RepoFile } from '@/types/agent';

export default function FilesTab({ agent }: { agent: Agent }) {
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [path, setPath] = useState('');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFiles = (dirPath: string) => {
    setLoading(true);
    setFileContent(null);
    setViewingFile('');
    fetch(`/api/agents/${agent.id}/repo/files?path=${encodeURIComponent(dirPath)}&mode=list`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.files) {
          setFiles(data.files);
          setPath(dirPath);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchFileContent = (filePath: string) => {
    setLoading(true);
    fetch(`/api/agents/${agent.id}/repo/files?path=${encodeURIComponent(filePath)}&mode=content`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setFileContent(data.content);
          setViewingFile(filePath);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFiles('');
  }, [agent.id]);

  const navigateUp = () => {
    if (viewingFile) {
      setFileContent(null);
      setViewingFile('');
      return;
    }
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    fetchFiles(parts.join('/'));
  };

  const handleClick = (file: RepoFile) => {
    if (file.type === 'dir') {
      fetchFiles(file.path);
    } else {
      fetchFileContent(file.path);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Breadcrumb segments
  const segments = path ? path.split('/').filter(Boolean) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border/60 bg-bg-card/20 text-[10px] font-mono">
        <button
          onClick={() => { if (viewingFile) { setFileContent(null); setViewingFile(''); } else fetchFiles(''); }}
          className="text-accent hover:text-accent/80 cursor-pointer"
        >
          root
        </button>
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-text-dim/40">/</span>
            <button
              onClick={() => fetchFiles(segments.slice(0, i + 1).join('/'))}
              className="text-accent hover:text-accent/80 cursor-pointer"
            >
              {seg}
            </button>
          </span>
        ))}
        {viewingFile && (
          <span className="flex items-center gap-1">
            <span className="text-text-dim/40">/</span>
            <span className="text-text">{viewingFile.split('/').pop()}</span>
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-full text-text-dim text-xs">
          Loading...
        </div>
      )}

      {/* File content viewer */}
      {!loading && fileContent !== null && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border/40">
            <button
              onClick={navigateUp}
              className="text-[10px] text-accent hover:text-accent/80 cursor-pointer"
            >
              Back
            </button>
            <span className="text-[10px] text-text-dim font-mono">{viewingFile}</span>
          </div>
          <div className="flex-1 overflow-auto bg-[#0d0d14] p-3">
            <pre className="font-mono text-[10px] leading-[1.6] text-text/90">
              {fileContent.split('\n').map((line, i) => (
                <div key={i} className="flex">
                  <span className="text-text-dim/30 select-none w-8 text-right mr-3 shrink-0">{i + 1}</span>
                  <span className="whitespace-pre-wrap break-all">{line}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      )}

      {/* Directory listing */}
      {!loading && fileContent === null && (
        <div className="flex-1 overflow-y-auto">
          {(path || viewingFile) && (
            <button
              onClick={navigateUp}
              className="flex items-center gap-2 w-full px-4 py-2 text-[11px] text-accent hover:bg-bg-card/40 cursor-pointer border-b border-border/20"
            >
              <span className="text-[10px]">..</span>
              <span>Go up</span>
            </button>
          )}
          {files.length === 0 && (
            <div className="text-text-dim text-[11px] py-4 text-center">Empty directory</div>
          )}
          {files.map(file => (
            <button
              key={file.path}
              onClick={() => handleClick(file)}
              className="flex items-center gap-2.5 w-full px-4 py-1.5 text-left hover:bg-bg-card/40 cursor-pointer border-b border-border/10 transition-colors"
            >
              <span className={`text-[11px] shrink-0 ${file.type === 'dir' ? 'text-accent' : 'text-text-dim'}`}>
                {file.type === 'dir' ? '\uD83D\uDCC1' : '\uD83D\uDCC4'}
              </span>
              <span className={`text-[11px] flex-1 truncate font-mono ${file.type === 'dir' ? 'text-text font-medium' : 'text-text/80'}`}>
                {file.name}
              </span>
              {file.type === 'file' && file.size > 0 && (
                <span className="text-[9px] text-text-dim/50 shrink-0">{formatSize(file.size)}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
