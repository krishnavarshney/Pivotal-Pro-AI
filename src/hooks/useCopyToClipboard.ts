import { useState, useCallback } from 'react';

type CopyStatus = 'idle' | 'success';

export function useCopyToClipboard(): [CopyStatus, (text: string) => void] {
  const [status, setStatus] = useState<CopyStatus>('idle');

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    });
  }, []);

  return [status, copy];
}
