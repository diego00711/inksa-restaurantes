// Faixa sutil de anúncio/aviso no topo do Painel do Parceiro.
// Puxa banners com audience='parceiro' (mesmo sistema de banners do admin) e
// mostra uma linha discreta e dispensável. Só aparece quando há banner ativo
// e dentro da janela agendada — senão renderiza null (sem espaço vazio).
import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://inksa-auth-flask-dev.onrender.com';
const DISMISS_KEY = 'inksa_parceiro_banners_dispensados';
const DEFAULT_SECS = 7;

function getDismissed() {
  try {
    return JSON.parse(sessionStorage.getItem(DISMISS_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function SponsoredStrip() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const rotateRef = useRef(null);
  // A loja já sabe onde fica: o banner com alcance geográfico usa isso.
  const { profile } = useProfile();
  const lat = Number(profile?.latitude);
  const lng = Number(profile?.longitude);
  const temCoord = Number.isFinite(lat) && Number.isFinite(lng);

  // Carrega os banners do parceiro uma vez (público, sem auth).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        /* Manda a coordenada DA LOJA. O backend só mostra banner
           geolocalizado a quem está dentro do raio dele; sem lat/lng ele
           devolve apenas os nacionais, e um anunciante regional pagaria por
           zero exibições sem ninguém perceber. Mesmo defeito que o carrossel
           do app do cliente tinha. */
        const qs = new URLSearchParams({ audience: 'parceiro' });
        if (temCoord) { qs.set('lat', lat); qs.set('lng', lng); }
        const r = await fetch(`${API}/api/banners/?${qs}`);
        const d = await r.json();
        if (!alive) return;
        const dismissed = getDismissed();
        const list = (Array.isArray(d?.data) ? d.data : []).filter(b => !dismissed.includes(b.id));
        setItems(list);
      } catch {
        /* silencioso: faixa some se falhar */
      }
    })();
    return () => { alive = false; };
  }, [temCoord, lat, lng]);

  // Rotação suave quando há mais de um, respeitando duration_seconds de cada.
  useEffect(() => {
    clearTimeout(rotateRef.current);
    if (items.length <= 1) return;
    const secs = Number(items[idx]?.duration_seconds) || DEFAULT_SECS;
    rotateRef.current = setTimeout(() => {
      setIdx(i => (i + 1) % items.length);
    }, Math.max(3, secs) * 1000);
    return () => clearTimeout(rotateRef.current);
  }, [items, idx]);

  if (items.length === 0) return null;

  const current = items[idx % items.length];
  if (!current) return null;

  const dismiss = (e) => {
    e?.stopPropagation();
    const rest = items.filter(b => b.id !== current.id);
    try {
      const dismissed = getDismissed();
      sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...dismissed, current.id]));
    } catch { /* ignore */ }
    setIdx(0);
    setItems(rest);
  };

  const open = () => {
    const link = current.link_url;
    if (!link) return;
    if (/^https?:\/\//i.test(link)) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      navigate(link);
    }
  };

  const clickable = !!current.link_url;

  return (
    <div
      onClick={clickable ? open : undefined}
      className={`mx-3 sm:mx-0 mb-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm flex items-center gap-3 ${clickable ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
    >
      {current.image_url && (
        <img
          src={current.image_url}
          alt=""
          className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {current.is_sponsored && (
            <span className="text-[9px] uppercase tracking-wide text-amber-600 font-bold shrink-0">
              🏷️ Patrocinado
            </span>
          )}
          {current.title && (
            <p className="text-sm font-semibold text-gray-800 truncate">{current.title}</p>
          )}
        </div>
        {current.subtitle && (
          <p className="text-xs text-gray-500 truncate leading-snug">{current.subtitle}</p>
        )}
        {current.is_sponsored && current.sponsor_name && (
          <p className="text-[10px] text-gray-400 truncate">por {current.sponsor_name}</p>
        )}
      </div>
      {clickable && <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar"
        className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
