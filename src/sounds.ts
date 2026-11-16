export type SoundId =
  | 'none'
  | 'chime'
  | 'bell'
  | 'digital'
  | 'gong'
  | 'marimba'
  | 'arcade'
  | 'kalimba'
  | 'bowl'
  | 'harp'
  | 'birds'
  | 'drops'
  | 'doorbell'

export interface SoundSettings {
  id: SoundId
  /** Volume entre 0 et 1. */
  volume: number
}

export const DEFAULT_SOUND: SoundSettings = { id: 'chime', volume: 0.6 }

export const SOUNDS: { id: SoundId; label: string; description: string }[] = [
  { id: 'chime', label: 'Carillon', description: 'Notes cristallines en cascade' },
  { id: 'bell', label: 'Cloche', description: 'Cloche de bureau, quatre coups' },
  { id: 'digital', label: 'Réveil', description: 'Bips de réveil digital' },
  { id: 'gong', label: 'Gong', description: 'Grave et méditatif' },
  { id: 'marimba', label: 'Marimba', description: 'Petite mélodie boisée' },
  { id: 'arcade', label: 'Arcade', description: 'Jingle de victoire 8-bit' },
  { id: 'kalimba', label: 'Kalimba', description: 'Piano à pouces, tout doux' },
  { id: 'bowl', label: 'Bol tibétain', description: 'Longue résonance apaisante' },
  { id: 'harp', label: 'Harpe', description: 'Glissando féerique' },
  { id: 'birds', label: 'Oiseaux', description: 'Gazouillis printanier' },
  { id: 'drops', label: 'Gouttes', description: "Gouttes d'eau qui tombent" },
  { id: 'doorbell', label: 'Sonnette', description: 'Ding-dong classique' },
  { id: 'none', label: 'Silencieux', description: 'Aucun son' },
]

let ctx: AudioContext | null = null
/** Bus de sortie du son en cours, pour pouvoir l'interrompre. */
let current: GainNode | null = null

function getContext() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/**
 * À appeler lors d'une interaction utilisateur (ex. clic sur Start) :
 * les navigateurs bloquent l'audio tant que la page n'a pas reçu de geste.
 */
export function unlockAudio() {
  try {
    getContext()
  } catch {
    /* audio non disponible */
  }
}

/** Coupe le son en cours avec un court fondu. */
export function stopSound() {
  if (!ctx || !current) return
  const bus = current
  current = null
  const now = ctx.currentTime
  bus.gain.cancelScheduledValues(now)
  bus.gain.setValueAtTime(bus.gain.value, now)
  bus.gain.linearRampToValueAtTime(0, now + 0.08)
  setTimeout(() => bus.disconnect(), 150)
}

interface ToneOptions {
  freq: number
  start: number
  duration: number
  type?: OscillatorType
  gain?: number
  attack?: number
  /** Fréquence d'arrivée pour un glissando. */
  slideTo?: number
}

function tone(ac: AudioContext, out: AudioNode, o: ToneOptions) {
  const t0 = ac.currentTime + o.start
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.freq, t0)
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + o.duration)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(o.gain ?? 0.3, t0 + (o.attack ?? 0.01))
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.duration)
  osc.connect(g).connect(out)
  osc.start(t0)
  osc.stop(t0 + o.duration + 0.05)
}

/** Son « inharmonique » type cloche : somme de partiels qui décroissent. */
function strike(ac: AudioContext, out: AudioNode, base: number, start: number, decay: number) {
  ;[
    [1, 0.35],
    [2.0, 0.18],
    [2.76, 0.12],
    [5.4, 0.06],
  ].forEach(([ratio, gain], i) =>
    tone(ac, out, { freq: base * ratio, start, duration: decay / (1 + i * 0.6), gain, attack: 0.005 }),
  )
}

// Notes (Hz)
const C4 = 261.63, E4 = 329.63, G4 = 392, A4 = 440, B4 = 493.88
const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880
const B5 = 987.77, C6 = 1046.5, D6 = 1174.66, E6 = 1318.51, G6 = 1567.98, A6 = 1760
const D4 = 293.66

