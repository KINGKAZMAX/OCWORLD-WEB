import { useState } from 'react';
import { useLang } from '@/hooks/useLang';
import ViewHeader from '@/components/ViewHeader';
import OCMark from '@/components/OCMark';
import { api } from '@/lib/api';

const OC_STYLE_OPTIONS = [
  { id: 'pixel',   zh: '像素风',   en: 'Pixel Art' },
  { id: 'anime',   zh: '二次元',   en: 'Anime' },
  { id: 'cyber',   zh: '赛博机械', en: 'Cyber Mech' },
  { id: 'figure',  zh: '3D 手办',  en: '3D Figure' },
  { id: 'comic',   zh: '漫画线稿', en: 'Comic Ink' },
  { id: 'arcade',  zh: '复古街机', en: 'Arcade' },
];

const DEFAULT_DESCRIPTION_ZH = '一个带红帽子的冒险少年，酷酷表情，战术护目镜，扎小马尾子，背景白色，像素风格，红色风衣，背包，随身异世界宠物，根据我的形象不断生成不同风格和服装，但色系一致，不要马丁鞋，穿平底 Nike 板鞋，长筒宽松的裤子';
const DEFAULT_DESCRIPTION_EN = 'A red-capped adventure boy, cool expression, tactical goggles, ponytail, white background, pixel style, red coat, backpack, companion pet from another world, generate different styles and outfits based on my image but keep the color scheme consistent, no Martin boots, wear flat Nike sneakers, loose long pants';

interface CreateOcViewProps {
  onCreated?: (dataUrl: string, description: string) => void;
}

