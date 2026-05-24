"use client";

/* =============================================================================
   AlgeriaGlobe
   -----------------------------------------------------------------------------
   A Cloudflare "Region: Earth"–style animated map, themed for Nzzor:
   - A dotted silhouette of Algeria (real country polygon, sampled at ~0.45°)
   - Tilted forward ~22° for depth — feels like a physical surface, not a flat map
   - Each dot's opacity gently oscillates via a continuous shimmer wave
   - 8 city pins (our launch cities), each softly pulsing
   - Travel arcs cycle between cities every few seconds (ambient network feel)
   - Two anchored callouts tell the trust story (Algiers / Djanet)
   - Click anywhere → all city pins flash, a cascade of arcs fires between them
   - Pure SVG. No Three.js. No GeoJSON dependency at runtime — dots are pre-baked.
   ============================================================================= */

import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "../lib/LangContext";

// ---- Pre-baked dot field --------------------------------------------------
// Generated offline from glynnbird/countriesgeojson Algeria polygon, sampled
// at 0.45° lng/lat grid using point-in-polygon. Flat array: [lng, lat, ...]
// 1049 dots, ~10KB minified.
const ALGERIA_DOTS = [3.45,19.45,3.9,19.45,4.35,19.45,4.8,19.45,3,19.9,3.45,19.9,3.9,19.9,4.35,19.9,4.8,19.9,5.25,19.9,5.7,19.9,2.1,20.35,2.55,20.35,3,20.35,3.45,20.35,3.9,20.35,4.35,20.35,4.8,20.35,5.25,20.35,5.7,20.35,6.15,20.35,6.6,20.35,1.65,20.8,2.1,20.8,2.55,20.8,3,20.8,3.45,20.8,3.9,20.8,4.35,20.8,4.8,20.8,5.25,20.8,5.7,20.8,6.15,20.8,6.6,20.8,7.05,20.8,1.2,21.25,1.65,21.25,2.1,21.25,2.55,21.25,3,21.25,3.45,21.25,3.9,21.25,4.35,21.25,4.8,21.25,5.25,21.25,5.7,21.25,6.15,21.25,6.6,21.25,7.05,21.25,7.5,21.25,7.95,21.25,0.3,21.7,0.75,21.7,1.2,21.7,1.65,21.7,2.1,21.7,2.55,21.7,3,21.7,3.45,21.7,3.9,21.7,4.35,21.7,4.8,21.7,5.25,21.7,5.7,21.7,6.15,21.7,6.6,21.7,7.05,21.7,7.5,21.7,7.95,21.7,8.4,21.7,-0.15,22.15,0.3,22.15,0.75,22.15,1.2,22.15,1.65,22.15,2.1,22.15,2.55,22.15,3,22.15,3.45,22.15,3.9,22.15,4.35,22.15,4.8,22.15,5.25,22.15,5.7,22.15,6.15,22.15,6.6,22.15,7.05,22.15,7.5,22.15,7.95,22.15,8.4,22.15,8.85,22.15,9.3,22.15,-1.05,22.6,-0.6,22.6,-0.15,22.6,0.3,22.6,0.75,22.6,1.2,22.6,1.65,22.6,2.1,22.6,2.55,22.6,3,22.6,3.45,22.6,3.9,22.6,4.35,22.6,4.8,22.6,5.25,22.6,5.7,22.6,6.15,22.6,6.6,22.6,7.05,22.6,7.5,22.6,7.95,22.6,8.4,22.6,8.85,22.6,9.3,22.6,9.75,22.6,10.2,22.6,-1.5,23.05,-1.05,23.05,-0.6,23.05,-0.15,23.05,0.3,23.05,0.75,23.05,1.2,23.05,1.65,23.05,2.1,23.05,2.55,23.05,3,23.05,3.45,23.05,3.9,23.05,4.35,23.05,4.8,23.05,5.25,23.05,5.7,23.05,6.15,23.05,6.6,23.05,7.05,23.05,7.5,23.05,7.95,23.05,8.4,23.05,8.85,23.05,9.3,23.05,9.75,23.05,10.2,23.05,10.65,23.05,11.1,23.05,-2.4,23.5,-1.95,23.5,-1.5,23.5,-1.05,23.5,-0.6,23.5,-0.15,23.5,0.3,23.5,0.75,23.5,1.2,23.5,1.65,23.5,2.1,23.5,2.55,23.5,3,23.5,3.45,23.5,3.9,23.5,4.35,23.5,4.8,23.5,5.25,23.5,5.7,23.5,6.15,23.5,6.6,23.5,7.05,23.5,7.5,23.5,7.95,23.5,8.4,23.5,8.85,23.5,9.3,23.5,9.75,23.5,10.2,23.5,10.65,23.5,11.1,23.5,11.55,23.5,-3.3,23.95,-2.85,23.95,-2.4,23.95,-1.95,23.95,-1.5,23.95,-1.05,23.95,-0.6,23.95,-0.15,23.95,0.3,23.95,0.75,23.95,1.2,23.95,1.65,23.95,2.1,23.95,2.55,23.95,3,23.95,3.45,23.95,3.9,23.95,4.35,23.95,4.8,23.95,5.25,23.95,5.7,23.95,6.15,23.95,6.6,23.95,7.05,23.95,7.5,23.95,7.95,23.95,8.4,23.95,8.85,23.95,9.3,23.95,9.75,23.95,10.2,23.95,10.65,23.95,11.1,23.95,11.55,23.95,-3.75,24.4,-3.3,24.4,-2.85,24.4,-2.4,24.4,-1.95,24.4,-1.5,24.4,-1.05,24.4,-0.6,24.4,-0.15,24.4,0.3,24.4,0.75,24.4,1.2,24.4,1.65,24.4,2.1,24.4,2.55,24.4,3,24.4,3.45,24.4,3.9,24.4,4.35,24.4,4.8,24.4,5.25,24.4,5.7,24.4,6.15,24.4,6.6,24.4,7.05,24.4,7.5,24.4,7.95,24.4,8.4,24.4,8.85,24.4,9.3,24.4,9.75,24.4,10.2,24.4,10.65,24.4,-4.65,24.85,-4.2,24.85,-3.75,24.85,-3.3,24.85,-2.85,24.85,-2.4,24.85,-1.95,24.85,-1.5,24.85,-1.05,24.85,-0.6,24.85,-0.15,24.85,0.3,24.85,0.75,24.85,1.2,24.85,1.65,24.85,2.1,24.85,2.55,24.85,3,24.85,3.45,24.85,3.9,24.85,4.35,24.85,4.8,24.85,5.25,24.85,5.7,24.85,6.15,24.85,6.6,24.85,7.05,24.85,7.5,24.85,7.95,24.85,8.4,24.85,8.85,24.85,9.3,24.85,9.75,24.85,-5.1,25.3,-4.65,25.3,-4.2,25.3,-3.75,25.3,-3.3,25.3,-2.85,25.3,-2.4,25.3,-1.95,25.3,-1.5,25.3,-1.05,25.3,-0.6,25.3,-0.15,25.3,0.3,25.3,0.75,25.3,1.2,25.3,1.65,25.3,2.1,25.3,2.55,25.3,3,25.3,3.45,25.3,3.9,25.3,4.35,25.3,4.8,25.3,5.25,25.3,5.7,25.3,6.15,25.3,6.6,25.3,7.05,25.3,7.5,25.3,7.95,25.3,8.4,25.3,8.85,25.3,9.3,25.3,9.75,25.3,-6,25.75,-5.55,25.75,-5.1,25.75,-4.65,25.75,-4.2,25.75,-3.75,25.75,-3.3,25.75,-2.85,25.75,-2.4,25.75,-1.95,25.75,-1.5,25.75,-1.05,25.75,-0.6,25.75,-0.15,25.75,0.3,25.75,0.75,25.75,1.2,25.75,1.65,25.75,2.1,25.75,2.55,25.75,3,25.75,3.45,25.75,3.9,25.75,4.35,25.75,4.8,25.75,5.25,25.75,5.7,25.75,6.15,25.75,6.6,25.75,7.05,25.75,7.5,25.75,7.95,25.75,8.4,25.75,8.85,25.75,9.3,25.75,-6.45,26.2,-6,26.2,-5.55,26.2,-5.1,26.2,-4.65,26.2,-4.2,26.2,-3.75,26.2,-3.3,26.2,-2.85,26.2,-2.4,26.2,-1.95,26.2,-1.5,26.2,-1.05,26.2,-0.6,26.2,-0.15,26.2,0.3,26.2,0.75,26.2,1.2,26.2,1.65,26.2,2.1,26.2,2.55,26.2,3,26.2,3.45,26.2,3.9,26.2,4.35,26.2,4.8,26.2,5.25,26.2,5.7,26.2,6.15,26.2,6.6,26.2,7.05,26.2,7.5,26.2,7.95,26.2,8.4,26.2,8.85,26.2,9.3,26.2,-7.35,26.65,-6.9,26.65,-6.45,26.65,-6,26.65,-5.55,26.65,-5.1,26.65,-4.65,26.65,-4.2,26.65,-3.75,26.65,-3.3,26.65,-2.85,26.65,-2.4,26.65,-1.95,26.65,-1.5,26.65,-1.05,26.65,-0.6,26.65,-0.15,26.65,0.3,26.65,0.75,26.65,1.2,26.65,1.65,26.65,2.1,26.65,2.55,26.65,3,26.65,3.45,26.65,3.9,26.65,4.35,26.65,4.8,26.65,5.25,26.65,5.7,26.65,6.15,26.65,6.6,26.65,7.05,26.65,7.5,26.65,7.95,26.65,8.4,26.65,8.85,26.65,9.3,26.65,-7.8,27.1,-7.35,27.1,-6.9,27.1,-6.45,27.1,-6,27.1,-5.55,27.1,-5.1,27.1,-4.65,27.1,-4.2,27.1,-3.75,27.1,-3.3,27.1,-2.85,27.1,-2.4,27.1,-1.95,27.1,-1.5,27.1,-1.05,27.1,-0.6,27.1,-0.15,27.1,0.3,27.1,0.75,27.1,1.2,27.1,1.65,27.1,2.1,27.1,2.55,27.1,3,27.1,3.45,27.1,3.9,27.1,4.35,27.1,4.8,27.1,5.25,27.1,5.7,27.1,6.15,27.1,6.6,27.1,7.05,27.1,7.5,27.1,7.95,27.1,8.4,27.1,8.85,27.1,9.3,27.1,-8.25,27.55,-7.8,27.55,-7.35,27.55,-6.9,27.55,-6.45,27.55,-6,27.55,-5.55,27.55,-5.1,27.55,-4.65,27.55,-4.2,27.55,-3.75,27.55,-3.3,27.55,-2.85,27.55,-2.4,27.55,-1.95,27.55,-1.5,27.55,-1.05,27.55,-0.6,27.55,-0.15,27.55,0.3,27.55,0.75,27.55,1.2,27.55,1.65,27.55,2.1,27.55,2.55,27.55,3,27.55,3.45,27.55,3.9,27.55,4.35,27.55,4.8,27.55,5.25,27.55,5.7,27.55,6.15,27.55,6.6,27.55,7.05,27.55,7.5,27.55,7.95,27.55,8.4,27.55,8.85,27.55,9.3,27.55,-8.25,28,-7.8,28,-7.35,28,-6.9,28,-6.45,28,-6,28,-5.55,28,-5.1,28,-4.65,28,-4.2,28,-3.75,28,-3.3,28,-2.85,28,-2.4,28,-1.95,28,-1.5,28,-1.05,28,-0.6,28,-0.15,28,0.3,28,0.75,28,1.2,28,1.65,28,2.1,28,2.55,28,3,28,3.45,28,3.9,28,4.35,28,4.8,28,5.25,28,5.7,28,6.15,28,6.6,28,7.05,28,7.5,28,7.95,28,8.4,28,8.85,28,9.3,28,-8.25,28.45,-7.8,28.45,-7.35,28.45,-6.9,28.45,-6.45,28.45,-6,28.45,-5.55,28.45,-5.1,28.45,-4.65,28.45,-4.2,28.45,-3.75,28.45,-3.3,28.45,-2.85,28.45,-2.4,28.45,-1.95,28.45,-1.5,28.45,-1.05,28.45,-0.6,28.45,-0.15,28.45,0.3,28.45,0.75,28.45,1.2,28.45,1.65,28.45,2.1,28.45,2.55,28.45,3,28.45,3.45,28.45,3.9,28.45,4.35,28.45,4.8,28.45,5.25,28.45,5.7,28.45,6.15,28.45,6.6,28.45,7.05,28.45,7.5,28.45,7.95,28.45,8.4,28.45,8.85,28.45,9.3,28.45,-8.25,28.9,-7.8,28.9,-7.35,28.9,-6.9,28.9,-6.45,28.9,-6,28.9,-5.55,28.9,-5.1,28.9,-4.65,28.9,-4.2,28.9,-3.75,28.9,-3.3,28.9,-2.85,28.9,-2.4,28.9,-1.95,28.9,-1.5,28.9,-1.05,28.9,-0.6,28.9,-0.15,28.9,0.3,28.9,0.75,28.9,1.2,28.9,1.65,28.9,2.1,28.9,2.55,28.9,3,28.9,3.45,28.9,3.9,28.9,4.35,28.9,4.8,28.9,5.25,28.9,5.7,28.9,6.15,28.9,6.6,28.9,7.05,28.9,7.5,28.9,7.95,28.9,8.4,28.9,8.85,28.9,9.3,28.9,9.75,28.9,-7.35,29.35,-6.9,29.35,-6.45,29.35,-6,29.35,-5.55,29.35,-5.1,29.35,-4.65,29.35,-4.2,29.35,-3.75,29.35,-3.3,29.35,-2.85,29.35,-2.4,29.35,-1.95,29.35,-1.5,29.35,-1.05,29.35,-0.6,29.35,-0.15,29.35,0.3,29.35,0.75,29.35,1.2,29.35,1.65,29.35,2.1,29.35,2.55,29.35,3,29.35,3.45,29.35,3.9,29.35,4.35,29.35,4.8,29.35,5.25,29.35,5.7,29.35,6.15,29.35,6.6,29.35,7.05,29.35,7.5,29.35,7.95,29.35,8.4,29.35,8.85,29.35,9.3,29.35,9.75,29.35,-5.55,29.8,-5.1,29.8,-4.65,29.8,-4.2,29.8,-3.75,29.8,-3.3,29.8,-2.85,29.8,-2.4,29.8,-1.95,29.8,-1.5,29.8,-1.05,29.8,-0.6,29.8,-0.15,29.8,0.3,29.8,0.75,29.8,1.2,29.8,1.65,29.8,2.1,29.8,2.55,29.8,3,29.8,3.45,29.8,3.9,29.8,4.35,29.8,4.8,29.8,5.25,29.8,5.7,29.8,6.15,29.8,6.6,29.8,7.05,29.8,7.5,29.8,7.95,29.8,8.4,29.8,8.85,29.8,9.3,29.8,-4.65,30.25,-4.2,30.25,-3.75,30.25,-3.3,30.25,-2.85,30.25,-2.4,30.25,-1.95,30.25,-1.5,30.25,-1.05,30.25,-0.6,30.25,-0.15,30.25,0.3,30.25,0.75,30.25,1.2,30.25,1.65,30.25,2.1,30.25,2.55,30.25,3,30.25,3.45,30.25,3.9,30.25,4.35,30.25,4.8,30.25,5.25,30.25,5.7,30.25,6.15,30.25,6.6,30.25,7.05,30.25,7.5,30.25,7.95,30.25,8.4,30.25,8.85,30.25,9.3,30.25,-4.2,30.7,-3.75,30.7,-3.3,30.7,-2.85,30.7,-2.4,30.7,-1.95,30.7,-1.5,30.7,-1.05,30.7,-0.6,30.7,-0.15,30.7,0.3,30.7,0.75,30.7,1.2,30.7,1.65,30.7,2.1,30.7,2.55,30.7,3,30.7,3.45,30.7,3.9,30.7,4.35,30.7,4.8,30.7,5.25,30.7,5.7,30.7,6.15,30.7,6.6,30.7,7.05,30.7,7.5,30.7,7.95,30.7,8.4,30.7,8.85,30.7,9.3,30.7,-3.3,31.15,-2.85,31.15,-2.4,31.15,-1.95,31.15,-1.5,31.15,-1.05,31.15,-0.6,31.15,-0.15,31.15,0.3,31.15,0.75,31.15,1.2,31.15,1.65,31.15,2.1,31.15,2.55,31.15,3,31.15,3.45,31.15,3.9,31.15,4.35,31.15,4.8,31.15,5.25,31.15,5.7,31.15,6.15,31.15,6.6,31.15,7.05,31.15,7.5,31.15,7.95,31.15,8.4,31.15,8.85,31.15,-3.3,31.6,-2.85,31.6,-2.4,31.6,-1.95,31.6,-1.5,31.6,-1.05,31.6,-0.6,31.6,-0.15,31.6,0.3,31.6,0.75,31.6,1.2,31.6,1.65,31.6,2.1,31.6,2.55,31.6,3,31.6,3.45,31.6,3.9,31.6,4.35,31.6,4.8,31.6,5.25,31.6,5.7,31.6,6.15,31.6,6.6,31.6,7.05,31.6,7.5,31.6,7.95,31.6,8.4,31.6,8.85,31.6,-2.4,32.05,-1.95,32.05,-1.5,32.05,-1.05,32.05,-0.6,32.05,-0.15,32.05,0.3,32.05,0.75,32.05,1.2,32.05,1.65,32.05,2.1,32.05,2.55,32.05,3,32.05,3.45,32.05,3.9,32.05,4.35,32.05,4.8,32.05,5.25,32.05,5.7,32.05,6.15,32.05,6.6,32.05,7.05,32.05,7.5,32.05,7.95,32.05,8.4,32.05,8.85,32.05,-1.05,32.5,-0.6,32.5,-0.15,32.5,0.3,32.5,0.75,32.5,1.2,32.5,1.65,32.5,2.1,32.5,2.55,32.5,3,32.5,3.45,32.5,3.9,32.5,4.35,32.5,4.8,32.5,5.25,32.5,5.7,32.5,6.15,32.5,6.6,32.5,7.05,32.5,7.5,32.5,7.95,32.5,8.4,32.5,-1.05,32.95,-0.6,32.95,-0.15,32.95,0.3,32.95,0.75,32.95,1.2,32.95,1.65,32.95,2.1,32.95,2.55,32.95,3,32.95,3.45,32.95,3.9,32.95,4.35,32.95,4.8,32.95,5.25,32.95,5.7,32.95,6.15,32.95,6.6,32.95,7.05,32.95,7.5,32.95,7.95,32.95,-1.5,33.4,-1.05,33.4,-0.6,33.4,-0.15,33.4,0.3,33.4,0.75,33.4,1.2,33.4,1.65,33.4,2.1,33.4,2.55,33.4,3,33.4,3.45,33.4,3.9,33.4,4.35,33.4,4.8,33.4,5.25,33.4,5.7,33.4,6.15,33.4,6.6,33.4,7.05,33.4,7.5,33.4,-1.5,33.85,-1.05,33.85,-0.6,33.85,-0.15,33.85,0.3,33.85,0.75,33.85,1.2,33.85,1.65,33.85,2.1,33.85,2.55,33.85,3,33.85,3.45,33.85,3.9,33.85,4.35,33.85,4.8,33.85,5.25,33.85,5.7,33.85,6.15,33.85,6.6,33.85,7.05,33.85,7.5,33.85,-1.5,34.3,-1.05,34.3,-0.6,34.3,-0.15,34.3,0.3,34.3,0.75,34.3,1.2,34.3,1.65,34.3,2.1,34.3,2.55,34.3,3,34.3,3.45,34.3,3.9,34.3,4.35,34.3,4.8,34.3,5.25,34.3,5.7,34.3,6.15,34.3,6.6,34.3,7.05,34.3,7.5,34.3,-1.5,34.75,-1.05,34.75,-0.6,34.75,-0.15,34.75,0.3,34.75,0.75,34.75,1.2,34.75,1.65,34.75,2.1,34.75,2.55,34.75,3,34.75,3.45,34.75,3.9,34.75,4.35,34.75,4.8,34.75,5.25,34.75,5.7,34.75,6.15,34.75,6.6,34.75,7.05,34.75,7.5,34.75,7.95,34.75,-1.95,35.2,-1.5,35.2,-1.05,35.2,-0.6,35.2,-0.15,35.2,0.3,35.2,0.75,35.2,1.2,35.2,1.65,35.2,2.1,35.2,2.55,35.2,3,35.2,3.45,35.2,3.9,35.2,4.35,35.2,4.8,35.2,5.25,35.2,5.7,35.2,6.15,35.2,6.6,35.2,7.05,35.2,7.5,35.2,7.95,35.2,-1.05,35.65,-0.6,35.65,-0.15,35.65,0.3,35.65,0.75,35.65,1.2,35.65,1.65,35.65,2.1,35.65,2.55,35.65,3,35.65,3.45,35.65,3.9,35.65,4.35,35.65,4.8,35.65,5.25,35.65,5.7,35.65,6.15,35.65,6.6,35.65,7.05,35.65,7.5,35.65,7.95,35.65,0.3,36.1,0.75,36.1,1.2,36.1,1.65,36.1,2.1,36.1,2.55,36.1,3,36.1,3.45,36.1,3.9,36.1,4.35,36.1,4.8,36.1,5.25,36.1,5.7,36.1,6.15,36.1,6.6,36.1,7.05,36.1,7.5,36.1,7.95,36.1,1.65,36.55,2.1,36.55,2.55,36.55,3,36.55,3.45,36.55,3.9,36.55,4.35,36.55,4.8,36.55,5.25,36.55,5.7,36.55,6.15,36.55,6.6,36.55,7.05,36.55,7.5,36.55,7.95,36.55,6.15,37,6.6,37,7.05,37,7.5,37];

