import React, { useState, useRef, useEffect } from 'react'
import { Clue } from '../types/game'
import { soundscape } from '../services/soundscape'

interface ForensicClueModalProps {
  clue: Clue
  onClose: () => void
  onAddDeduction?: (note: string) => void
}

type SpectrumMode = 'visible' | 'lumos_uv' | 'resonance'

interface ClueForensics {
  material: string
  classification: string
  visibleDetails: string
  uvDetails: string
  resonanceDetails: string
  hiddenRunes: string
  hotspot: { x: number; y: number; label: string }
}

const FORENSIC_PROFILES: Record<string, ClueForensics> = {
  clue_teacup: {
    material: 'Glazed Bone China porcelain with gilded rim',
    classification: 'Toxicological Vector / Poison Touchpoint',
    visibleDetails: 'Fine porcelain teacup, half-full of cold Earl Grey. Fine dark sediment settled at the ceramic base.',
    uvDetails: 'Brilliant turquoise fluorescence along the south rim where the drinker sipped, matching powdered Dreamroot residue.',
    resonanceDetails: 'Strong lethargic tranquility pulse. Spectral signature indicates the draught was stirred within the last 120 minutes.',
    hiddenRunes: 'Alchemical glyph ☿ (Mercury/Soporific) faintly glowing on the base.',
    hotspot: { x: 52, y: 68, label: 'Dreamroot Powder Deposit' }
  },
  clue_hourglass_pedestal: {
    material: 'Carved Northumbrian Granite with velvet lining',
    classification: 'Theft Locus / Chronomantic Mount',
    visibleDetails: 'Thick dust layers across the carved plinth. A sharp 14cm circular gap shows where the Hourglass sat undisturbed for decades.',
    uvDetails: 'Gloved thumbprint impressions on the front bevel with faint traces of alchemical Steadfast Wax.',
    resonanceDetails: 'Temporal dilation ripples. A residual micro-warp wave shows the artifact was lifted at approximately 10:14 PM.',
    hiddenRunes: 'Ouroboros serpent ring watermark in the dust.',
    hotspot: { x: 48, y: 46, label: '14cm Negative Dust Void' }
  },
  clue_candle_residue: {
    material: 'Hardened Steadfast Wax & Silver Pine Resin',
    classification: 'Enchantment Stabilizer / Smuggling Aid',
    visibleDetails: 'Dark olive green melted wax drips on the flagstones near the north window.',
    uvDetails: 'Radiates a high-intensity emerald phosphorescence under 365nm UV. High density of alchemical silver pine resin.',
    resonanceDetails: 'Dampening ward vibrations. Specifically engineered to silence the acoustic chime of temporal artifacts during transit.',
    hiddenRunes: 'Apprentice workshop crest stamped into the cooling wax crust.',
    hotspot: { x: 44, y: 56, label: 'Emerald Phosphorescent Wax Pool' }
  },
  clue_broken_lock: {
    material: 'Forged Brass Tumbler Mechanism',
    classification: 'Forcible Entry / Burglary Trace',
    visibleDetails: 'The cabinet clasp has been sheared open from the side with a lever tool rather than an unlocking spell.',
    uvDetails: 'Black charcoal dust transfers from an apprentice work glove; fine woolen robe fibers caught in the bolt.',
    resonanceDetails: 'Complete absence of Alohomora magical resonance — confirms a strictly physical tool was used to evade detection wards.',
    hiddenRunes: 'No magical ward triggers were tripped.',
    hotspot: { x: 50, y: 40, label: 'Mechanical Shear Fractures' }
  },
  clue_muddy_boots: {
    material: 'Hydrated Peat Soil & Volcanic Greenhouse Loam',
    classification: 'Locational Vector / Movement Tracking',
    visibleDetails: 'A sequence of wet boot impressions leading from the corridor towards the spiral Bell Tower staircase.',
    uvDetails: 'Pale amber luminescent spots indicative of Mandrake root compost and silver-leaf fertiliser found only in the Herbarium.',
    resonanceDetails: 'Residual kinetic agitation. Rapid pace and irregular stride length indicate panicked flight.',
    hiddenRunes: 'Tread pattern matches standard Year-4 Academy apprentice boots.',
    hotspot: { x: 55, y: 62, label: 'Herbarium Greenhouse Loam Trace' }
  },
  clue_empty_vial: {
    material: 'Blown Bohemian Glass with Cork Stopper',
    classification: 'Apothecary Container / Direct Corroboration',
    visibleDetails: 'Discarded glass bottle embossed with: "PATEL & SONS — DRIED DREAMROOT POWDER".',
    uvDetails: 'White and chalky residue coats the inner neck of the vial, showing it was recently uncorked and emptied.',
    resonanceDetails: 'Residual biometrical aether of Corvin Ashwick on the glass neck and lip.',
    hiddenRunes: 'Apothecary batch mark: No. 419-B.',
    hotspot: { x: 50, y: 50, label: 'Embossed Apothecary Batch Stamp' }
  },
  clue_torn_page: {
    material: 'Vellum Parchment with Oak Gall Ink',
    classification: 'Theoretical Research / Motive Document',
    visibleDetails: 'Torn section of a page detailing rituals for rewinding botched alchemical transmutations using chronomantic focus items.',
    uvDetails: 'Marginal scribbles in hurried graphite: "Only three minutes needed. Restore the alembic before Thorne wakes."',
    resonanceDetails: 'Intense panic and acute emotional distress captured in the electrostatic grain of the vellum.',
    hiddenRunes: 'Diagram of the Veiled Hourglass of Ouroboros.',
    hotspot: { x: 60, y: 35, label: 'Handwritten Marginal Confession' }
  }
}

