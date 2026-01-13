/**
 * useLiquidGlass - React hook for WebGL liquid glass effect
 *
 * Adapted from liquid-glass-js by dashersw
 * @see https://github.com/dashersw/liquid-glass-js
 */

import { useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';

export interface LiquidGlassOptions {
  borderRadius?: number;
  blurRadius?: number;
  tintOpacity?: number;
  edgeIntensity?: number;
  rimIntensity?: number;
  baseIntensity?: number;
  edgeDistance?: number;
  rimDistance?: number;
  baseDistance?: number;
  cornerBoost?: number;
  rippleEffect?: number;
  type?: 'rounded' | 'circle' | 'pill';
}

const DEFAULT_OPTIONS: Required<LiquidGlassOptions> = {
  borderRadius: 24,
  blurRadius: 5.0,
  tintOpacity: 0.15,
  edgeIntensity: 0.01,
  rimIntensity: 0.05,
  baseIntensity: 0.01,
  edgeDistance: 0.15,
  rimDistance: 0.8,
  baseDistance: 0.1,
  cornerBoost: 0.02,
  rippleEffect: 0.1,
  type: 'rounded',
};

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texcoord;
  varying vec2 v_texcoord;

  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texcoord = a_texcoord;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform vec2 u_resolution;
  uniform vec2 u_textureSize;
  uniform float u_scrollY;
  uniform float u_blurRadius;
  uniform float u_borderRadius;
  uniform vec2 u_containerPosition;
  uniform float u_edgeIntensity;
  uniform float u_rimIntensity;
  uniform float u_baseIntensity;
  uniform float u_edgeDistance;
  uniform float u_rimDistance;
  uniform float u_baseDistance;
  uniform float u_cornerBoost;
  uniform float u_rippleEffect;
  uniform float u_tintOpacity;
  varying vec2 v_texcoord;

  float roundedRectDistance(vec2 coord, vec2 size, float radius) {
    vec2 center = size * 0.5;
    vec2 pixelCoord = coord * size;
    vec2 toCorner = abs(pixelCoord - center) - (center - radius);
    float outsideCorner = length(max(toCorner, 0.0));
    float insideCorner = min(max(toCorner.x, toCorner.y), 0.0);
    return (outsideCorner + insideCorner - radius);
  }

  void main() {
    vec2 coord = v_texcoord;
    vec2 containerSize = u_resolution;
    vec2 textureSize = u_textureSize;

    vec2 containerCenter = u_containerPosition + vec2(0.0, u_scrollY);
    vec2 containerOffset = (coord - 0.5) * containerSize;
    vec2 pagePixel = containerCenter + containerOffset;
    vec2 textureCoord = pagePixel / textureSize;

    float distFromEdgeShape = -roundedRectDistance(coord, u_resolution, u_borderRadius);
    distFromEdgeShape = max(distFromEdgeShape, 0.0);

    vec2 center = vec2(0.5, 0.5);
    vec2 shapeNormal = normalize(coord - center);

    float distFromLeft = coord.x;
    float distFromRight = 1.0 - coord.x;
    float distFromTop = coord.y;
    float distFromBottom = 1.0 - coord.y;
    float distFromEdge = distFromEdgeShape / min(u_resolution.x, u_resolution.y);

    float normalizedDistance = distFromEdge * min(u_resolution.x, u_resolution.y);
    float baseIntensity = 1.0 - exp(-normalizedDistance * u_baseDistance);
    float edgeIntensity = exp(-normalizedDistance * u_edgeDistance);
    float rimIntensity = exp(-normalizedDistance * u_rimDistance);

    float baseComponent = baseIntensity * u_baseIntensity;
    float totalIntensity = baseComponent + edgeIntensity * u_edgeIntensity + rimIntensity * u_rimIntensity;

    vec2 baseRefraction = shapeNormal * totalIntensity;

    float cornerProximityX = min(distFromLeft, distFromRight);
    float cornerProximityY = min(distFromTop, distFromBottom);
    float cornerDistance = max(cornerProximityX, cornerProximityY);
    float cornerNormalized = cornerDistance * min(u_resolution.x, u_resolution.y);

    float cornerBoost = exp(-cornerNormalized * 0.3) * u_cornerBoost;
    vec2 cornerRefraction = shapeNormal * cornerBoost;

    vec2 perpendicular = vec2(-shapeNormal.y, shapeNormal.x);
    float rippleEffect = sin(distFromEdge * 25.0) * u_rippleEffect * rimIntensity;
    vec2 textureRefraction = perpendicular * rippleEffect;

    vec2 totalRefraction = baseRefraction + cornerRefraction + textureRefraction;
    textureCoord += totalRefraction;

    // Gaussian blur
    vec4 color = vec4(0.0);
    vec2 texelSize = 1.0 / u_textureSize;
    float sigma = u_blurRadius / 2.0;
    vec2 blurStep = texelSize * sigma;
    float totalWeight = 0.0;

    for(float i = -6.0; i <= 6.0; i += 1.0) {
      for(float j = -6.0; j <= 6.0; j += 1.0) {
        float distance = length(vec2(i, j));
        if(distance > 6.0) continue;

        float weight = exp(-(distance * distance) / (2.0 * sigma * sigma));
        vec2 offset = vec2(i, j) * blurStep;
        color += texture2D(u_image, textureCoord + offset) * weight;
        totalWeight += weight;
      }
    }

    color /= totalWeight;

    // Gradient tint
    float gradientPosition = coord.y;
    vec3 topTint = vec3(1.0, 1.0, 1.0);
    vec3 bottomTint = vec3(0.85, 0.85, 0.85);
    vec3 gradientTint = mix(topTint, bottomTint, gradientPosition);
    vec3 tintedColor = mix(color.rgb, gradientTint, u_tintOpacity);
    color = vec4(tintedColor, color.a);

    // Mask with smooth edges
    float maskDistance = roundedRectDistance(coord, u_resolution, u_borderRadius);
    float mask = 1.0 - smoothstep(-1.0, 1.0, maskDistance);

    gl_FragColor = vec4(color.rgb, mask);
  }
`;

interface GLRefs {
  gl: WebGLRenderingContext;
  texture: WebGLTexture;
  scrollYLoc: WebGLUniformLocation | null;
  containerPositionLoc: WebGLUniformLocation | null;
  resolutionLoc: WebGLUniformLocation | null;
  borderRadiusLoc: WebGLUniformLocation | null;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    return null;
  }

  return program;
}

export function useLiquidGlass(
  containerRef: React.RefObject<HTMLElement | null>,
  options: LiquidGlassOptions = {}
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRefsRef = useRef<GLRefs | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const captureAndInit = useCallback(async () => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // Get parent element to capture as background
    const parent = container.parentElement;
    if (!parent) return;

    try {
      // Capture the parent (background) as texture
      const snapshot = await html2canvas(parent, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        ignoreElements: (element) => {
          return element === container || element.contains(container);
        },
      });

      const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false });
      if (!gl) {
        console.error('WebGL not supported');
        return;
      }

      const program = createProgram(gl);
      if (!program) return;

      gl.useProgram(program);

      // Setup buffers
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

      const texcoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]), gl.STATIC_DRAW);

      // Get locations
      const positionLoc = gl.getAttribLocation(program, 'a_position');
      const texcoordLoc = gl.getAttribLocation(program, 'a_texcoord');
      const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
      const textureSizeLoc = gl.getUniformLocation(program, 'u_textureSize');
      const scrollYLoc = gl.getUniformLocation(program, 'u_scrollY');
      const blurRadiusLoc = gl.getUniformLocation(program, 'u_blurRadius');
      const borderRadiusLoc = gl.getUniformLocation(program, 'u_borderRadius');
      const containerPositionLoc = gl.getUniformLocation(program, 'u_containerPosition');
      const edgeIntensityLoc = gl.getUniformLocation(program, 'u_edgeIntensity');
      const rimIntensityLoc = gl.getUniformLocation(program, 'u_rimIntensity');
      const baseIntensityLoc = gl.getUniformLocation(program, 'u_baseIntensity');
      const edgeDistanceLoc = gl.getUniformLocation(program, 'u_edgeDistance');
      const rimDistanceLoc = gl.getUniformLocation(program, 'u_rimDistance');
      const baseDistanceLoc = gl.getUniformLocation(program, 'u_baseDistance');
      const cornerBoostLoc = gl.getUniformLocation(program, 'u_cornerBoost');
      const rippleEffectLoc = gl.getUniformLocation(program, 'u_rippleEffect');
      const tintOpacityLoc = gl.getUniformLocation(program, 'u_tintOpacity');
      const imageLoc = gl.getUniformLocation(program, 'u_image');

      // Create texture from snapshot
      const texture = gl.createTexture();
      if (!texture) return;

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, snapshot);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      // Store refs
      glRefsRef.current = {
        gl,
        texture,
        scrollYLoc,
        containerPositionLoc,
        resolutionLoc,
        borderRadiusLoc,
      };

      // Setup viewport
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // Setup attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.enableVertexAttribArray(texcoordLoc);
      gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0);

      // Set uniforms
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform2f(textureSizeLoc, snapshot.width, snapshot.height);
      gl.uniform1f(blurRadiusLoc, opts.blurRadius);
      gl.uniform1f(borderRadiusLoc, opts.borderRadius);
      gl.uniform1f(edgeIntensityLoc, opts.edgeIntensity);
      gl.uniform1f(rimIntensityLoc, opts.rimIntensity);
      gl.uniform1f(baseIntensityLoc, opts.baseIntensity);
      gl.uniform1f(edgeDistanceLoc, opts.edgeDistance);
      gl.uniform1f(rimDistanceLoc, opts.rimDistance);
      gl.uniform1f(baseDistanceLoc, opts.baseDistance);
      gl.uniform1f(cornerBoostLoc, opts.cornerBoost);
      gl.uniform1f(rippleEffectLoc, opts.rippleEffect);
      gl.uniform1f(tintOpacityLoc, opts.tintOpacity);

      // Calculate container position relative to parent
      const parentRect = parent.getBoundingClientRect();
      const posX = rect.left - parentRect.left + rect.width / 2;
      const posY = rect.top - parentRect.top + rect.height / 2;
      gl.uniform2f(containerPositionLoc, posX, posY);
      gl.uniform1f(scrollYLoc, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(imageLoc, 0);

      // Render
      const render = () => {
        if (!glRefsRef.current) return;
        const { gl } = glRefsRef.current;
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      };

      render();

    } catch (error) {
      console.error('LiquidGlass init error:', error);
    }
  }, [containerRef, opts]);

  useEffect(() => {
    // Delay init to ensure DOM is ready
    const timeout = setTimeout(() => {
      captureAndInit();
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [captureAndInit]);

  return canvasRef;
}

export default useLiquidGlass;
