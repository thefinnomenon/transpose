import { Dimensions, PixelRatio } from 'react-native';

export var { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get(
  'window',
);

// based on iPhone 11's scale (1792‑by‑828)
const wscale: number = SCREEN_WIDTH / 414;
const hscale: number = SCREEN_HEIGHT / 896;

export default function normalize(
  size: number,
  min: number = 0,
  max: number = 0,
  based: 'width' | 'height' = 'width',
) {
  const minSize = based === 'height' ? min * hscale : min * wscale;
  const maxSize = based === 'height' ? max * hscale : max * wscale;
  let newSize = based === 'height' ? size * hscale : size * wscale;

  if (min > 0 && newSize < minSize) {
    newSize = minSize;
  }

  if (max > 0 && newSize > maxSize) {
    newSize = maxSize;
  }

  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}
