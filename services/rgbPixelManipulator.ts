/**
 * RGB Pixel Manipulation Service
 * 
 * Provides mathematical functions for direct RGB pixel manipulation
 * implementing core image processing algorithms through pixel-level RGB transformations.
 */

import { ImageManipulator } from 'expo-image-manipulator';

export interface RGBPixel {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface RGBManipulationOptions {
  brightness?: number;      // -100 to 100
  contrast?: number;        // -100 to 100
  gamma?: number;           // 0.1 to 3.0
  saturation?: number;      // -100 to 100
  hue?: number;            // -180 to 180
  redChannel?: number;     // -100 to 100
  greenChannel?: number;   // -100 to 100
  blueChannel?: number;    // -100 to 100
}

export interface ConvolutionKernel {
  matrix: number[][];
  divisor?: number;
  offset?: number;
}

export class RGBPixelManipulator {
  
  /**
   * Clamps a value between 0 and 255 for valid RGB range
   */
  private static clamp(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  /**
   * Applies brightness adjustment using linear transformation
   * Formula: newRGB = clamp(originalRGB + brightness)
   */
  static adjustBrightness(pixel: RGBPixel, brightness: number): RGBPixel {
    const adjustment = (brightness / 100) * 255;
    return {
      r: this.clamp(pixel.r + adjustment),
      g: this.clamp(pixel.g + adjustment),
      b: this.clamp(pixel.b + adjustment),
      a: pixel.a
    };
  }

  /**
   * Applies contrast adjustment using midpoint scaling
   * Formula: newRGB = clamp((originalRGB - 128) * contrast + 128)
   */
  static adjustContrast(pixel: RGBPixel, contrast: number): RGBPixel {
    const factor = (contrast + 100) / 100;
    return {
      r: this.clamp((pixel.r - 128) * factor + 128),
      g: this.clamp((pixel.g - 128) * factor + 128),
      b: this.clamp((pixel.b - 128) * factor + 128),
      a: pixel.a
    };
  }

  /**
   * Applies gamma correction using power law transformation
   * Formula: newRGB = 255 * Math.pow(originalRGB/255, 1/gamma)
   */
  static adjustGamma(pixel: RGBPixel, gamma: number): RGBPixel {
    const gammaCorrection = 1 / gamma;
    return {
      r: this.clamp(255 * Math.pow(pixel.r / 255, gammaCorrection)),
      g: this.clamp(255 * Math.pow(pixel.g / 255, gammaCorrection)),
      b: this.clamp(255 * Math.pow(pixel.b / 255, gammaCorrection)),
      a: pixel.a
    };
  }

  /**
   * Converts RGB to grayscale using luminance formula
   * Formula: Gray = 0.299*R + 0.587*G + 0.114*B
   */
  static toGrayscale(pixel: RGBPixel): RGBPixel {
    const gray = this.clamp(0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b);
    return {
      r: gray,
      g: gray,
      b: gray,
      a: pixel.a
    };
  }

  /**
   * Applies sepia effect using standard sepia transformation matrix
   * Microsoft recommended sepia values
   */
  static toSepia(pixel: RGBPixel): RGBPixel {
    return {
      r: this.clamp(0.393 * pixel.r + 0.769 * pixel.g + 0.189 * pixel.b),
      g: this.clamp(0.349 * pixel.r + 0.686 * pixel.g + 0.168 * pixel.b),
      b: this.clamp(0.272 * pixel.r + 0.534 * pixel.g + 0.131 * pixel.b),
      a: pixel.a
    };
  }

  /**
   * Converts RGB to HSV color space for better color manipulation
   */
  static rgbToHsv(pixel: RGBPixel): { h: number; s: number; v: number; a?: number } {
    const r = pixel.r / 255;
    const g = pixel.g / 255;
    const b = pixel.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff) % 6;
      else if (max === g) h = (b - r) / diff + 2;
      else h = (r - g) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;

    const s = max === 0 ? 0 : diff / max;
    const v = max;

    return { h, s, v, a: pixel.a };
  }

  /**
   * Converts HSV back to RGB color space
   */
  static hsvToRgb(hsv: { h: number; s: number; v: number; a?: number }): RGBPixel {
    const c = hsv.v * hsv.s;
    const x = c * (1 - Math.abs(((hsv.h / 60) % 2) - 1));
    const m = hsv.v - c;

    let r = 0, g = 0, b = 0;
    
    if (hsv.h >= 0 && hsv.h < 60) {
      r = c; g = x; b = 0;
    } else if (hsv.h >= 60 && hsv.h < 120) {
      r = x; g = c; b = 0;
    } else if (hsv.h >= 120 && hsv.h < 180) {
      r = 0; g = c; b = x;
    } else if (hsv.h >= 180 && hsv.h < 240) {
      r = 0; g = x; b = c;
    } else if (hsv.h >= 240 && hsv.h < 300) {
      r = x; g = 0; b = c;
    } else if (hsv.h >= 300 && hsv.h < 360) {
      r = c; g = 0; b = x;
    }

    return {
      r: this.clamp((r + m) * 255),
      g: this.clamp((g + m) * 255),
      b: this.clamp((b + m) * 255),
      a: hsv.a
    };
  }

