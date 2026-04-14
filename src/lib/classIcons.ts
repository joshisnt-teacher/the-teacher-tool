import {
  Calculator,
  FlaskConical,
  BookOpen,
  Globe,
  Monitor,
  Palette,
  Dumbbell,
  Music,
  MessageCircle,
  Users,
  LucideIcon,
} from 'lucide-react';

export interface ClassIconConfig {
  icon: LucideIcon;
  bg: string;
  text: string;
}

export function getClassIconConfig(subject?: string | null): ClassIconConfig {
  const normalized = (subject || '').toLowerCase().trim();

  if (normalized.includes('math') || normalized.includes('algebra') || normalized.includes('geometry') || normalized.includes('calculus')) {
    return { icon: Calculator, bg: 'bg-blue-100', text: 'text-blue-700' };
  }

  if (normalized.includes('science') || normalized.includes('physics') || normalized.includes('chemistry') || normalized.includes('biology')) {
    return { icon: FlaskConical, bg: 'bg-emerald-100', text: 'text-emerald-700' };
  }

  if (normalized.includes('english') || normalized.includes('literacy') || normalized.includes('writing') || normalized.includes('reading')) {
    return { icon: BookOpen, bg: 'bg-amber-100', text: 'text-amber-700' };
  }

  if (
    normalized.includes('history') ||
    normalized.includes('geography') ||
    normalized.includes('hass') ||
    normalized.includes('social') ||
    normalized.includes('civics')
  ) {
    return { icon: Globe, bg: 'bg-indigo-100', text: 'text-indigo-700' };
  }

  if (
    normalized.includes('digital') ||
    normalized.includes('tech') ||
    normalized.includes('computing') ||
    normalized.includes('it') ||
    normalized.includes('programming') ||
    normalized.includes('coding')
  ) {
    return { icon: Monitor, bg: 'bg-violet-100', text: 'text-violet-700' };
  }

  if (normalized.includes('art') || normalized.includes('visual') || normalized.includes('design')) {
    return { icon: Palette, bg: 'bg-pink-100', text: 'text-pink-700' };
  }

  if (
    normalized.includes('pe') ||
    normalized.includes('physical') ||
    normalized.includes('sport') ||
    normalized.includes('health')
  ) {
    return { icon: Dumbbell, bg: 'bg-orange-100', text: 'text-orange-700' };
  }

  if (normalized.includes('music') || normalized.includes('drama') || normalized.includes('performing')) {
    return { icon: Music, bg: 'bg-rose-100', text: 'text-rose-700' };
  }

  if (normalized.includes('language') || normalized.includes('french') || normalized.includes('spanish') || normalized.includes('japanese') || normalized.includes('mandarin')) {
    return { icon: MessageCircle, bg: 'bg-cyan-100', text: 'text-cyan-700' };
  }

  return { icon: Users, bg: 'bg-slate-100', text: 'text-slate-700' };
}