// ---- Launch cities --------------------------------------------------------
const CITIES = [
  { name: "Algiers",     lat: 36.7538, lng: 3.0588,  primary: true  },
  { name: "Oran",        lat: 35.6976, lng: -0.6337                 },
  { name: "Constantine", lat: 36.3650, lng: 6.6147                  },
  { name: "Bejaia",      lat: 36.7525, lng: 5.0840                  },
  { name: "Tipaza",      lat: 36.5894, lng: 2.4439                  },
  { name: "Batna",       lat: 35.5500, lng: 6.1739                  },
  { name: "Ghardaia",    lat: 32.4900, lng: 3.6700                  },
  { name: "Djanet",      lat: 24.5544, lng: 9.4843                  },
];

// ---- Geographic bounding box of the dot field ----------------------------
// Algeria spans roughly lng -8.7 to 12.0, lat 19.0 to 37.2
const BBOX = { minLng: -8.7, maxLng: 12.0, minLat: 19.0, maxLat: 37.2 };
const CENTER_LNG = (BBOX.minLng + BBOX.maxLng) / 2;
const CENTER_LAT = (BBOX.minLat + BBOX.maxLat) / 2;

// Project lng/lat to local 2D plane coordinates, then apply forward tilt.
// Tilt = rotate around X axis. After tilt the "y" axis becomes shortened
// (perspective foreshortening), giving the country a 3D laid-down feel.
//
// Returns { x, y } in normalized -1..1 space relative to the country center.
const TILT_DEG = 22;
const TILT_RAD = (TILT_DEG * Math.PI) / 180;
const COS_TILT = Math.cos(TILT_RAD);
const SIN_TILT = Math.sin(TILT_RAD);