/** Chaque lecteur retourne la durée totale du son, en secondes. */
const PLAYERS: Record<Exclude<SoundId, 'none'>, (ac: AudioContext, out: AudioNode) => number> = {
  // ~5 s : cascade montante puis descendante, deux fois, avec une note finale qui résonne
  chime: (ac, out) => {
    const phrase = [E5, G5, B5, E6, B5, G5]
    for (let rep = 0; rep < 2; rep++) {
      phrase.forEach((freq, i) =>
        tone(ac, out, { freq, start: rep * 1.6 + i * 0.22, duration: 0.9, attack: 0.02, gain: 0.25 }),
      )
    }
    tone(ac, out, { freq: E5, start: 3.3, duration: 2.2, attack: 0.02, gain: 0.3 })
    tone(ac, out, { freq: B5, start: 3.3, duration: 2.0, attack: 0.02, gain: 0.15 })
    return 5.5
  },

  // ~5,5 s : quatre coups de cloche, le dernier qui résonne longtemps
  bell: (ac, out) => {
    ;[0, 0.7, 1.4].forEach((t) => strike(ac, out, A5, t, 1.4))
    strike(ac, out, A5, 2.4, 3.2)
    return 5.6
  },

  // ~5 s : bips de réveil en rafales, cinq fois
  digital: (ac, out) => {
    for (let group = 0; group < 5; group++) {
      for (let beep = 0; beep < 4; beep++) {
        tone(ac, out, {
          freq: 2000,
          start: group * 1.0 + beep * 0.13,
          duration: 0.07,
          type: 'square',
          gain: 0.12,
          attack: 0.002,
        })
      }
    }
    return 5
  },

  // ~7 s : deux coups de gong graves qui se superposent
  gong: (ac, out) => {
    strike(ac, out, 110, 0, 5)
    tone(ac, out, { freq: 55, start: 0, duration: 4, gain: 0.35, attack: 0.04 })
    strike(ac, out, 98, 2.5, 4.5)
    tone(ac, out, { freq: 49, start: 2.5, duration: 4, gain: 0.3, attack: 0.04 })
    return 7
  },

  // ~4,5 s : petite mélodie
  marimba: (ac, out) => {
    const melody: [number, number][] = [
      [C5, 0], [E5, 0.2], [G5, 0.4], [C6, 0.6],
      [A5, 1.0], [G5, 1.2], [E5, 1.4], [G5, 1.6],
      [F5, 2.0], [D5, 2.2], [B4, 2.4], [D5, 2.6],
      [C5, 3.0], [G4, 3.0], [E4, 3.0], [C4, 3.0],
    ]
    melody.forEach(([freq, start], i) =>
      tone(ac, out, {
        freq,
        start,
        duration: i >= 12 ? 1.4 : 0.5,
        type: 'triangle',
        gain: i >= 12 ? 0.22 : 0.4,
        attack: 0.004,
      }),
    )
    // basse discrète
    ;[[C4, 0], [A4 / 2, 1.0], [G4 / 2, 2.0]].forEach(([freq, start]) =>
      tone(ac, out, { freq, start, duration: 0.9, type: 'triangle', gain: 0.2, attack: 0.004 }),
    )
    return 4.5
  },

  // ~4 s : jingle de victoire
  arcade: (ac, out) => {
    const sq = (freq: number, start: number, duration: number, slideTo?: number) =>
      tone(ac, out, { freq, start, duration, slideTo, type: 'square', gain: 0.1, attack: 0.002 })

    ;[G4, C5, E5, G5, C6, E6].forEach((f, i) => sq(f, i * 0.08, 0.09))
    sq(G6, 0.5, 0.3)
    ;[E5, G5, A5, G5, E5, G5].forEach((f, i) => sq(f, 1.0 + i * 0.15, 0.13))
    sq(C6, 1.95, 0.25)
    sq(D5, 2.3, 0.13)
    sq(E5, 2.45, 0.13)
    sq(C5, 2.6, 0.9)
    sq(C6, 2.6, 0.9, G6)
    return 3.6
  },

  // ~5 s : lames métalliques pincées, gamme pentatonique
  kalimba: (ac, out) => {
    const pluck = (freq: number, start: number) => {
      tone(ac, out, { freq, start, duration: 1.4, gain: 0.35, attack: 0.003 })
      tone(ac, out, { freq: freq * 5.4, start, duration: 0.15, gain: 0.06, attack: 0.002 })
    }
    const melody: [number, number][] = [
      [C5, 0], [E5, 0.25], [G5, 0.5], [A5, 0.75], [G5, 1.0], [E5, 1.25],
      [D5, 1.75], [E5, 2.0], [G5, 2.25], [C6, 2.5], [A5, 2.9], [G5, 3.3],
    ]
    melody.forEach(([f, t]) => pluck(f, t))
    pluck(C5, 3.7)
    pluck(G5, 3.7)
    return 5.2
  },

  // ~8 s : deux fréquences très proches qui « battent », comme un vrai bol chantant
  bowl: (ac, out) => {
    ;[
      [220, 0.25],
      [221.2, 0.2],
      [597, 0.08],
      [599.5, 0.06],
      [1083, 0.03],
    ].forEach(([freq, gain]) => tone(ac, out, { freq, start: 0, duration: 8, gain, attack: 0.02 }))
    return 8
  },

  // ~5 s : glissando montant sur deux octaves puis accord final
  harp: (ac, out) => {
    const notes = [C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6, D6, E6, G6, A6]
    notes.forEach((freq, i) =>
      tone(ac, out, { freq, start: i * 0.06, duration: 2.2, type: 'triangle', gain: 0.18, attack: 0.004 }),
    )
    ;[C5, E5, G5, C6].forEach((freq, i) =>
      tone(ac, out, { freq, start: 1.6 + i * 0.09, duration: 3.2, type: 'triangle', gain: 0.2, attack: 0.004 }),
    )
    return 5
  },

  // ~4,5 s : gazouillis (glissandos rapides dans les aigus)
  birds: (ac, out) => {
    const chirp = (start: number, from: number, to: number, duration = 0.09) =>
      tone(ac, out, { freq: from, slideTo: to, start, duration, gain: 0.18, attack: 0.01 })
    ;[0, 0.14, 0.28].forEach((t) => chirp(t, 2800, 4200))
    chirp(0.6, 3600, 2400, 0.25)
    ;[1.2, 1.3, 1.4, 1.5, 1.6].forEach((t) => chirp(t, 3200, 3900, 0.07))
    chirp(2.1, 2400, 3800, 0.18)
    chirp(2.35, 3800, 2600, 0.18)
    ;[3.0, 3.14, 3.28].forEach((t) => chirp(t, 3000, 4500))
    chirp(3.6, 4000, 2800, 0.35)
    return 4.5
  },

  // ~4 s : gouttes d'eau irrégulières (glissando rapide vers l'aigu)
  drops: (ac, out) => {
    const drops: [number, number][] = [
      [0, 900], [0.35, 1250], [0.55, 800], [1.1, 1500], [1.4, 1000],
      [1.9, 1300], [2.05, 850], [2.6, 1150], [3.0, 1600], [3.3, 950],
    ]
    drops.forEach(([start, freq]) =>
      tone(ac, out, { freq, slideTo: freq * 2.2, start, duration: 0.12, gain: 0.3, attack: 0.003 }),
    )
    return 4
  },

  // ~5 s : ding-dong, deux fois
  doorbell: (ac, out) => {
    const chime = (freq: number, start: number) => {
      tone(ac, out, { freq, start, duration: 2, gain: 0.3, attack: 0.005 })
      tone(ac, out, { freq: freq * 2, start, duration: 0.8, gain: 0.08, attack: 0.005 })
    }
    chime(E5, 0)
    chime(C5, 0.6)
    chime(E5, 2.0)
    chime(C5, 2.6)
    return 5
  },
}

export function playSound({ id, volume }: SoundSettings) {
  stopSound()
  if (id === 'none' || volume <= 0) return
  try {
    const ac = getContext()
    const bus = ac.createGain()
    bus.gain.value = volume
    bus.connect(ac.destination)
    current = bus
    const duration = PLAYERS[id](ac, bus)
    // Libère le bus une fois le son terminé
    setTimeout(() => {
      if (current === bus) current = null
      bus.disconnect()
    }, (duration + 0.5) * 1000)
  } catch {
    /* audio non disponible */
  }
}
