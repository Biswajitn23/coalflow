import React, { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, Square, AlertOctagon, RotateCcw, Sliders, Activity,
  Layers, Zap, Disc, ArrowRight
} from 'lucide-react';
import { playClickSound, playStartSound, playEmergencyStopSound } from '../utils/audio';

const SECTIONS = [
  { id: 'CV-01', name: 'Conveyor 1', role: 'Train Unloading', location: 'Unloads coal from railway wagons', length: '420 meters', rating: '650 tonnes/hr' },
  { id: 'CV-02', name: 'Conveyor 2', role: 'Transfer Belt', location: 'Carries coal to crusher house', length: '310 meters', rating: '650 tonnes/hr' },
  { id: 'CR-01', name: 'Crusher 1', role: 'Coal Crusher', location: 'Breaks big coal into 20mm pebbles', length: 'Rotor 735 RPM', rating: '800 tonnes/hr' },
  { id: 'CV-03', name: 'Conveyor 3', role: 'Sieve Belt', location: 'Moves coal to vibrating screen', length: '280 meters', rating: '700 tonnes/hr' },
  { id: 'MS-01', name: 'Magnet 1', role: 'Iron Separator', location: 'Pulls out nails & scrap iron', length: '1.8 Tesla Magnet', rating: 'Continuous' },
  { id: 'CV-04', name: 'Conveyor 4', role: 'Storage Yard Belt', location: 'Takes coal to 18-day outdoor piles', length: '780 meters', rating: '650 tonnes/hr' },
  { id: 'CV-05', name: 'Conveyor 5', role: 'Boiler Silo Belt', location: 'Fills silos right above the boiler', length: '540 meters', rating: '650 tonnes/hr' },
];

