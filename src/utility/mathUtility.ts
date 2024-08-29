import Phaser from "phaser";

export const smoothstep = (a: number, b: number, v: number) => {
  const ret = Phaser.Math.Clamp((v - a) / (b - a), 0, 1);
  return ret * ret * (3 - 2 * ret);
}