export const ForensicClueModal: React.FC<ForensicClueModalProps> = ({
  clue,
  onClose,
  onAddDeduction
}) => {
  const [spectrum, setSpectrum] = useState<SpectrumMode>('visible')
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [isMagnifying, setIsMagnifying] = useState<boolean>(true)
  const [deductionNote, setDeductionNote] = useState<string>('')
  const [noteSaved, setNoteSaved] = useState<boolean>(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  const profile = FORENSIC_PROFILES[clue.id] || {
    material: 'Enchanted physical artifact',
    classification: 'General Arcane Evidence',
    visibleDetails: clue.description,
    uvDetails: 'Trace luminescence detected upon targeted illumination.',
    resonanceDetails: 'Faint residual magical field detected on the object.',
    hiddenRunes: 'No distinctive runes deciphered.',
    hotspot: { x: 50, y: 50, label: 'Artifact Focal Point' }
  }

  useEffect(() => {
    soundscape.playParchment()
  }, [])

  const handleSpectrumChange = (mode: SpectrumMode) => {
    setSpectrum(mode)
    soundscape.playSpectrumShift()
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setMousePos({ x, y })
  }

  const handleSaveDeduction = () => {
    if (!deductionNote.trim()) return
    if (onAddDeduction) {
      onAddDeduction(`[Forensic Exam - ${clue.title} (${spectrum.toUpperCase()})]: ${deductionNote}`)
    }
    setNoteSaved(true)
    soundscape.playClueDiscovered()
    setTimeout(() => setNoteSaved(false), 3000)
    setDeductionNote('')
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(4, 5, 12, 0.88)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 150,
      padding: '1.25rem'
    }} onClick={onClose}>
      <div
        className="arcane-panel has-corners"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #0e1122 0%, #070810 100%)',
          border: '1px solid var(--gold-border)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.85), 0 0 40px rgba(212,175,55,0.12)',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid var(--gold-border)',
          paddingBottom: '1rem'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.8rem',
              color: 'var(--gold-pure)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase'
            }}>
              <span>🔬 ARTIFACT FORENSIC EXAMINATION</span>
              <span>•</span>
              <span className="badge-gold">{profile.classification}</span>
            </div>
            <h2 style={{
              margin: '0.35rem 0 0 0',
              fontFamily: 'var(--font-heading)',
              fontSize: '1.75rem',
              color: '#fff',
              letterSpacing: '0.04em'
            }}>
              {clue.title}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              Material Composition: <strong style={{ color: 'var(--parchment-ink)' }}>{profile.material}</strong>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-arcane btn-arcane--ghost"
            style={{ fontSize: '1.1rem', padding: '0.4rem 0.8rem', minHeight: 'unset' }}
          >
            ✕ Close
          </button>
        </div>

        {/* Multi-Spectrum Mode Selector */}
        <div style={{
          display: 'flex',
          gap: '0.65rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.3)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleSpectrumChange('visible')}
              className={`nav-pill ${spectrum === 'visible' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>🌕</span>
              <span>Visible Light (White)</span>
            </button>
            <button
              onClick={() => handleSpectrumChange('lumos_uv')}
              className={`nav-pill ${spectrum === 'lumos_uv' ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderColor: spectrum === 'lumos_uv' ? '#38bdf8' : undefined
              }}
            >
              <span>🔮</span>
              <span>Lumos UV-A (365nm)</span>
            </button>
            <button
              onClick={() => handleSpectrumChange('resonance')}
              className={`nav-pill ${spectrum === 'resonance' ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderColor: spectrum === 'resonance' ? '#a855f7' : undefined
              }}
            >
              <span>👁️</span>
              <span>Aura Resonance</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setIsMagnifying(!isMagnifying)}
              className={`nav-pill ${isMagnifying ? 'active' : ''}`}
              style={{ fontSize: '0.8rem' }}
            >
              🔍 Loupe Lens {isMagnifying ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Forensic Artifact Canvas with Magnifier */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(280px, 1fr)', gap: '1.25rem' }}>
          {/* Artifact Visualizer Stage */}
          <div
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setMousePos(null)}
            style={{
              position: 'relative',
              height: '360px',
              borderRadius: '8px',
              border: `2px solid ${
                spectrum === 'lumos_uv' ? '#0284c7' :
                spectrum === 'resonance' ? '#7e22ce' : 'var(--gold-border)'
              }`,
              background: spectrum === 'lumos_uv'
                ? 'radial-gradient(circle at center, #07192f 0%, #020712 100%)'
                : spectrum === 'resonance'
                ? 'radial-gradient(circle at center, #1e0933 0%, #06020c 100%)'
                : 'radial-gradient(circle at center, #181926 0%, #090a12 100%)',
              overflow: 'hidden',
              cursor: isMagnifying ? 'crosshair' : 'default',
              boxShadow: spectrum === 'lumos_uv'
                ? 'inset 0 0 50px rgba(56,189,248,0.2)'
                : spectrum === 'resonance'
                ? 'inset 0 0 50px rgba(168,85,247,0.2)'
                : 'inset 0 0 30px rgba(0,0,0,0.8)'
            }}
          >
            {/* Visual Representation Graphic */}
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              {/* Central Symbolic Artifact Render */}
              <div style={{
                fontSize: '5.5rem',
                filter: spectrum === 'lumos_uv'
                  ? 'drop-shadow(0 0 20px #38bdf8)'
                  : spectrum === 'resonance'
                  ? 'drop-shadow(0 0 24px #c084fc)'
                  : 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
                transition: 'filter 0.3s ease'
              }}>
                {clue.id === 'clue_teacup' ? '🍵' :
                 clue.id === 'clue_hourglass_pedestal' ? '🏛️' :
                 clue.id === 'clue_candle_residue' ? '🕯️' :
                 clue.id === 'clue_broken_lock' ? '🔒' :
                 clue.id === 'clue_muddy_boots' ? '👢' :
                 clue.id === 'clue_empty_vial' ? '🧪' :
                 clue.id === 'clue_torn_page' ? '📜' : '🔍'}
              </div>

              {/* Spectrum Trace Overlay */}
              <div style={{
                marginTop: '1rem',
                padding: '0.4rem 0.9rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                letterSpacing: '0.04em',
                background: spectrum === 'lumos_uv'
                  ? 'rgba(14, 165, 233, 0.15)'
                  : spectrum === 'resonance'
                  ? 'rgba(168, 85, 247, 0.15)'
                  : 'rgba(212, 175, 55, 0.1)',
                border: `1px solid ${
                  spectrum === 'lumos_uv' ? '#38bdf8' :
                  spectrum === 'resonance' ? '#c084fc' : 'var(--gold-border)'
                }`,
                color: spectrum === 'lumos_uv' ? '#7dd3fc' : spectrum === 'resonance' ? '#e9d5ff' : 'var(--gold-pure)'
              }}>
                {spectrum === 'visible' && 'Visible Spectrum Analysis: Macro Surface Only'}
                {spectrum === 'lumos_uv' && '✨ Lumos Phosphorescence: Alchemical Traces Highlighted'}
                {spectrum === 'resonance' && '🔮 Arcane Frequency: Temporal & Intent Waveforms Detected'}
              </div>

              {/* Dynamic Hotspot Marker */}
              <div style={{
                position: 'absolute',
                left: `${profile.hotspot.x}%`,
                top: `${profile.hotspot.y}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                pointerEvents: 'none'
              }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: '2px solid #fff',
                  boxShadow: '0 0 12px #38bdf8',
                  background: 'rgba(56, 189, 248, 0.6)',
                  animation: 'pulse 1.8s infinite'
                }} />
                <span style={{
                  fontSize: '0.75rem',
                  color: '#fff',
                  background: 'rgba(0,0,0,0.75)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  {profile.hotspot.label}
                </span>
              </div>
            </div>

            {/* Interactive Magnifying Loupe Lens */}
            {isMagnifying && mousePos && (
              <div style={{
                position: 'absolute',
                left: `${mousePos.x}%`,
                top: `${mousePos.y}%`,
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '3px solid #d4af37',
                boxShadow: '0 0 25px rgba(0,0,0,0.9), inset 0 0 20px rgba(212,175,55,0.3)',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                backdropFilter: 'contrast(1.4) brightness(1.2) saturate(1.3)',
                WebkitBackdropFilter: 'contrast(1.4) brightness(1.2) saturate(1.3)',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Loupe Crosshairs */}
                <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(212,175,55,0.5)' }} />
                <div style={{ position: 'absolute', height: '100%', width: '1px', background: 'rgba(212,175,55,0.5)' }} />
                
                {/* Loupe Center Optical Ring */}
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1px dashed rgba(255,255,255,0.6)',
                  zIndex: 2
                }} />

                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  color: '#fef08a',
                  background: 'rgba(0,0,0,0.8)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  zIndex: 2
                }}>
                  2.5x ZOOM
                </div>
              </div>
            )}

            {/* Stage HUD Telemetry readout */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '12px',
              fontFamily: 'monospace',
              fontSize: '0.72rem',
              color: 'var(--color-text-secondary)',
              background: 'rgba(0,0,0,0.6)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              COORD: X:{mousePos ? mousePos.x.toFixed(1) : '50.0'}% Y:{mousePos ? mousePos.y.toFixed(1) : '50.0'}% | OPTIC: 365nm
            </div>
          </div>

          {/* Forensic Diagnostic Findings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="arcane-panel" style={{
              padding: '1.1rem',
              background: 'rgba(0,0,0,0.35)',
              borderLeft: `4px solid ${
                spectrum === 'lumos_uv' ? '#38bdf8' :
                spectrum === 'resonance' ? '#c084fc' : 'var(--gold-pure)'
              }`
            }}>
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--gold-pure)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.35rem'
              }}>
                Current Spectrum Findings
              </div>
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                lineHeight: 1.55,
                color: '#fff'
              }}>
                {spectrum === 'visible' && profile.visibleDetails}
                {spectrum === 'lumos_uv' && profile.uvDetails}
                {spectrum === 'resonance' && profile.resonanceDetails}
              </div>
            </div>

            {/* Arcane Sigil / Occult Cipher Inscription */}
            <div className="arcane-panel" style={{ padding: '0.9rem', background: 'rgba(15, 23, 42, 0.4)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                Deciphered Markings & Glyphs
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#e2e8f0',
                fontStyle: 'italic',
                marginTop: '0.25rem',
                fontFamily: 'var(--font-heading)'
              }}>
                "{profile.hiddenRunes}"
              </div>
            </div>

            {/* Deduction Note Recorder */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--gold-pure)' }}>
                ✍️ Record Forensic Finding in Pensieve:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Record an observation (e.g. powder matches Dreamroot vial)..."
                  value={deductionNote}
                  onChange={e => setDeductionNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveDeduction()}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--gold-border)',
                    borderRadius: '4px',
                    padding: '0.5rem 0.75rem',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
                <button
                  onClick={handleSaveDeduction}
                  className="btn-arcane btn-arcane--primary"
                  style={{ minHeight: 'unset', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                >
                  Save
                </button>
              </div>
              {noteSaved && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', marginTop: '0.2rem' }}>
                  ✓ Observation preserved in Pensieve memory stream.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