export default function CreateOcView({ onCreated }: CreateOcViewProps) {
  const { t, lang } = useLang();
  const [description, setDescription] = useState(lang === 'en' ? DEFAULT_DESCRIPTION_EN : DEFAULT_DESCRIPTION_ZH);
  const [selectedStyle, setSelectedStyle] = useState('pixel');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim() || isGenerating) return;
    setIsGenerating(true);
    setError('');
    setConfirmed(false);
    try {
      const styleLabel = OC_STYLE_OPTIONS.find(s => s.id === selectedStyle);
      const prompt = buildPrompt(description, styleLabel?.[lang] || styleLabel?.zh || '');
      const res = await api.generateImage({ prompt, aspectRatio: '16:9' });
      setPreview(res.dataUrl);
    } catch (err: any) {
      setError(err.message || t('createOc.error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    if (!preview) return;
    setConfirmed(true);
    localStorage.setItem('ocworld.avatar', preview);
    localStorage.setItem('ocworld.avatarDesc', description);
    onCreated?.(preview, description);
  };

  const handleUseDefault = () => {
    setDescription(lang === 'en' ? DEFAULT_DESCRIPTION_EN : DEFAULT_DESCRIPTION_ZH);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <ViewHeader titleKey="createOc.title" subtitleKey="createOc.subtitle" />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '32px 56px 60px', maxWidth: 960, width: '100%', margin: '0 auto',
      }}>
        {/* Style selector */}
        <div style={{ marginBottom: 24 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-subtle)', letterSpacing: '0.22em', marginBottom: 12, textTransform: 'uppercase' }}>
            {t('createOc.style')}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {OC_STYLE_OPTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedStyle(s.id); setConfirmed(false); }}
                className={selectedStyle === s.id ? 'glass-strong' : 'glass-soft'}
                style={{
                  padding: '8px 16px', borderRadius: 99, fontSize: 13,
                  color: selectedStyle === s.id ? 'var(--accent)' : 'var(--ink-muted)',
                  border: `1px solid ${selectedStyle === s.id ? 'var(--accent)' : 'var(--line)'}`,
                  cursor: 'pointer', transition: 'all .15s',
                  fontWeight: selectedStyle === s.id ? 600 : 400,
                }}
              >
                {s[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Description + Preview grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Left: Input */}
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-subtle)', letterSpacing: '0.22em', marginBottom: 12, textTransform: 'uppercase' }}>
              {t('createOc.prompt')}
            </div>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setConfirmed(false); }}
              placeholder={t('createOc.placeholder')}
              style={{
                width: '100%', minHeight: 180, resize: 'vertical',
                border: '1px solid var(--line)', outline: 'none', borderRadius: 14,
                background: '#0A0A0A', color: 'var(--ink)',
                padding: '14px 16px', fontSize: 13, lineHeight: 1.65,
                transition: 'border-color .16s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim()}
                style={{
                  border: '1px solid var(--accent-deep)', borderRadius: 99,
                  background: isGenerating ? '#0A0A0A' : 'var(--accent)',
                  color: isGenerating ? 'var(--accent)' : '#FFFFFF',
                  cursor: isGenerating ? 'wait' : 'pointer',
                  padding: '10px 22px', fontSize: 13, fontWeight: 700,
                  opacity: !description.trim() ? 0.5 : 1,
                }}
              >
                {isGenerating ? t('createOc.generating') : t('createOc.generate')}
              </button>
              <button
                onClick={handleUseDefault}
                style={{
                  border: '1px solid var(--line)', borderRadius: 99,
                  background: 'transparent', color: 'var(--ink-muted)',
                  cursor: 'pointer', padding: '10px 18px', fontSize: 12,
                }}
              >
                {t('createOc.useDefault')}
              </button>
              <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.14em' }}>
                AI IMAGE · 16:9
              </span>
            </div>
            {error && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--accent-deep)' }}>{error}</div>
            )}
          </div>

          {/* Right: Preview */}
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-subtle)', letterSpacing: '0.22em', marginBottom: 12, textTransform: 'uppercase' }}>
              {t('createOc.preview')}
            </div>
            <div style={{
              position: 'relative', borderRadius: 16, border: '1px solid var(--line)',
              background: '#0A0A0A', aspectRatio: '16 / 9',
              display: 'grid', placeItems: 'center', overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(255,45,85,.15) inset',
            }}>
              {preview ? (
                <img
                  src={preview}
                  alt="Generated OC"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <OCMark scale={1.2} />
                  <div className="mono" style={{ marginTop: 12, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.16em' }}>
                    {isGenerating ? t('createOc.generating') : t('createOc.previewEmpty')}
                  </div>
                </div>
              )}
              {isGenerating && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
                        animation: `typing 1.2s ${i * 0.15}s ease-in-out infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm button */}
            {preview && !confirmed && (
              <button
                onClick={handleConfirm}
                style={{
                  width: '100%', marginTop: 12,
                  border: '1px solid var(--accent)', borderRadius: 99,
                  background: 'var(--accent)', color: '#FFFFFF',
                  cursor: 'pointer', padding: '10px 22px', fontSize: 13, fontWeight: 700,
                }}
              >
                {t('createOc.confirm')}
              </button>
            )}
            {confirmed && (
              <div style={{
                marginTop: 12, padding: '10px 16px', borderRadius: 99,
                border: '1px solid var(--accent)',
                background: 'rgba(255,77,109,0.08)',
                color: 'var(--accent)', fontSize: 13, fontWeight: 600, textAlign: 'center',
              }}>
                {t('createOc.confirmed')}
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="glass-soft" style={{
          padding: '14px 18px', borderRadius: 14,
        }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.18em', marginBottom: 8, textTransform: 'uppercase' }}>
            {t('createOc.tips')}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--ink-muted)' }}>
            {t('createOc.tipsBody')}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildPrompt(description: string, styleLabel: string): string {
  return `为 OCWORLD 生成一张 16:9 的原创 OC 全身角色概念图。
角色描述：${description}
风格：${styleLabel}
要求：
- 全身立绘，正面或 3/4 侧面
- 纯白或透明背景
- 高质量，细节丰富
- 适合作为桌面虚拟角色展示`;
}