export default function ConveyorSimulation({
  controlState,
  onUpdateControls,
  onTriggerEmergencyStop,
  onResetEmergency,
  liveFlow,
  liveSpeed,
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const [selectedSection, setSelectedSection] = useState('CV-01');

  const [localSpeed, setLocalSpeed] = useState(controlState?.speed_pct ?? 75);
  const [feedRate, setFeedRate] = useState(controlState?.feed_rate_pct ?? 78);

  useEffect(() => {
    if (controlState?.speed_pct !== undefined) {
      setLocalSpeed(controlState.speed_pct);
    }
  }, [controlState?.speed_pct]);

  useEffect(() => {
    if (controlState?.feed_rate_pct !== undefined) {
      setFeedRate(controlState.feed_rate_pct);
    }
  }, [controlState?.feed_rate_pct]);

  const isRunning = controlState?.status === 'RUNNING';
  const isPaused = controlState?.status === 'PAUSED';
  const isStopped = controlState?.status === 'STOPPED';
  const isEmergency = controlState?.status === 'EMERGENCY_STOP';

  const speedRatio = isRunning ? localSpeed / 100 : 0;
  const computedSpeedMs = (speedRatio * 3.45).toFixed(2);
  const computedFlowTph = Math.round((speedRatio * (feedRate / 100)) * 620);

  const simState = useRef({
    beltOffset: 0,
    pulleyAngle: 0,
    particles: [],
    fallingParticles: [],
    unloadingParticles: [],
    dustParticles: [],
    lastTime: performance.now(),
  });

  // Seed coal pieces on belt
  useEffect(() => {
    const particles = [];
    const count = 52;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: 180 + (i / count) * 620 + (Math.random() * 8 - 4),
        yOffset: (Math.random() * 8 - 4),
        size: 7 + Math.random() * 9,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        shade: Math.floor(18 + Math.random() * 18),
        facetColor: Math.floor(45 + Math.random() * 25),
      });
    }
    simState.current.particles = particles;
  }, []);

  // Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let mounted = true;

    const render = (now) => {
      if (!mounted) return;
      const dt = Math.min(0.1, (now - simState.current.lastTime) / 1000);
      simState.current.lastTime = now;

      const W = canvas.width;
      const H = canvas.height;

      const beltStartX = 180;
      const beltEndX = 820;
      const beltY = 200;
      const pulleyRadius = 38;

      if (isRunning && speedRatio > 0) {
        const pxPerSec = speedRatio * 165;
        simState.current.beltOffset = (simState.current.beltOffset + pxPerSec * dt) % 24;
        simState.current.pulleyAngle += (pxPerSec / pulleyRadius) * dt;

        simState.current.particles.forEach((p) => {
          p.x += pxPerSec * dt;
          p.rot += p.rotSpeed * speedRatio;
          if (p.x > beltEndX) {
            if (simState.current.unloadingParticles.length < 32) {
              simState.current.unloadingParticles.push({
                x: beltEndX + pulleyRadius * 0.7,
                y: beltY + (Math.random() * 10 - 5),
                vx: (pxPerSec * 0.8) + (Math.random() * 20 - 10),
                vy: (Math.random() * 20 - 10),
                size: p.size,
                shade: p.shade,
                rot: p.rot,
                rotSpeed: (Math.random() - 0.5) * 6,
                life: 1.0,
              });
            }
            p.x = beltStartX + (Math.random() * 20);
            p.yOffset = (Math.random() * 8 - 4);
          }
        });

        if (Math.random() < speedRatio * 0.45 && simState.current.fallingParticles.length < 18) {
          simState.current.fallingParticles.push({
            x: beltStartX + 10 + (Math.random() * 26 - 13),
            y: 75 + Math.random() * 20,
            vy: 90 + Math.random() * 50,
            size: 6 + Math.random() * 7,
            shade: Math.floor(20 + Math.random() * 15),
            rot: Math.random() * Math.PI,
          });
        }

        if (Math.random() < speedRatio * 0.3 && simState.current.dustParticles.length < 25) {
          simState.current.dustParticles.push({
            x: beltStartX + 15 + (Math.random() * 30 - 15),
            y: beltY - 6 + (Math.random() * 10 - 5),
            vx: (Math.random() - 0.3) * 35,
            vy: -(20 + Math.random() * 30),
            size: 3 + Math.random() * 5,
            alpha: 0.35,
          });
        }

        simState.current.fallingParticles.forEach((fp, idx) => {
          fp.y += fp.vy * dt;
          fp.vy += 320 * dt;
          if (fp.y >= beltY - 4) {
            simState.current.fallingParticles.splice(idx, 1);
          }
        });

        simState.current.unloadingParticles.forEach((up, idx) => {
          up.x += up.vx * dt;
          up.y += up.vy * dt;
          up.vy += 450 * dt;
          up.rot += up.rotSpeed * dt;
          up.life -= dt * 1.6;
          if (up.life <= 0 || up.y > H - 20) {
            simState.current.unloadingParticles.splice(idx, 1);
          }
        });

        simState.current.dustParticles.forEach((dp, idx) => {
          dp.x += dp.vx * dt;
          dp.y += dp.vy * dt;
          dp.size += dt * 6;
          dp.alpha -= dt * 0.65;
          if (dp.alpha <= 0) {
            simState.current.dustParticles.splice(idx, 1);
          }
        });
      }

      // ================= DRAW CLEAN LIGHT THEME CANVAS =================
      ctx.clearRect(0, 0, W, H);

      // Clean Light Background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, W, H);

      // Soft Blueprint Grid Lines
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < W; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // 1. Steel Support Structure
      drawConveyorFrameworkLight(ctx, beltStartX, beltEndX, beltY, H);

      // 2. Return Belt Run
      drawBeltRun(ctx, beltStartX, beltEndX, beltY + 36, simState.current.beltOffset, false);

      // 3. Return Rollers
      drawReturnRollers(ctx, beltStartX, beltEndX, beltY + 44, simState.current.pulleyAngle);

      // 4. Gravity Counterweight Tension Unit
      drawGravityTakeUp(ctx, (beltStartX + beltEndX) / 2, beltY + 36, isRunning);

      // 5. Carrying Idlers
      drawCarryingIdlers(ctx, beltStartX, beltEndX, beltY + 12, simState.current.pulleyAngle);

      // 6. Carrying Belt
      drawBeltRun(ctx, beltStartX, beltEndX, beltY, simState.current.beltOffset, true);

      // 7. Equipment Feature (Crusher / Magnet / Tripper)
      drawSectionFeature(ctx, selectedSection, beltStartX, beltEndX, beltY, isRunning);

      // 8. Coal Pieces on Belt
      simState.current.particles.forEach((p) => {
        drawCoalChunk(ctx, p.x, beltY - 6 + p.yOffset, p.size, p.rot, p.shade, p.facetColor);
      });

      // 9. Falling Coal Pieces in Loading Chute
      simState.current.fallingParticles.forEach((fp) => {
        drawCoalChunk(ctx, fp.x, fp.y, fp.size, fp.rot, fp.shade, 60);
      });

      // 10. Unloading Gravity Arc
      simState.current.unloadingParticles.forEach((up) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, up.life);
        drawCoalChunk(ctx, up.x, up.y, up.size, up.rot, up.shade, 60);
        ctx.restore();
      });

      // 11. Dust Puffs
      simState.current.dustParticles.forEach((dp) => {
        ctx.save();
        ctx.fillStyle = `rgba(148, 163, 184, ${Math.max(0, dp.alpha)})`;
        ctx.beginPath();
        ctx.arc(dp.x, dp.y, dp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 12. Tail Tension Pulley
      drawPulley(ctx, beltStartX, beltY + 18, pulleyRadius, simState.current.pulleyAngle, 'TAIL ROLLER');

      // 13. Head Motorized Drive Pulley
      drawDrivePulley(ctx, beltEndX, beltY + 18, pulleyRadius, simState.current.pulleyAngle, isRunning);

      // 14. Loading Funnel
      drawLoadingChute(ctx, beltStartX, beltY);

      // 15. Discharge Receiver
      drawDischargeHood(ctx, beltEndX, beltY, H);

      // 16. Emergency Overlay if Tripped
      if (isEmergency) {
        drawEmergencyOverlayLight(ctx, W, H);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      mounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isRunning, speedRatio, isEmergency, selectedSection]);

  // Canvas drawing helpers for clean light theme
  function drawConveyorFrameworkLight(ctx, startX, endX, beltY, H) {
    const floorY = H - 35;
    const pylonXs = [startX - 20, startX + 160, startX + 330, startX + 500, endX + 20];

    // Floor Base Line
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, floorY);
    ctx.lineTo(960, floorY);
    ctx.stroke();

    pylonXs.forEach((px) => {
      // Concrete Pedestal
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(px - 18, floorY - 14, 36, 14);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(px - 18, floorY - 14, 36, 14);

      // Steel Columns
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px - 10, floorY - 14);
      ctx.lineTo(px - 10, beltY + 36);
      ctx.moveTo(px + 10, floorY - 14);
      ctx.lineTo(px + 10, beltY + 36);
      ctx.stroke();

      // Cross Bracing
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#cbd5e1';
      for (let y = beltY + 45; y < floorY - 20; y += 30) {
        ctx.beginPath();
        ctx.moveTo(px - 10, y);
        ctx.lineTo(px + 10, y + 25);
        ctx.moveTo(px + 10, y);
        ctx.lineTo(px - 10, y + 25);
        ctx.stroke();
      }
    });

    // Horizontal Steel Beams
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(startX - 30, beltY + 8);
    ctx.lineTo(endX + 30, beltY + 8);
    ctx.moveTo(startX - 30, beltY + 40);
    ctx.lineTo(endX + 30, beltY + 40);
    ctx.stroke();

    // Steel Truss Diagonals
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = startX - 25; x < endX + 25; x += 32) {
      ctx.moveTo(x, beltY + 8);
      ctx.lineTo(x + 16, beltY + 40);
      ctx.lineTo(x + 32, beltY + 8);
    }
    ctx.stroke();

    // Red Emergency Pull-Cord Cable
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(startX - 20, beltY - 14);
    ctx.lineTo(endX + 20, beltY - 14);
    ctx.stroke();
    ctx.setLineDash([]);

    // Emergency Switch Boxes
    [startX + 60, startX + 320, endX - 60].forEach((sx) => {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(sx - 5, beltY - 20, 10, 12);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(sx, beltY - 14, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawBeltRun(ctx, startX, endX, y, offset, isTop) {
    const len = endX - startX;
    // Dark Durable Rubber Belt
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(startX, y, len, 8);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX, y, len, 8);

    // Belt Chevrons
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const step = 22;
    const startOffset = isTop ? offset : -offset;
    for (let x = startX + (startOffset % step) - step; x < endX + step; x += step) {
      if (x >= startX && x <= endX) {
        if (isTop) {
          ctx.moveTo(x - 5, y + 1);
          ctx.lineTo(x, y + 4);
          ctx.lineTo(x - 5, y + 7);
        } else {
          ctx.moveTo(x, y + 1);
          ctx.lineTo(x, y + 7);
        }
      }
    }
    ctx.stroke();
  }

  function drawCarryingIdlers(ctx, startX, endX, y, angle) {
    const step = 56;
    for (let x = startX + 40; x < endX - 30; x += step) {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 12, y + 14);
      ctx.lineTo(x - 8, y + 2);
      ctx.lineTo(x + 8, y + 2);
      ctx.lineTo(x + 12, y + 14);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.fillRect(x - 6, y - 2, 12, 6);
    }
  }

  function drawReturnRollers(ctx, startX, endX, y, angle) {
    const step = 110;
    for (let x = startX + 60; x < endX - 40; x += step) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x - 6, y + 10);
      ctx.lineTo(x + 6, y + 10);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGravityTakeUp(ctx, midX, beltBottomY, isRunning) {
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(midX - 22, beltBottomY - 4, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(midX + 22, beltBottomY - 4, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const bounce = isRunning ? Math.sin(Date.now() / 400) * 2 : 0;
    const carriageY = beltBottomY + 45 + bounce;

    ctx.beginPath();
    ctx.arc(midX, carriageY, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#334155';
    ctx.fill();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(midX - 18, beltBottomY);
    ctx.lineTo(midX - 18, beltBottomY + 80);
    ctx.moveTo(midX + 18, beltBottomY);
    ctx.lineTo(midX + 18, beltBottomY + 80);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.fillRect(midX - 16, carriageY + 16, 32, 22);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(midX - 16, carriageY + 16, 32, 22);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('4.5 TON', midX, carriageY + 30);
  }

  function drawPulley(ctx, x, y, r, angle, label) {
    // Drum Body
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Rotating Spokes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 6; i++) {
      const a = angle + (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8);
      ctx.lineTo(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 4));
      ctx.stroke();
    }

    // Axle Hub
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bearing Pillow Block
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 12, y + r - 4, 24, 14);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(x - 12, y + r - 4, 24, 14);
  }

  function drawDrivePulley(ctx, x, y, r, angle, isRunning) {
    drawPulley(ctx, x, y, r, angle, 'HEAD DRIVE');

    // Gearbox
    const gbX = x + r + 6;
    const gbY = y - 16;
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 2;
    ctx.fillRect(gbX, gbY, 32, 34);
    ctx.strokeRect(gbX, gbY, 32, 34);

    // Motor Stator
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(gbX + 32, gbY - 4, 46, 42);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(gbX + 32, gbY - 4, 46, 42);

    for (let fin = gbX + 36; fin < gbX + 74; fin += 6) {
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(fin, gbY - 4);
      ctx.lineTo(fin, gbY + 38);
      ctx.stroke();
    }

    // Motor Status Light
    ctx.fillStyle = isRunning ? '#16a34a' : '#d97706';
    ctx.beginPath();
    ctx.arc(gbX + 54, gbY + 8, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('132 kW MOTOR', gbX + 16, gbY + 48);
  }

  function drawLoadingChute(ctx, beltStartX, beltY) {
    const chuteX = beltStartX + 20;
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(chuteX - 35, 45);
    ctx.lineTo(chuteX - 16, beltY - 14);
    ctx.lineTo(chuteX + 16, beltY - 14);
    ctx.lineTo(chuteX + 35, 45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.fillRect(chuteX - 22, beltY - 14, 48, 12);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('COAL DROP FUNNEL', chuteX, 38);
  }

  function drawDischargeHood(ctx, beltEndX, beltY, H) {
    const hoodX = beltEndX + 10;
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(beltEndX - 15, beltY - 30);
    ctx.lineTo(hoodX + 50, beltY - 30);
    ctx.lineTo(hoodX + 70, beltY + 40);
    ctx.lineTo(hoodX + 25, H - 38);
    ctx.lineTo(hoodX - 10, H - 38);
    ctx.lineTo(hoodX, beltY + 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('UNLOADING CHUTE', hoodX + 30, H - 22);
  }

  function drawCoalChunk(ctx, x, y, size, rot, shade, facet) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Deep black / anthracite coal rock
    ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 4})`;
    ctx.beginPath();
    ctx.moveTo(-size * 0.7, -size * 0.4);
    ctx.lineTo(-size * 0.2, -size * 0.8);
    ctx.lineTo(size * 0.6, -size * 0.6);
    ctx.lineTo(size * 0.8, size * 0.3);
    ctx.lineTo(size * 0.2, size * 0.7);
    ctx.lineTo(-size * 0.6, size * 0.5);
    ctx.closePath();
    ctx.fill();

    // Shiny facet highlight
    ctx.strokeStyle = `rgb(${facet}, ${facet + 4}, ${facet + 8})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, -size * 0.8);
    ctx.lineTo(size * 0.1, -size * 0.1);
    ctx.lineTo(size * 0.6, -size * 0.6);
    ctx.stroke();

    ctx.restore();
  }

  function drawSectionFeature(ctx, sectionId, startX, endX, beltY, isRunning) {
    const midX = (startX + endX) / 2;

    if (sectionId === 'CR-01') {
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.fillRect(midX - 55, beltY - 70, 110, 60);
      ctx.strokeRect(midX - 55, beltY - 70, 110, 60);

      const rot = isRunning ? (Date.now() / 60) : 0;
      ctx.save();
      ctx.translate(midX, beltY - 40);
      ctx.rotate(rot);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22);
        ctx.stroke();
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(Math.cos(a) * 18 - 4, Math.sin(a) * 18 - 4, 8, 8);
      }
      ctx.restore();

      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRUSHER (735 RPM HAMMERS)', midX, beltY - 76);
    } else if (sectionId === 'MS-01') {
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.fillRect(midX - 45, beltY - 65, 90, 42);
      ctx.strokeRect(midX - 45, beltY - 65, 90, 42);

      if (isRunning) {
        ctx.strokeStyle = '#0284c7';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let fx = midX - 35; fx <= midX + 35; fx += 14) {
          ctx.moveTo(fx, beltY - 23);
          ctx.lineTo(fx, beltY - 8);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('IRON MAGNET (1.8T)', midX, beltY - 72);
    } else if (sectionId === 'CV-05') {
      ctx.fillStyle = '#e0e7ff';
      ctx.fillRect(midX - 35, beltY - 35, 70, 24);
      ctx.strokeStyle = '#4338ca';
      ctx.strokeRect(midX - 35, beltY - 35, 70, 24);

      ctx.fillStyle = '#312e81';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BOILER FEED TRIPPER', midX, beltY - 20);
    }
  }

  function drawEmergencyOverlayLight(ctx, W, H) {
    ctx.save();
    ctx.fillStyle = 'rgba(254, 226, 226, 0.6)';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, W, H);

    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ EMERGENCY STOP ACTIVATED — ALL CONVEYORS STOPPED IMMEDIATELY', W / 2, 24);
    ctx.restore();
  }

  const handleStart = () => {
    playStartSound();
    onUpdateControls({ status: 'RUNNING', speed_pct: localSpeed > 0 ? localSpeed : 75 });
  };

  const handlePause = () => {
    playClickSound();
    onUpdateControls({ status: 'PAUSED' });
  };

  const handleStop = () => {
    playClickSound();
    onUpdateControls({ status: 'STOPPED' });
  };

  const handleEStop = () => {
    playEmergencyStopSound();
    onTriggerEmergencyStop('Emergency Stop Button Pressed');
  };

  const handleSpeedChange = (e) => {
    const val = Number(e.target.value);
    setLocalSpeed(val);
    onUpdateControls({ speed_pct: val });
  };

  const handleSpeedPreset = (val) => {
    playClickSound();
    setLocalSpeed(val);
    onUpdateControls({ speed_pct: val });
  };

  return (
    <div className="conveyor-sim-root">
      {/* Top Banner Status Bar with Simple Words */}
      <div className="sim-header-row">
        <div className="sim-title-group">
          <div className="sim-badge">
            <Activity size={15} className={isRunning ? 'text-emerald-600' : 'text-slate-400'} />
            <span>REAL-TIME ANIMATION (60 FPS)</span>
          </div>
          <h2>Conveyor Belt Live Movement</h2>
          <p className="sim-subtitle">
            See the rubber belt rolling, coal lumps moving from left to right, and coal unloading into chutes.
          </p>
        </div>

        {/* Live Simple Telemetry */}
        <div className="sim-live-telemetry">
          <div className="telemetry-box">
            <span className="telemetry-label">BELT SPEED</span>
            <div className="telemetry-value">
              <strong>{computedSpeedMs}</strong>
              <span className="telemetry-unit">m/s</span>
            </div>
            <div className="telemetry-sub">Slider: {localSpeed}%</div>
          </div>

          <div className="telemetry-box highlight">
            <span className="telemetry-label">COAL CARRIED</span>
            <div className="telemetry-value">
              <strong>{computedFlowTph}</strong>
              <span className="telemetry-unit">tonnes/hr</span>
            </div>
            <div className="telemetry-sub">Full capacity: 650 t/h</div>
          </div>

          <div className="telemetry-box">
            <span className="telemetry-label">BELT STATE</span>
            <div className="telemetry-value">
              <span className={`status-led ${isEmergency ? 'led-critical' : isRunning ? 'led-good' : isPaused ? 'led-warning' : 'led-idle'}`} />
              <strong className="status-text">{isEmergency ? 'TRIPPED' : isRunning ? 'RUNNING' : isPaused ? 'PAUSED' : 'STOPPED'}</strong>
            </div>
            <div className="telemetry-sub">Pull cords: Healthy</div>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className={`canvas-viewport-container ${isEmergency ? 'viewport-emergency' : ''}`}>
        <canvas
          ref={canvasRef}
          width={980}
          height={380}
          className="conveyor-canvas"
        />

        {isEmergency && (
          <div className="emergency-banner-overlay">
            <div className="emergency-card">
              <AlertOctagon size={48} className="text-red-600 animate-pulse" />
              <h3>EMERGENCY STOP PRESSED</h3>
              <p>Conveyors have stopped immediately to ensure plant safety.</p>
              <button className="reset-estop-btn" onClick={() => { playClickSound(); onResetEmergency(); }}>
                <RotateCcw size={16} /> Click to Reset &amp; Ready Conveyor
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clean Control Buttons */}
      <div className="sim-controls-panel">
        <div className="control-buttons-group">
          <button
            className={`ctrl-btn btn-start ${isRunning ? 'active' : ''}`}
            onClick={handleStart}
            disabled={isEmergency}
          >
            <Play size={16} fill="currentColor" />
            <span>START BELT</span>
          </button>

          <button
            className={`ctrl-btn btn-pause ${isPaused ? 'active' : ''}`}
            onClick={handlePause}
            disabled={isEmergency || isStopped}
          >
            <Pause size={16} fill="currentColor" />
            <span>PAUSE BELT</span>
          </button>

          <button
            className={`ctrl-btn btn-stop ${isStopped ? 'active' : ''}`}
            onClick={handleStop}
            disabled={isEmergency}
          >
            <Square size={16} fill="currentColor" />
            <span>STOP BELT</span>
          </button>

          <button
            className="ctrl-btn btn-estop"
            onClick={handleEStop}
          >
            <AlertOctagon size={18} />
            <span>EMERGENCY STOP</span>
          </button>
        </div>

        {/* Speed Adjustment Slider */}
        <div className="speed-slider-container">
          <div className="slider-header">
            <div className="slider-label">
              <Sliders size={14} />
              <span>Conveyor Speed Control: Slow to Fast</span>
            </div>
            <strong className="slider-percentage">{localSpeed}%</strong>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={localSpeed}
            onChange={handleSpeedChange}
            className="speed-range-slider"
            disabled={isEmergency}
          />

          <div className="speed-presets">
            {[
              { label: '0% Stop', val: 0 },
              { label: '25% Slow', val: 25 },
              { label: '50% Medium', val: 50 },
              { label: '75% Fast', val: 75 },
              { label: '100% Max', val: 100 },
            ].map((p) => (
              <button
                key={p.val}
                className={`preset-btn ${localSpeed === p.val ? 'active' : ''}`}
                onClick={() => handleSpeedPreset(p.val)}
                disabled={isEmergency}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Select Different Sections */}
      <div className="sim-sections-block">
        <div className="sections-header">
          <div className="sections-title">
            <Layers size={16} />
            <span>Explore Different Sections of the Coal Route</span>
          </div>
          <span className="sections-hint">Click any section to inspect what it does</span>
        </div>

        <div className="sections-grid">
          {SECTIONS.map((sec) => {
            const isSelected = selectedSection === sec.id;
            return (
              <button
                key={sec.id}
                className={`section-card ${isSelected ? 'selected' : ''}`}
                onClick={() => { playClickSound(); setSelectedSection(sec.id); }}
              >
                <div className="section-card-top">
                  <span className="section-code">{sec.id}</span>
                  <span className="section-dot" />
                </div>
                <strong className="section-name">{sec.role}</strong>
                <span className="section-role">{sec.location}</span>
                <div className="section-footer">
                  <span>{sec.rating}</span>
                  <span>{sec.length}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