function project(lng, lat) {
  // Normalize lng/lat to -1..1 within the country's bbox.
  // Subtle vertical squash so Algeria sits as a wide shape.
  const nx = (lng - CENTER_LNG) / ((BBOX.maxLng - BBOX.minLng) / 2);
  const ny = (lat - CENTER_LAT) / ((BBOX.maxLat - BBOX.minLat) / 2);
  // Apply X-axis tilt: y' = y * cos, z = y * sin (depth)
  const y = -ny * COS_TILT; // negate so north is up on screen
  const z = -ny * SIN_TILT;
  return { x: nx, y, z };
}

export default function AlgeriaGlobe() {
  const { t } = useLang();

  // SVG canvas — designed for a wide aspect; mobile media query scales it
  const W = 720;
  const H = 460;
  const CX = W / 2;
  const CY = H / 2 + 30; // shift down a little so callouts have headroom up top
  const SCALE = 220;     // multiply normalized -1..1 by this for screen pixels

  // ---- Memoize the static projected dot positions (no rotation) ----------
  const projectedDots = useMemo(() => {
    const out = [];
    for (let i = 0; i < ALGERIA_DOTS.length; i += 2) {
      const lng = ALGERIA_DOTS[i];
      const lat = ALGERIA_DOTS[i + 1];
      const p = project(lng, lat);
      out.push({
        x: CX + p.x * SCALE,
        y: CY + p.y * SCALE,
        z: p.z,
      });
    }
    return out;
  }, []);

  // ---- Memoize city pin projections --------------------------------------
  const projectedCities = useMemo(() => {
    return CITIES.map((c) => {
      const p = project(c.lng, c.lat);
      return {
        ...c,
        sx: CX + p.x * SCALE,
        sy: CY + p.y * SCALE,
        sz: p.z,
      };
    });
  }, []);

  // ---- Continuous shimmer time --------------------------------------------
  // We advance a single time counter every frame and use it to compute
  // per-dot opacity. One state variable, one render per frame.
  const [phase, setPhase] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    let last = performance.now();
    function tick(now) {
      const dt = Math.min(now - last, 60) / 1000;
      last = now;
      setPhase((p) => p + dt);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ---- Travel arcs --------------------------------------------------------
  // Every ~3.5 seconds we pick a new arc between two random cities. We keep
  // a small queue of currently-fading arcs and render them. An arc has:
  //   { from, to, born } where born is the phase value when it started.
  // An arc fades in over the first 25% of its life, holds, then fades out.
  const ARC_LIFETIME = 2.8;           // seconds
  const ARC_SPAWN_INTERVAL = 1.6;     // seconds between new arcs
  const arcsRef = useRef([]);
  const lastSpawnRef = useRef(0);
  const cascadeUntilRef = useRef(0);  // if phase < this, spawn arcs rapidly

  useEffect(() => {
    // Clean expired arcs and spawn new ones as phase advances
    arcsRef.current = arcsRef.current.filter(
      (a) => phase - a.born < ARC_LIFETIME
    );
    const spawnGap = phase < cascadeUntilRef.current ? 0.18 : ARC_SPAWN_INTERVAL;
    if (phase - lastSpawnRef.current > spawnGap) {
      lastSpawnRef.current = phase;
      const a = Math.floor(Math.random() * CITIES.length);
      let b = Math.floor(Math.random() * CITIES.length);
      if (b === a) b = (b + 1) % CITIES.length;
      arcsRef.current.push({ from: a, to: b, born: phase });
    }
  }, [phase]);

  // ---- Click handler: fire cascade ---------------------------------------
  const [cascadeKey, setCascadeKey] = useState(0);
  function handleSpark() {
    cascadeUntilRef.current = phase + 1.6;
    setCascadeKey((k) => k + 1); // bumps key on city pulses to retrigger CSS anim
  }

  // ---- Helper: build a curved SVG arc path between two cities ------------
  function arcPath(from, to) {
    const a = projectedCities[from];
    const b = projectedCities[to];
    // Control point lifted above the midpoint (negative y = up)
    const mx = (a.sx + b.sx) / 2;
    const my = (a.sy + b.sy) / 2;
    const dx = b.sx - a.sx;
    const dy = b.sy - a.sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const lift = Math.min(80, dist * 0.35);
    const cx = mx;
    const cy = my - lift;
    return `M ${a.sx} ${a.sy} Q ${cx} ${cy} ${b.sx} ${b.sy}`;
  }

  // ---- Render -------------------------------------------------------------
  // Sin-wave shimmer parameters
  const SHIMMER_SPEED = 0.9;     // wave speed in radians/sec
  const SHIMMER_FREQ_X = 0.012;  // wave frequency across X axis
  const SHIMMER_FREQ_Y = 0.008;  // wave frequency across Y axis
  const SHIMMER_AMP = 0.22;      // opacity oscillation amplitude

  return (
    <section className="nz-globe-section">
      <div className="wrap nz-globe-head">
        <div className="nz-globe-kicker">{t("globe.kicker")}</div>
        <h2 className="display nz-globe-title">{t("globe.title")}</h2>
        <p className="nz-globe-sub">{t("globe.sub")}</p>
      </div>

      <div
        className="nz-globe-stage"
        onClick={handleSpark}
        role="button"
        tabIndex={0}
        aria-label="Activate the network"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleSpark();
        }}
      >
        {/* Left callout — anchored toward Algiers */}
        <div className="nz-globe-callout nz-globe-callout-left">
          <div className="nz-globe-callout-num display">10</div>
          <div className="nz-globe-callout-body">
            <div className="nz-globe-callout-title">{t("globe.callout1_t")}</div>
            <div className="nz-globe-callout-text">{t("globe.callout1_d")}</div>
          </div>
        </div>

        {/* Right callout — anchored toward Djanet */}
        <div className="nz-globe-callout nz-globe-callout-right">
          <div className="nz-globe-callout-body">
            <div className="nz-globe-callout-title">{t("globe.callout2_t")}</div>
            <div className="nz-globe-callout-text">{t("globe.callout2_d")}</div>
          </div>
        </div>

        <svg
          className="nz-globe-svg"
          viewBox={`0 0 ${W} ${H}`}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <radialGradient id="nz-algeria-halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#E63946" stopOpacity="0.10" />
              <stop offset="55%"  stopColor="#E63946" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#E63946" stopOpacity="0" />
            </radialGradient>
            <filter id="nz-pin-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Soft halo behind the country */}
          <ellipse cx={CX} cy={CY} rx={SCALE * 1.15} ry={SCALE * 0.95}
                   fill="url(#nz-algeria-halo)" />

          {/* Dot field — the country itself */}
          <g>
            {projectedDots.map((d, i) => {
              // Shimmer wave that drifts diagonally across the country
              const wave = Math.sin(
                phase * SHIMMER_SPEED +
                d.x * SHIMMER_FREQ_X +
                d.y * SHIMMER_FREQ_Y
              );
              const base = 0.42;
              const opacity = Math.max(0.12, base + wave * SHIMMER_AMP);
              return (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={1.55}
                  fill="#16161A"
                  opacity={opacity}
                />
              );
            })}
          </g>

          {/* Travel arcs */}
          <g>
            {arcsRef.current.map((a, i) => {
              const age = phase - a.born;
              const t = age / ARC_LIFETIME; // 0..1
              // Fade in 0..0.25, hold 0.25..0.75, fade out 0.75..1
              let opacity;
              if (t < 0.25) opacity = t / 0.25;
              else if (t > 0.75) opacity = (1 - t) / 0.25;
              else opacity = 1;
              opacity *= 0.7;
              return (
                <path
                  key={`arc-${a.born}-${i}`}
                  d={arcPath(a.from, a.to)}
                  fill="none"
                  stroke="#E63946"
                  strokeWidth="1.4"
                  strokeOpacity={opacity}
                  strokeDasharray="3 4"
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* City pins */}
          <g>
            {projectedCities.map((c, i) => (
              <g key={c.name}>
                {/* Continuous pulse */}
                <circle
                  cx={c.sx}
                  cy={c.sy}
                  r="5"
                  fill="#E63946"
                  className="nz-globe-pulse"
                  style={{ animationDelay: `${i * 0.35}s` }}
                />
                {/* Cascade pulse — only rendered after first click, retriggers via key */}
                {cascadeKey > 0 && (
                  <circle
                    key={`cascade-${cascadeKey}-${i}`}
                    cx={c.sx}
                    cy={c.sy}
                    r="5"
                    fill="#E63946"
                    className="nz-globe-cascade"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  />
                )}
                {/* Solid pin with subtle glow */}
                <circle
                  cx={c.sx}
                  cy={c.sy}
                  r={c.primary ? 5 : 4}
                  fill="#E63946"
                  filter="url(#nz-pin-glow)"
                />
                {/* Primary city gets a white center */}
                {c.primary && (
                  <circle cx={c.sx} cy={c.sy} r="2" fill="#FAF8F4" />
                )}
              </g>
            ))}
          </g>

          {/* Leader lines from callouts to anchor pins */}
          {(() => {
            const algiers = projectedCities.find((c) => c.primary);
            const djanet  = projectedCities.find((c) => c.name === "Djanet");
            return (
              <g>
                {algiers && (
                  <line
                    x1={algiers.sx} y1={algiers.sy}
                    x2={CX - SCALE - 30} y2={CY - SCALE * 0.55}
                    stroke="#E63946" strokeWidth="1"
                    strokeOpacity="0.45" strokeDasharray="2 3"
                  />
                )}
                {djanet && (
                  <line
                    x1={djanet.sx} y1={djanet.sy}
                    x2={CX + SCALE + 30} y2={CY + SCALE * 0.35}
                    stroke="#E63946" strokeWidth="1"
                    strokeOpacity="0.45" strokeDasharray="2 3"
                  />
                )}
              </g>
            );
          })()}
        </svg>

        <div className="nz-globe-hint">{t("globe.hint")}</div>
      </div>

      <style>{`
        .nz-globe-section {
          padding: 72px 0 80px;
          background: var(--cream);
          position: relative;
          overflow: hidden;
        }
        .nz-globe-head { text-align: center; margin-bottom: 32px; }
        .nz-globe-kicker {
          font-size: 11px; font-weight: 700; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--red); margin-bottom: 14px;
        }
        .nz-globe-title {
          font-size: clamp(34px, 5vw, 56px); font-weight: 600;
          letter-spacing: -0.02em; line-height: 1.05;
          color: var(--ink); margin-bottom: 14px;
        }
        .nz-globe-sub {
          font-size: 16px; color: var(--ink-2); max-width: 540px;
          margin: 0 auto; line-height: 1.55;
        }
        .nz-globe-stage {
          position: relative; width: 100%; max-width: 1040px;
          margin: 0 auto; padding: 20px 20px 0;
          cursor: pointer; user-select: none;
        }
        .nz-globe-svg {
          display: block; width: 100%; height: auto;
          max-width: 760px; margin: 0 auto;
        }
        .nz-globe-pulse {
          transform-origin: center; transform-box: fill-box;
          animation: nz-globe-pulse 2.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          opacity: 0;
        }
        @keyframes nz-globe-pulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(3.2); opacity: 0;   }
          100% { transform: scale(3.2); opacity: 0;   }
        }
        .nz-globe-cascade {
          transform-origin: center; transform-box: fill-box;
          animation: nz-globe-cascade 0.9s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 0;
        }
        @keyframes nz-globe-cascade {
          0%   { transform: scale(1);   opacity: 0.9; }
          100% { transform: scale(5);   opacity: 0;   }
        }

        /* Callouts */
        .nz-globe-callout {
          position: absolute; display: flex; align-items: flex-start;
          gap: 14px;
          background: rgba(250, 248, 244, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 16px 20px; border-radius: 6px; max-width: 240px;
          font-size: 13.5px; line-height: 1.5; z-index: 2;
          animation: nz-globe-callout-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes nz-globe-callout-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nz-globe-callout-left {
          top: 22%; left: 4%;
          border: 1px solid rgba(230, 57, 70, 0.4);
          border-left: 2px solid var(--red);
          animation-delay: 0.3s;
        }
        .nz-globe-callout-right {
          top: 56%; right: 4%;
          border: 1px solid rgba(230, 57, 70, 0.4);
          border-right: 2px solid var(--red);
          text-align: right;
          animation-delay: 0.5s;
        }
        .nz-globe-callout-num {
          font-size: 32px; font-weight: 600; color: var(--red);
          line-height: 1; letter-spacing: -0.02em;
        }
        .nz-globe-callout-title {
          font-weight: 700; color: var(--ink); margin-bottom: 4px;
        }
        .nz-globe-callout-text { color: var(--ink-2); font-size: 12.5px; }

        .nz-globe-hint {
          position: absolute; bottom: -6px; left: 50%;
          transform: translateX(-50%);
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--gray-400);
          white-space: nowrap; opacity: 0.7; pointer-events: none;
        }

        /* RTL */
        [dir="rtl"] .nz-globe-callout-left {
          left: auto; right: 4%;
          border-left: 1px solid rgba(230, 57, 70, 0.4);
          border-right: 2px solid var(--red);
          text-align: right;
        }
        [dir="rtl"] .nz-globe-callout-right {
          right: auto; left: 4%;
          border-right: 1px solid rgba(230, 57, 70, 0.4);
          border-left: 2px solid var(--red);
          text-align: left;
        }

        @media (max-width: 860px) {
          .nz-globe-callout { max-width: 200px; padding: 12px 16px; font-size: 12.5px; }
          .nz-globe-callout-num { font-size: 26px; }
          .nz-globe-callout-left  { top: 18%; left: 2%; }
          .nz-globe-callout-right { top: 58%; right: 2%; }
        }
        @media (max-width: 600px) {
          .nz-globe-section { padding: 56px 0 64px; }
          .nz-globe-sub { font-size: 14.5px; padding: 0 20px; }
          .nz-globe-stage { padding: 0 16px; }
          .nz-globe-svg { max-width: 420px; }
          .nz-globe-callout {
            position: static; max-width: none; width: 100%;
            margin: 0; text-align: left;
          }
          [dir="rtl"] .nz-globe-callout-left,
          [dir="rtl"] .nz-globe-callout-right { text-align: right; }
          .nz-globe-callout-left  { margin: 24px auto 12px; }
          .nz-globe-callout-right { margin: 0 auto 8px; }
          .nz-globe-hint {
            position: static; transform: none; display: block;
            text-align: center; margin-top: 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nz-globe-pulse, .nz-globe-cascade { animation: none; opacity: 0; }
          .nz-globe-callout { animation: none; }
        }
      `}</style>
    </section>
  );
}
