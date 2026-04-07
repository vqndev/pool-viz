# Pool Shot Visualizer

A 3D billiards aiming visualization built with Three.js and Vite. Mobile-first, designed to show friends how to aim cut shots using the ghost ball aiming system.

## Overview

The scene shows a partial pool table (one corner pocket with two cushion rails), an object ball, a ghost ball, and a cue ball arranged for a cut shot. The user views the scene from behind the cue ball, looking down the shot line toward the ghost ball, simulating a real shooter's perspective.

## Tech Stack

- **Three.js** for 3D rendering (spheres, planes, lines, lighting)
- **Vite** (vanilla JS template) for dev server and HMR
- **Line2 / LineGeometry / LineMaterial** from Three.js addons for thick lines
- **OrbitControls** for touch-friendly pan/zoom/rotate

## Key Concepts

### Ghost Ball Aiming System
The ghost ball is a transparent/wireframe ball positioned where the cue ball needs to be at the moment of contact with the object ball. Its center is exactly 2 ball radii from the object ball center, along the line from the pocket through the object ball. This is the standard ghost ball aiming method in pocket billiards.

### Cut Angle
The angle between the pocket line (object ball to pocket) and the cue ball's approach line. Presets: 10, 30, 45, 75 degrees. Changing the cut angle moves the cue ball and recalculates all dependent geometry (reference line, spots, camera position).

### Scene Elements

- **Object Ball** (yellow): The target ball, fixed position ~12 inches from the corner pocket.
- **Ghost Ball** (transparent white): Shows where cue ball contacts. Has three display modes: Wire, Solid (MeshPhysicalMaterial with clearcoat/transmission), OFF.
- **Cue Ball** (white): Positioned along the cut angle line from the ghost ball. Moves when cut angle changes.
- **Pocket Line** (white, semi-transparent): Runs through the center of the object ball toward the pocket, extended in both directions. Shows the object ball's intended travel path.
- **Reference Line** (red, thick via Line2): Parallel to the pocket line, offset to the left side of the object ball by 25% of the ball's width (BALL_RADIUS * 0.5). This is an aiming reference. The "left side" means opposite from where the cue ball approaches.
- **Ref Spot** (blue, small sphere): Where the reference line pierces through the object ball surface on the cue-ball side. Off by default.
- **Ghost Spot** (blue, small sphere): Same relative position as ref spot but on the ghost ball. Off by default.

### Units
All measurements are in inches. Ball radius is 1.125" (standard 2.25" diameter ball). Pocket opening radius is 2.25".

## UI Controls (right side, bottom-stacked)

From top to bottom:
1. **Ghost: Wire/Solid/OFF** - Cycles ghost ball display mode. Default: Solid.
2. **Ghost Spot: ON/OFF** - Toggle blue spot on ghost ball. Default: OFF.
3. **Ref Spot: ON/OFF** - Toggle blue spot on object ball. Default: OFF.
4. **Ref Line: ON/OFF** - Toggle red reference line. Default: ON.
5. **Pocket Line: ON/OFF** - Toggle white pocket line. Default: ON.
6. **Lines: Mid-Air/Base/Table** - Cycles line height between ball equator, ball base, and table surface. Default: Mid-Air.
7. **Reset View** - Animated camera reset to default position behind cue ball, looking down the shot line.

**Top center**: Cut angle selector buttons (10, 30, 45, 75 degrees). Active angle is highlighted. Switching angles resets the camera view.

## Lighting

Pool hall style lighting with shadows:
- Ambient light (base illumination)
- Main overhead warm spotlight (casts shadows, simulates pool hall lamp)
- Secondary cross-light spotlight
- Rim light near the pocket for depth
- Table receives shadows, balls cast shadows

## Development

```bash
npm install
npx vite --host 0.0.0.0
```

## Architecture Notes

- All dynamic geometry (cue ball position, reference line, spots) is recalculated in `setCutAngle(deg)`.
- Object ball, ghost ball, pocket line, and pocket position are fixed (they don't change with cut angle).
- The perpendicular offset direction (`perpDir`) is computed once from the pocket line direction.
- Camera default position is stored in `defaultCamPos` and updated in `setCutAngle`. The reset button animates back to this position.
- Line height is a shared variable (`lineHeight`) used by both pocket line and reference line.
