import { SCORE } from './constants';
import type { Spot } from './types';

export interface ScoreBreakdown {
  positionScore: number;
  carScore: number;
  rankScore: number;
  spotScore: number;
  gengsiScore: number;
  total: number;
}

export function carScore(carRank: number): number {
  if (carRank < 0) return 0;
  return SCORE.car[carRank] ?? 0;
}

export function rankScore(rank: number): number {
  if (rank <= 1) return SCORE.rank.first;
  if (rank === 2) return SCORE.rank.second;
  if (rank === 3) return SCORE.rank.third;
  return SCORE.rank.rest;
}

export function spotScore(spot: Spot | null): number {
  return spot ? SCORE.spot[spot] : 0;
}

export function computeScore(
  carRank: number,
  rank: number,
  spot: Spot | null,
  gengsi: number,
): ScoreBreakdown {
  const car = carScore(carRank);
  const order = rankScore(rank);
  const place = spotScore(spot);
  const positionScore = car + order + place;
  const gengsiScore = Math.round(Math.max(0, gengsi) * SCORE.gengsiMultiplier);
  return {
    positionScore,
    carScore: car,
    rankScore: order,
    spotScore: place,
    gengsiScore,
    total: Math.min(SCORE.max, positionScore + gengsiScore),
  };
}

export function spotLabel(spot: Spot | null): string {
  switch (spot) {
    case 'seat':
      return 'Kursi dekat pintu';
    case 'pole':
      return 'Pegangan tiang';
    case 'door':
      return 'Berdiri di pintu';
    case 'deep':
      return 'Terdesak ke dalam';
    default:
      return 'Tidak dapat tempat';
  }
}

export function carLabel(carRank: number): string {
  if (carRank === 0) return 'Gerbong depan';
  if (carRank === 1) return 'Gerbong tengah';
  if (carRank === 2) return 'Gerbong belakang';
  return 'Tidak masuk';
}

export function resultMessage(carRank: number, rank: number, spot: Spot | null): string {
  if (carRank === 0 && rank === 1) {
    if (spot === 'seat') return 'Kursi dekat pintu. Posisi paling depan, paling siap turun.';
    return 'Pintu depan, orang pertama. Berdiri pun tetap posisi terbaik.';
  }
  if (carRank === 0) {
    return 'Gerbong depan, tapi bukan yang pertama. Masih bagus untuk turun.';
  }
  if (carRank === 1) return 'Gerbong tengah. Bukan depan, tapi tetap sampai.';
  return 'Gerbong belakang. Masih sampai; besok berangkat lebih pagi.';
}