  /**
   * Adjusts saturation by converting to HSV, modifying S, and converting back
   */
  static adjustSaturation(pixel: RGBPixel, saturation: number): RGBPixel {
    const hsv = this.rgbToHsv(pixel);
    const factor = (saturation + 100) / 100;
    hsv.s = Math.max(0, Math.min(1, hsv.s * factor));
    return this.hsvToRgb(hsv);
  }

  /**
   * Adjusts hue by shifting in HSV color space
   */
  static adjustHue(pixel: RGBPixel, hueShift: number): RGBPixel {
    const hsv = this.rgbToHsv(pixel);
    hsv.h = (hsv.h + hueShift + 360) % 360;
    return this.hsvToRgb(hsv);
  }

  /**
   * Adjusts individual RGB channels
   */
  static adjustChannels(pixel: RGBPixel, redAdjust: number, greenAdjust: number, blueAdjust: number): RGBPixel {
    const rFactor = (redAdjust + 100) / 100;
    const gFactor = (greenAdjust + 100) / 100;
    const bFactor = (blueAdjust + 100) / 100;

    return {
      r: this.clamp(pixel.r * rFactor),
      g: this.clamp(pixel.g * gFactor),
      b: this.clamp(pixel.b * bFactor),
      a: pixel.a
    };
  }

  /**
   * Predefined convolution kernels for common effects
   */
  static kernels = {
    blur: {
      matrix: [
        [1, 2, 1],
        [2, 4, 2],
        [1, 2, 1]
      ],
      divisor: 16
    },
    sharpen: {
      matrix: [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
      ]
    },
    edgeDetect: {
      matrix: [
        [-1, -1, -1],
        [-1, 8, -1],
        [-1, -1, -1]
      ]
    },
    emboss: {
      matrix: [
        [-2, -1, 0],
        [-1, 1, 1],
        [0, 1, 2]
      ]
    }
  };

  /**
   * Applies multiple RGB manipulations in sequence
   */
  static applyManipulations(pixel: RGBPixel, options: RGBManipulationOptions): RGBPixel {
    let result = { ...pixel };

    // Apply brightness adjustment
    if (options.brightness !== undefined && options.brightness !== 0) {
      result = this.adjustBrightness(result, options.brightness);
    }

    // Apply contrast adjustment
    if (options.contrast !== undefined && options.contrast !== 0) {
      result = this.adjustContrast(result, options.contrast);
    }

    // Apply gamma correction
    if (options.gamma !== undefined && options.gamma !== 1.0) {
      result = this.adjustGamma(result, options.gamma);
    }

    // Apply saturation adjustment
    if (options.saturation !== undefined && options.saturation !== 0) {
      result = this.adjustSaturation(result, options.saturation);
    }

    // Apply hue adjustment
    if (options.hue !== undefined && options.hue !== 0) {
      result = this.adjustHue(result, options.hue);
    }

    // Apply individual channel adjustments
    if (options.redChannel !== undefined || options.greenChannel !== undefined || options.blueChannel !== undefined) {
      result = this.adjustChannels(
        result,
        options.redChannel || 0,
        options.greenChannel || 0,
        options.blueChannel || 0
      );
    }

    return result;
  }

  /**
   * Inverts colors (negative effect)
   */
  static invert(pixel: RGBPixel): RGBPixel {
    return {
      r: 255 - pixel.r,
      g: 255 - pixel.g,
      b: 255 - pixel.b,
      a: pixel.a
    };
  }

  /**
   * Creates a posterization effect by reducing color levels
   */
  static posterize(pixel: RGBPixel, levels: number): RGBPixel {
    const step = 255 / (levels - 1);
    return {
      r: this.clamp(Math.round(pixel.r / step) * step),
      g: this.clamp(Math.round(pixel.g / step) * step),
      b: this.clamp(Math.round(pixel.b / step) * step),
      a: pixel.a
    };
  }

  /**
   * Applies threshold effect (converts to black/white based on brightness)
   */
  static threshold(pixel: RGBPixel, threshold: number): RGBPixel {
    const brightness = 0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b;
    const value = brightness > threshold ? 255 : 0;
    return {
      r: value,
      g: value,
      b: value,
      a: pixel.a
    };
  }
}

export default RGBPixelManipulator;